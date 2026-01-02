import { useState } from 'react';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { Shield, Loader2, Sparkles, Binary } from 'lucide-react';
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useSystemAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error.message || result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-bg relative overflow-hidden p-6">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 bg-grid-admin opacity-[0.03]" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-admin-info/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-admin-accent/5 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md bg-admin-card border-admin-border shadow-2xl z-10 relative group overflow-hidden">
        {/* Animated accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-admin-info via-admin-accent to-admin-info animate-shimmer" />

        <CardHeader className="text-center space-y-6 pt-10 pb-4">
          <div className="mx-auto w-20 h-20 bg-admin-info/10 rounded-3xl flex items-center justify-center border border-admin-info/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
            <Shield className="h-10 w-10 text-admin-info" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-roboto-slab font-bold text-admin-text tracking-tight uppercase tracking-wider">Secure Access</CardTitle>
            <CardDescription className="text-admin-text-muted text-[11px] font-bold uppercase tracking-[0.2em] opacity-70">
              Administrative Control Protocol
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-8 pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-admin-error/5 border border-admin-error/20 text-admin-error text-[11px] font-bold uppercase tracking-wider animate-in shake duration-500">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted px-1">Identity Chain (Email)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@parity.core"
                required
                autoComplete="email"
                className="h-12 bg-admin-bg-muted/50 border-admin-border focus:border-admin-info focus:ring-4 focus:ring-admin-info/5 rounded-xl transition-all font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted px-1">Access Fragment (Password)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                className="h-12 bg-admin-bg-muted/50 border-admin-border focus:border-admin-info focus:ring-4 focus:ring-admin-info/5 rounded-xl transition-all font-mono text-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-admin-info hover:bg-admin-info/90 text-white font-bold uppercase tracking-widest rounded-xl shadow-xl hover:shadow-admin-info/20 transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Binary className="h-4 w-4" />
                  Sign In
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 opacity-30">
              <div className="h-px w-8 bg-admin-border" />
              <Sparkles className="h-4 w-4 text-admin-info" />
              <div className="h-px w-8 bg-admin-border" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-admin-text-muted text-center max-w-[240px] leading-relaxed">
              Access restricted to authorized architects and system overseers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
