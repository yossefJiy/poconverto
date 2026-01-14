import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClientLogoUploaderProps {
  clientId: string;
  currentLogoUrl: string | null;
  onUploadComplete: (url: string) => void;
  onRemove?: () => void;
  className?: string;
}

export function ClientLogoUploader({
  clientId,
  currentLogoUrl,
  onUploadComplete,
  onRemove,
  className,
}: ClientLogoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("יש להעלות קובץ תמונה בלבד");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("גודל הקובץ חייב להיות עד 5MB");
      return;
    }

    setUploading(true);

    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${clientId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from("client-media")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("client-media")
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;
      setPreviewUrl(publicUrl);
      onUploadComplete(publicUrl);
      toast.success("הלוגו הועלה בהצלחה");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("שגיאה בהעלאת הלוגו: " + error.message);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onRemove?.();
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label className="text-sm font-medium text-muted-foreground block">לוגו</label>
      
      <div className="flex items-center gap-4">
        {/* Logo preview with white background */}
        <div className="relative">
          <div className={cn(
            "w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden shadow-md",
            "bg-white border-2 border-border"
          )}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="לוגו לקוח"
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
            )}
          </div>
          {previewUrl && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Upload button */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                מעלה...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                העלה לוגו
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            PNG, JPG עד 5MB
          </span>
        </div>
      </div>
    </div>
  );
}