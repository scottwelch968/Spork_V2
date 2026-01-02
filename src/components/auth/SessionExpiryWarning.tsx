import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock } from 'lucide-react';

interface SessionExpiryWarningProps {
  open: boolean;
  timeRemainingMs: number;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionExpiryWarning({
  open,
  timeRemainingMs,
  onExtend,
  onLogout,
}: SessionExpiryWarningProps) {
  // Start countdown at 2 minutes (120 seconds) when dialog opens
  const [countdown, setCountdown] = useState(120);

  useEffect(() => {
    if (!open) return;
    
    // Reset to 2 minutes when dialog opens
    setCountdown(120);
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]); // Only depend on open - countdown is self-managed

  // Auto-logout when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && open) {
      onLogout();
    }
  }, [countdown, open, onLogout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Session Expiring Soon
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Your session will expire due to inactivity. You will be logged out in:
              </p>
              <div className="text-center py-4">
                <span className="text-4xl font-bold text-amber-500">
                  {formatTime(countdown)}
                </span>
              </div>
              <p>
                Would you like to extend your session?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onLogout}>
            Log Out Now
          </AlertDialogCancel>
          <AlertDialogAction onClick={onExtend}>
            Extend Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
