import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, File, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PendingAttachment {
  id: string;
  file: File;
  preview?: string;
}

interface NewTaskAttachmentsProps {
  attachments: PendingAttachment[];
  onAttachmentsChange: (attachments: PendingAttachment[]) => void;
  disabled?: boolean;
}

export function NewTaskAttachments({ 
  attachments, 
  onAttachmentsChange,
  disabled 
}: NewTaskAttachmentsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newAttachments: PendingAttachment[] = [];
    
    Array.from(files).forEach((file) => {
      const id = crypto.randomUUID();
      const isImage = file.type.startsWith('image/');
      
      const pending: PendingAttachment = {
        id,
        file,
        preview: isImage ? URL.createObjectURL(file) : undefined,
      };
      
      newAttachments.push(pending);
    });

    onAttachmentsChange([...attachments, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    const attachment = attachments.find(a => a.id === id);
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    onAttachmentsChange(attachments.filter(a => a.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
        />
        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          גרור קבצים לכאן או לחץ לבחירה
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          הקבצים יישמרו לאחר יצירת המשימה
        </p>
      </div>

      {/* Pending Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{attachments.length} קבצים ממתינים להעלאה</p>
          <div className="grid gap-2">
            {attachments.map((attachment) => (
              <div 
                key={attachment.id}
                className="flex items-center gap-3 p-2 border rounded-lg bg-muted/30"
              >
                {attachment.preview ? (
                  <img 
                    src={attachment.preview} 
                    alt={attachment.file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
                    <File className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAttachment(attachment.id);
                  }}
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
