import { Loader2, Shield } from "lucide-react";

interface AuthLoadingStateProps {
  message?: string;
}

export function AuthLoadingState({ message = "ממתין להתחברות..." }: AuthLoadingStateProps) {
  return (
    <div className="glass rounded-xl p-8 card-shadow">
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-primary absolute -bottom-1 -right-1" />
        </div>
        <div className="text-center">
          <p className="font-medium text-lg">{message}</p>
          <p className="text-sm text-muted-foreground mt-1">
            יש להמתין לסיום תהליך האימות לפני טעינת הנתונים
          </p>
        </div>
      </div>
    </div>
  );
}
