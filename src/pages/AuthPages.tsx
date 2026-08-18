import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import logo from '@/assets/pachu-logo.png';

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-76px)] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:grid-cols-2">
        <div className="relative hidden md:block">
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(2,44,34,.96),rgba(4,78,59,.82)),url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85')] bg-cover bg-center" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <Link to="/" className="inline-flex items-center gap-3">
              <img src={logo} alt="Pachu Haven Homes Ltd" className="h-11 w-11 shrink-0 object-contain" />
              <span className="leading-none"><span className="block text-[14px] font-extrabold tracking-[0.15em]">PACHU HAVEN</span><span className="mt-1 block text-[10px] font-semibold tracking-[0.3em] text-gold-300">HOMES LTD</span></span>
            </Link>
            <div>
              <p className="eyebrow text-gold-300">Your account</p>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight">Spaces worth coming home to, saved for whenever you are.</h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-50/70">Create an account to save your favourite listings and keep track of the places that feel right.</p>
            </div>
          </div>
        </div>
        <div className="p-7 sm:p-10">
          <div className="md:hidden"><Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold-600">Pachu Haven Homes Ltd</Link></div>
          <h1 className="mt-2 text-2xl font-extrabold text-forest-950 md:mt-0">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}

function Field({ icon, type = 'text', label, value, onChange, required = true, autoComplete }: { icon: React.ReactNode; type?: string; label: string; value: string; onChange: (value: string) => void; required?: boolean; autoComplete?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input type={type} value={value} required={required} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-forest-700 focus:ring-2 focus:ring-forest-100" />
      </div>
    </label>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message.includes('Invalid login') ? 'That email or password does not match an account.' : error.message);
      return;
    }
    navigate('/account');
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your saved properties and profile.">
      <form onSubmit={submit} className="space-y-5">
        <Field icon={<Mail size={16} />} type="email" label="Email" value={email} onChange={setEmail} autoComplete="email" />
        <Field icon={<Lock size={16} />} type="password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
        <div className="flex justify-end"><Link to="/reset" className="text-xs font-bold text-gold-700 hover:text-gold-800">Forgot password?</Link></div>
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-forest-800 text-sm font-bold text-white transition hover:bg-forest-700 disabled:opacity-60">{busy ? 'Signing in...' : 'Log in'} <ArrowRight size={16} /></button>
        <p className="text-center text-sm text-slate-500">New to Pachu Haven Homes Ltd? <Link to="/signup" className="font-bold text-forest-800 hover:text-forest-700">Create an account</Link></p>
      </form>
    </AuthShell>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Please choose a password of at least 6 characters.');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      navigate('/account');
    } else {
      navigate('/login', { state: { notice: 'Account created. Please log in to continue.' } });
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Save listings and keep track of the spaces you love.">
      <form onSubmit={submit} className="space-y-5">
        <Field icon={<User size={16} />} label="Full name" value={fullName} onChange={setFullName} autoComplete="name" />
        <Field icon={<Mail size={16} />} type="email" label="Email" value={email} onChange={setEmail} autoComplete="email" />
        <Field icon={<Lock size={16} />} type="password" label="Password" value={password} onChange={setPassword} autoComplete="new-password" />
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-forest-800 text-sm font-bold text-white transition hover:bg-forest-700 disabled:opacity-60">{busy ? 'Creating...' : 'Create account'} <ArrowRight size={16} /></button>
        <p className="text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-bold text-forest-800 hover:text-forest-700">Log in</Link></p>
      </form>
    </AuthShell>
  );
}

export function ResetPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell title="Reset your password" subtitle="We will email you a secure link to set a new password.">
      {sent ? (
        <div className="space-y-5">
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">If an account exists for {email}, a reset link is on its way. Please check your inbox.</p>
          <Link to="/login" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-forest-800 text-sm font-bold text-white transition hover:bg-forest-700">Back to log in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <Field icon={<Mail size={16} />} type="email" label="Email" value={email} onChange={setEmail} autoComplete="email" />
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-forest-800 text-sm font-bold text-white transition hover:bg-forest-700 disabled:opacity-60">{busy ? 'Sending...' : 'Send reset link'} <ArrowRight size={16} /></button>
          <p className="text-center text-sm text-slate-500"><Link to="/login" className="font-bold text-forest-800 hover:text-forest-700">Back to log in</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
