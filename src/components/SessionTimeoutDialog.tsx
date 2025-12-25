import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SessionTimeoutDialogProps {
  open: boolean;
  remainingTime: number;
  onExtendSession: () => void;
}

export function SessionTimeoutDialog({
  open,
  remainingTime,
  onExtendSession,
}: SessionTimeoutDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>האם אתה עדיין כאן?</AlertDialogTitle>
          <AlertDialogDescription>
            תנותק אוטומטית בעוד {remainingTime} שניות עקב חוסר פעילות.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onExtendSession}>
            כן, אני כאן
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
