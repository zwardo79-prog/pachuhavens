import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Heart, LogOut, Mail, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useSavedProperties } from '@/lib/useSavedProperties';
import { supabase } from '@/lib/supabase';
import type { Property } from '@/types';
import { PropertyCard } from '@/components/PropertyCard';

export function ProfilePage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { savedIds } = useSavedProperties();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) setFullName(profile.full_name);
  }, [profile]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const { error } = await supabase.from('profiles').update({ full_name: fullName, updated_at: new Date().toISOString() }).eq('id', user!.id);
    setSaving(false);
    if (error) {
      setError('Could not save your changes. Please try again.');
      return;
    }
    await refreshProfile();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="eyebrow">Account</p>
          <h1 className="mt-3 text-2xl font-extrabold text-forest-950">Please log in to view your profile</h1>
          <p className="mt-2 text-sm text-slate-500">Your saved properties and account details live here.</p>
          <Link to="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-forest-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-forest-700">Log in <ArrowRight size={16} /></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <p className="eyebrow">Your account</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-forest-950">Profile</h1>
      <p className="mt-3 text-slate-500">Manage your details and saved spaces in one place.</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-extrabold text-slate-900">Edit your details</h2>
          <p className="mt-1 text-sm text-slate-500">Update the name shown across your account.</p>
          <form onSubmit={submit} className="mt-6 space-y-5">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Full name</span>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><User size={16} /></span>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-forest-700 focus:ring-2 focus:ring-forest-100" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</span>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={16} /></span>
                <input value={user.email ?? ''} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm font-medium text-slate-400 outline-none" />
              </div>
            </label>
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <div className="flex items-center gap-4">
              <button disabled={saving} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-forest-800 px-6 text-sm font-bold text-white transition hover:bg-forest-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'} <ArrowRight size={16} /></button>
              {saved && <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><Check size={15} /> Saved</span>}
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900">Account summary</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between"><dt className="text-slate-500">Name</dt><dd className="font-bold text-slate-800">{profile?.full_name || 'Not set yet'}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-slate-500">Email</dt><dd className="max-w-[180px] truncate font-bold text-slate-800">{user.email}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-slate-500">Member since</dt><dd className="font-bold text-slate-800">{new Date(profile?.created_at ?? user.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })}</dd></div>
            </dl>
          </section>
          <Link to="/saved" className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-forest-300 hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-50 text-gold-700"><Heart size={18} /></span>
              <div><p className="font-extrabold text-slate-900">Saved listings</p><p className="text-sm text-slate-500">{savedIds.size} {savedIds.size === 1 ? 'property' : 'properties'} saved</p></div>
            </div>
          </Link>
          <button onClick={handleSignOut} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-red-200 hover:text-red-600"><LogOut size={16} /> Log out</button>
        </aside>
      </div>
    </main>
  );
}

export function SavedListingsPage() {
  const { user } = useAuth();
  const { savedIds, loading, toggle, isGuest } = useSavedProperties();
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  useEffect(() => {
    if (savedIds.size === 0) {
      setAllProperties([]);
      setPropertiesLoading(false);
      return;
    }
    void (async () => {
      setPropertiesLoading(true);
      const { data } = await supabase.from('properties').select('*').in('id', Array.from(savedIds));
      setAllProperties((data ?? []) as Property[]);
      setPropertiesLoading(false);
    })();
  }, [savedIds]);

  const saved = allProperties.filter((property) => savedIds.has(property.id));

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <p className="eyebrow">Your collection</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-forest-950">Saved listings</h1>
      <p className="mt-3 text-slate-500">{saved.length} {saved.length === 1 ? 'property' : 'properties'} you have kept for later.</p>

      {isGuest && !user && (
        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-gold-200 bg-gold-50 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm text-forest-900"><span className="font-bold">Saved on this device.</span> Log in to sync your saved listings across devices.</p>
          <Link to="/login" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-forest-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-forest-700">Log in <ArrowRight size={16} /></Link>
        </div>
      )}

      {loading || propertiesLoading ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-[440px] animate-pulse rounded-2xl bg-slate-200" />)}</div>
      ) : saved.length ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{saved.map((property) => <PropertyCard key={property.id} property={property} saved onToggle={toggle} />)}</div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Heart className="mx-auto text-slate-300" size={32} />
          <h2 className="mt-4 text-lg font-extrabold text-slate-800">No saved listings yet</h2>
          <p className="mt-2 text-sm text-slate-500">Tap the heart icon on any property to save it here for later.</p>
          <Link to="/properties" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-forest-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-forest-700">Browse properties <ArrowRight size={16} /></Link>
        </div>
      )}
    </main>
  );
}
