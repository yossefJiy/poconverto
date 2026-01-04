import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskInput {
  title: string;
  description?: string;
  departments?: string[];
  teamMembers?: { id: string; name: string; departments: string[] }[];
  categories?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, departments, teamMembers, categories }: TaskInput = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing task assignment for:", title);

    const systemPrompt = `אתה עוזר AI לניהול משימות בסוכנות שיווק דיגיטלי.
תפקידך להמליץ על שיוך אופטימלי של משימות למחלקות, קטגוריות ואנשי צוות.

רשימת המחלקות הזמינות:
${departments?.join(", ") || "שיווק, פיתוח, עיצוב, ניהול לקוחות, מכירות"}

רשימת הקטגוריות הזמינות:
${categories?.join(", ") || "אסטרטגיה ותכנון, קריאייטיב ועיצוב, קמפיינים ופרסום, ניתוח נתונים, תפעול וניהול, פיתוח ומערכות, תוכן ו-SEO, לקוחות ומכירות, מנהל מוצר"}

${teamMembers?.length ? `רשימת אנשי צוות זמינים:
${teamMembers.map(m => `- ${m.name} (מחלקות: ${m.departments.join(", ")})`).join("\n")}` : ""}

בהינתן כותרת ותיאור משימה, החזר המלצות בפורמט JSON בלבד.`;

    const userPrompt = `משימה: "${title}"
${description ? `תיאור: "${description}"` : ""}

המלץ על:
1. מחלקה מתאימה
2. קטגוריה מתאימה  
3. איש צוות אחראי (אם יש רשימה)
4. עדיפות (low/medium/high)`;

    const body: any = {
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "assign_task",
            description: "Assign task to department, category, and team member",
            parameters: {
              type: "object",
              properties: {
                department: {
                  type: "string",
                  description: "The recommended department for this task",
                },
                category: {
                  type: "string",
                  description: "The recommended category for this task",
                },
                assignee_name: {
                  type: "string",
                  description: "The recommended team member name to assign",
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high"],
                  description: "The recommended priority level",
                },
                reasoning: {
                  type: "string",
                  description: "Brief explanation for the recommendations in Hebrew",
                },
              },
              required: ["department", "category", "priority", "reasoning"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "assign_task" } },
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const recommendation = JSON.parse(toolCall.function.arguments);
    console.log("Recommendation:", recommendation);

    return new Response(JSON.stringify({ recommendation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-task-assignment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
