import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSpaceManagement } from '@/hooks/useSpaceManagement';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';

export default function AcceptInvite() {
  const { token } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { acceptInvitation } = useSpaceManagement();

  useEffect(() => {
    if (!authLoading && user && token) {
      handleAcceptInvitation();
    } else if (!authLoading && !user) {
      navigate('/auth', { state: { inviteToken: token } });
    }
  }, [user, authLoading, token]);

  const handleAcceptInvitation = async () => {
    if (!token) return;

    try {
      const result = await acceptInvitation(token);
      setStatus('success');
      setMessage('Successfully joined space!');
      setTimeout(() => {
        navigate('/workspace');
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to accept invitation');
    }
  };

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <h2 className="text-xl font-semibold font-roboto-slab">Processing Invitation...</h2>
          <p className="text-muted-foreground">Please wait while we add you to the space</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 max-w-md w-full text-center space-y-4">
        {status === 'success' ? (
          <>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold font-roboto-slab">Success!</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting to space...</p>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto">
              <X className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold font-roboto-slab">Error</h2>
            <p className="text-muted-foreground">{message}</p>
            <Button onClick={() => navigate('/')}>Go to Home</Button>
          </>
        )}
      </Card>
    </div>
  );
}
