import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!resendApiKey) {
      throw new Error('Missing RESEND_API_KEY');
    }

    const { sessionId, email } = await req.json();

    if (!sessionId || !email) {
      throw new Error('Missing sessionId or email');
    }

    // Fetch session and dialogue parts
    const sessionResponse = await fetch(
      `${supabaseUrl}/rest/v1/planning_sessions?id=eq.${sessionId}&select=*`,
      {
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    
    const sessions = await sessionResponse.json();
    const session = sessions[0];

    if (!session) {
      throw new Error('Session not found');
    }

    const partsResponse = await fetch(
      `${supabaseUrl}/rest/v1/planning_dialogue_parts?session_id=eq.${sessionId}&order=part_number&select=*`,
      {
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    
    const parts = await partsResponse.json();

    if (!parts || parts.length === 0) {
      throw new Error('No dialogue parts found');
    }

    // Build HTML email
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.8;
      color: #1a1a2e;
      background: #f8f9fa;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px;
      font-size: 28px;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
    }
    .toc {
      background: #f8f9fa;
      padding: 30px 40px;
      border-bottom: 1px solid #eee;
    }
    .toc h2 {
      margin: 0 0 15px;
      font-size: 18px;
      color: #667eea;
    }
    .toc-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      color: #666;
      text-decoration: none;
    }
    .toc-item:hover {
      color: #667eea;
    }
    .toc-number {
      background: #667eea;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }
    .content {
      padding: 40px;
    }
    .part {
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 1px solid #eee;
    }
    .part:last-child {
      border-bottom: none;
    }
    .part-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
    }
    .part-number {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    .part-title {
      font-size: 20px;
      margin: 0;
      color: #1a1a2e;
    }
    .prompt {
      background: #e8f4f8;
      padding: 15px 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      border-right: 4px solid #667eea;
    }
    .prompt-label {
      font-size: 12px;
      color: #667eea;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .response {
      white-space: pre-wrap;
      line-height: 1.8;
    }
    .key-points {
      background: #fff8e6;
      padding: 20px;
      border-radius: 10px;
      margin-top: 20px;
    }
    .key-points h4 {
      margin: 0 0 10px;
      color: #f5a623;
      font-size: 14px;
    }
    .key-points ul {
      margin: 0;
      padding-right: 20px;
    }
    .key-points li {
      margin-bottom: 5px;
    }
    .footer {
      background: #1a1a2e;
      color: white;
      padding: 30px 40px;
      text-align: center;
    }
    .footer p {
      margin: 0;
      opacity: 0.7;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 ${session.title}</h1>
      <p>סיכום מפגש תכנון | ${new Date(session.created_at).toLocaleDateString('he-IL')}</p>
    </div>
    
    <div class="toc">
      <h2>תוכן עניינים</h2>
      ${parts.map((part: any, i: number) => `
        <div class="toc-item">
          <span class="toc-number">${i + 1}</span>
          <span>${part.title}</span>
        </div>
      `).join('')}
    </div>
    
    <div class="content">
      ${parts.map((part: any, i: number) => `
        <div class="part" id="part-${i + 1}">
          <div class="part-header">
            <span class="part-number">${i + 1}</span>
            <h3 class="part-title">${part.title}</h3>
          </div>
          
          <div class="prompt">
            <div class="prompt-label">שאלה:</div>
            ${part.prompt}
          </div>
          
          <div class="response">${part.response || 'טרם התקבלה תשובה'}</div>
          
          ${part.key_points && part.key_points.length > 0 ? `
            <div class="key-points">
              <h4>💡 נקודות מפתח:</h4>
              <ul>
                ${part.key_points.map((point: string) => `<li>${point}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    
    <div class="footer">
      <p>נוצר על ידי JIY Digital Agency | מערכת אפיון ותכנון</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'JIY Planning <planning@jiy.co.il>',
        to: [email],
        subject: `📋 סיכום מפגש: ${session.title}`,
        html: htmlContent
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend error:', errorText);
      throw new Error('Failed to send email');
    }

    // Log export
    await fetch(`${supabaseUrl}/rest/v1/planning_exports`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey!,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        export_type: 'email',
        recipient_email: email,
        status: 'sent',
        sent_at: new Date().toISOString()
      })
    });

    return new Response(
      JSON.stringify({ success: true, email }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
