import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { GoogleAuthButton } from './GoogleAuthButton';
interface LoginFormProps {
  onSwitchToSignup: () => void;
}
export function LoginForm({
  onSwitchToSignup
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    signIn
  } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  };
  return <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-roboto-slab font-semibold tracking-tight">Sign in</h1>
        
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button type="button" className="text-sm text-primary hover:underline" onClick={() => {/* TODO: Forgot password functionality */}}>
              Forgot password?
            </button>
          </div>
          <Input id="password" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="keep-logged-in" checked={keepLoggedIn} onCheckedChange={checked => setKeepLoggedIn(checked as boolean)} />
          <Label htmlFor="keep-logged-in" className="text-sm font-normal cursor-pointer">
            Keep me logged in
          </Label>
        </div>

        <Button type="submit" className="w-full bg-black hover:bg-black/90 text-white" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">OR</span>
        </div>
      </div>

      <GoogleAuthButton />

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToSignup} className="text-primary hover:underline font-medium">
          Sign up
        </button>
      </p>
    </div>;
}