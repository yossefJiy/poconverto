import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Paperclip, Image, Video, FileText, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskAttachmentsBadgeProps {
  taskId: string;
  className?: string;
}

export function TaskAttachmentsBadge({ taskId, className }: TaskAttachmentsBadgeProps) {
  const { data: attachments = [] } = useQuery({
    queryKey: ["task-attachments-count", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_attachments")
        .select("id, attachment_type")
        .eq("task_id", taskId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!taskId,
    staleTime: 30000, // Cache for 30 seconds
  });

  if (attachments.length === 0) return null;

  // Count by type
  const typeCounts = attachments.reduce((acc, att) => {
    acc[att.attachment_type] = (acc[att.attachment_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hasImages = typeCounts.image > 0;
  const hasVideos = typeCounts.video > 0;
  const hasFiles = typeCounts.file > 0;
  const hasLinks = typeCounts.link > 0;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Badge 
        variant="secondary" 
        className="h-5 px-1.5 gap-0.5 text-xs font-normal"
      >
        <Paperclip className="w-3 h-3" />
        {attachments.length}
      </Badge>
      
      {/* Small type indicators */}
      <div className="flex items-center gap-0.5">
        {hasImages && (
          <span className="text-muted-foreground" title={`${typeCounts.image} תמונות`}>
            <Image className="w-3 h-3" />
          </span>
        )}
        {hasVideos && (
          <span className="text-muted-foreground" title={`${typeCounts.video} סרטונים`}>
            <Video className="w-3 h-3" />
          </span>
        )}
        {hasFiles && (
          <span className="text-muted-foreground" title={`${typeCounts.file} קבצים`}>
            <FileText className="w-3 h-3" />
          </span>
        )}
        {hasLinks && (
          <span className="text-muted-foreground" title={`${typeCounts.link} קישורים`}>
            <LinkIcon className="w-3 h-3" />
          </span>
        )}
      </div>
    </div>
  );
}
