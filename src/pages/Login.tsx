import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Simple local auth using localStorage (no backend required)
const USERS_KEY = 'satguard_users';
const SESSION_KEY = 'satguard_session';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function getSession(): AuthUser | null {
  try {
    const s = localStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function setSession(user: AuthUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function getUsers(): Array<AuthUser & { password: string }> {
  try {
    const u = localStorage.getItem(USERS_KEY);
    return u ? JSON.parse(u) : [];
  } catch { return []; }
}

function saveUser(user: AuthUser & { password: string }) {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === 'signup' && !name)) {
      toast({ title: 'Missing fields', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    if (mode === 'signup') {
      const users = getUsers();
      if (users.find(u => u.email === email)) {
        toast({ title: 'Email already registered', description: 'Try logging in instead.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const user: AuthUser = {
        id: Date.now().toString(),
        name, email, role: 'Officer',
        createdAt: new Date().toISOString(),
      };
      saveUser({ ...user, password });
      setSession(user);
      toast({ title: 'Account created', description: `Welcome, ${name}!` });
      navigate('/dashboard');
    } else {
      const users = getUsers();
      const found = users.find(u => u.email === email && u.password === password);
      if (!found) {
        toast({ title: 'Invalid credentials', description: 'Check your email and password.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const { password: _, ...user } = found;
      setSession(user);
      toast({ title: 'Welcome back', description: `Logged in as ${user.name}` });
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-3">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">SATGUARD</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-Powered Mining Detection</p>
        </div>

        <div className="glass-card p-6 space-y-5">
          {/* Toggle */}
          <div className="flex bg-secondary/50 rounded-lg p-1 gap-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 text-sm py-1.5 rounded-md transition-all font-medium ${mode === 'login' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 text-sm py-1.5 rounded-md transition-all font-medium ${mode === 'signup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <Label className="text-muted-foreground text-sm">Full Name</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Amit Sharma"
                  className="mt-1 bg-secondary/50"
                />
              </div>
            )}
            <div>
              <Label className="text-muted-foreground text-sm">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="officer@satguard.in"
                className="mt-1 bg-secondary/50"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary/50 pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {mode === 'login' ? 'Login' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-primary hover:underline font-medium">
              {mode === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <Link to="/" className="hover:text-foreground transition-colors">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
