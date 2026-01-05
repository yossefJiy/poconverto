import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Lead, useLeads } from "@/hooks/useLeads";
import { LeadCard } from "./LeadCard";
import { 
  Sparkles, 
  Phone, 
  UserCheck, 
  FileText, 
  Handshake, 
  Trophy, 
  XCircle 
} from "lucide-react";

interface LeadPipelineProps {
  clientId?: string;
  onLeadClick?: (lead: Lead) => void;
  onLeadEdit?: (lead: Lead) => void;
  onLeadDelete?: (lead: Lead) => void;
}

const stages = [
  { id: "new", label: "חדשים", icon: Sparkles, color: "text-blue-500" },
  { id: "contacted", label: "נוצר קשר", icon: Phone, color: "text-purple-500" },
  { id: "qualified", label: "מוסמכים", icon: UserCheck, color: "text-cyan-500" },
  { id: "proposal", label: "הצעות", icon: FileText, color: "text-amber-500" },
  { id: "negotiation", label: "משא ומתן", icon: Handshake, color: "text-orange-500" },
  { id: "won", label: "נסגרו", icon: Trophy, color: "text-success" },
  { id: "lost", label: "אבודים", icon: XCircle, color: "text-destructive" },
];

export function LeadPipeline({ clientId, onLeadClick, onLeadEdit, onLeadDelete }: LeadPipelineProps) {
  const { leads, pipelineStats, updateStage } = useLeads(clientId);

  const leadsByStage = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    stages.forEach(s => { grouped[s.id] = []; });
    
    leads.forEach(lead => {
      const stage = lead.pipeline_stage || "new";
      if (grouped[stage]) {
        grouped[stage].push(lead);
      } else {
        grouped.new.push(lead);
      }
    });

    return grouped;
  }, [leads]);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData("leadId", lead.id);
    e.dataTransfer.setData("currentStage", lead.pipeline_stage);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    const currentStage = e.dataTransfer.getData("currentStage");
    
    if (currentStage !== targetStage) {
      updateStage({ id: leadId, stage: targetStage });
    }
  };

  const totalValue = leads
    .filter(l => l.pipeline_stage === "won")
    .reduce((sum, l) => sum + (l.conversion_value || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
        <div>
          <p className="text-sm text-muted-foreground">סה״כ לידים</p>
          <p className="text-2xl font-bold">{leads.length}</p>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <p className="text-sm text-muted-foreground">שווי נסגר</p>
          <p className="text-2xl font-bold text-success">₪{totalValue.toLocaleString()}</p>
        </div>
        <div className="h-10 w-px bg-border" />
        <div>
          <p className="text-sm text-muted-foreground">אחוז המרה</p>
          <p className="text-2xl font-bold">
            {leads.length > 0 
              ? ((leadsByStage.won?.length || 0) / leads.length * 100).toFixed(0)
              : 0}%
          </p>
        </div>
      </div>

      {/* Pipeline Columns */}
      <div className="grid grid-cols-7 gap-3 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const StageIcon = stage.icon;
          const stageLeads = leadsByStage[stage.id] || [];
          const stageValue = stageLeads.reduce((sum, l) => sum + (l.conversion_value || 0), 0);

          return (
            <Card 
              key={stage.id}
              className="min-w-[200px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StageIcon className={cn("w-4 h-4", stage.color)} />
                    <span>{stage.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stageLeads.length}
                  </Badge>
                </CardTitle>
                {stageValue > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ₪{stageValue.toLocaleString()}
                  </p>
                )}
              </CardHeader>
              <CardContent className="px-2 pb-2">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2 px-1">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        className="cursor-move"
                      >
                        <LeadCard
                          lead={lead}
                          onClick={() => onLeadClick?.(lead)}
                          onEdit={() => onLeadEdit?.(lead)}
                          onDelete={() => onLeadDelete?.(lead)}
                          className="text-sm"
                        />
                      </div>
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="py-8 text-center text-muted-foreground text-xs">
                        גרור לידים לכאן
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
