import { PropertyDetails } from '@/pages/PropertyDetails';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Facebook, Heart, Instagram, LandPlot, LayoutDashboard, LogOut, Mail, MapPin, Menu, MessageCircle, Moon, Pencil, Phone, Plus, Search, ShieldCheck, Sparkles, Star, Sun, Trash2, TrendingUp, Twitter, Upload, User, X } from 'lucide-react';
import logo from '@/assets/pachu-logo.png';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useSavedProperties } from '@/lib/useSavedProperties';
import type { Property, PropertyCategory, PropertyDraft, PropertyStatus } from '@/types';
import { PropertyCard } from '@/components/PropertyCard';
import { LoginPage, ResetPage, SignupPage } from '@/pages/AuthPages';
import { ProfilePage, SavedListingsPage } from '@/pages/AccountPages';

const categories: PropertyCategory[] = ['Houses', 'Land & Plots', 'Commercial'];
const statuses: PropertyStatus[] = ['Available', 'Pending', 'Sold'];
const money = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 });
const fallbackImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85';

function App() {
  if (!isSupabaseConfigured) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-800 px-4 text-center">
        <div className="max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
          <p className="eyebrow">Connection issue</p>
          <h1 className="mt-3 text-2xl font-extrabold text-forest-950 dark:text-white">We can't reach the listings right now</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">The property database isn't configured for this environment. If you're the site owner, add the <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">VITE_SUPABASE_URL</span> and <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">VITE_SUPABASE_ANON_KEY</span> environment variables in your hosting dashboard and redeploy.</p>
        </div>
      </div>
    );
  }
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="*" element={<Portal />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function Portal() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    void loadProperties();
  }, []);

  async function loadProperties() {
    setLoading(true);
    const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
    if (error) setDataError('We could not load the latest listings. Please refresh and try again.');
    else setProperties((data ?? []) as Property[]);
    setLoading(false);
  }

  async function updateProperty(id: string, changes: Partial<Property>) {
    const previous = properties;
    setProperties((current) => current.map((property) => property.id === id ? { ...property, ...changes } : property));
    const { error } = await supabase.from('properties').update(changes).eq('id', id);
    if (error) {
      setProperties(previous);
      setDataError('That update could not be saved. Please try again.');
    }
  }

  async function addProperty(draft: PropertyDraft) {
    const { data, error } = await supabase.from('properties').insert(draft).select().maybeSingle();
    if (error || !data) throw new Error('Unable to create listing');
    setProperties((current) => [data as Property, ...current]);
  }

  async function deleteProperty(id: string) {
    const previous = properties;
    setProperties((current) => current.filter((property) => property.id !== id));
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) {
      setProperties(previous);
      setDataError('That listing could not be deleted. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 text-slate-900">
      <Header />
      {dataError && <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8"><div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{dataError}</div></div>}
      <Routes>
        <Route path="/" element={<HomePage properties={properties} loading={loading} />} />
        <Route path="/properties" element={<BrowsePage title="Find a place to call home" eyebrow="The collection" categories={categories} properties={properties} loading={loading} />} />
        <Route path="/land-plots" element={<BrowsePage title="Room to grow into" eyebrow="Land & plots" categories={['Land & Plots']} properties={properties} loading={loading} />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/admin" element={<AdminPage properties={properties} loading={loading} onUpdate={updateProperty} onAdd={addProperty} onDelete={deleteProperty} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/reset" element={<ResetPage />} />
        <Route path="/account" element={<ProfilePage />} />
        <Route path="/saved" element={<SavedListingsPage />} />
        <Route path="*" element={<HomePage properties={properties} loading={loading} />} />
      </Routes>
      <Footer />
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  async function handleSignOut() {
    await signOut();
    setAccountOpen(false);
    setOpen(false);
    navigate('/');
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/properties', label: 'Properties' },
    { to: '/land-plots', label: 'Land & Plots' },
    { to: '/about', label: 'About Us' },
    { to: '/saved', label: 'Saved Properties' },
  ];

  const ThemeToggleButton = ({ className }: { className?: string }) => (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition hover:border-forest-300 hover:bg-forest-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 ${className ?? ''}`}
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/95">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src={logo} alt="Pachu Haven Homes Ltd" className="h-12 w-12 shrink-0 object-contain" />
          <span className="leading-none"><span className="block text-[14px] font-extrabold tracking-[0.15em] text-forest-900 dark:text-white dark:text-white">PACHU HAVEN</span><span className="mt-1 block text-[10px] font-semibold tracking-[0.3em] text-gold-600">HOMES LTD</span></span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => <NavItem key={link.to} to={link.to}>{link.label}</NavItem>)}
        </nav>
        <div className="hidden items-center gap-3 sm:flex">
          <ThemeToggleButton />
          {user ? (
            <div className="relative">
              <button onClick={() => setAccountOpen(!accountOpen)} className="flex items-center gap-2 rounded-full border border-slate-200 py-1.5 pl-1.5 pr-3 transition hover:border-forest-300 dark:border-slate-700 dark:hover:border-slate-600">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-forest-800 text-xs font-bold text-white">{(profile?.full_name || user.email || '?').charAt(0).toUpperCase()}</span>
                <span className="max-w-[100px] truncate text-sm font-bold text-slate-700 dark:text-slate-200 dark:text-slate-200">{profile?.full_name || 'Account'}</span>
                <ChevronDown size={15} className="text-slate-400 dark:text-slate-500" />
              </button>
              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAccountOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 shadow-xl">
                    <Link to="/account" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"><User size={15} /> My profile</Link>
                    <Link to="/saved" onClick={() => setAccountOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"><Heart size={15} /> Saved listings</Link>
                    <button onClick={handleSignOut} className="flex w-full items-center gap-2.5 border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-slate-800 dark:hover:bg-red-950/40"><LogOut size={15} /> Log out</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-bold text-forest-800 transition hover:border-forest-300 hover:bg-forest-50 dark:border-slate-700 dark:text-forest-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"><User size={15} /> Log in</Link>
          )}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggleButton />
          <button className="rounded-lg p-2 text-forest-900 dark:text-white dark:text-white" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pb-5 pt-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((route) => <NavLink key={route.to} to={route.to} end={route.to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `rounded-lg px-3 py-3 text-sm font-semibold ${isActive ? 'bg-forest-50 text-forest-800 dark:text-forest-300 dark:bg-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300 dark:text-slate-300'}`}>{route.label}</NavLink>)}
            {user ? (
              <>
                <NavLink to="/account" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 dark:text-slate-300">My profile</NavLink>
                <NavLink to="/saved" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 dark:text-slate-300">Saved listings</NavLink>
                <button onClick={handleSignOut} className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-semibold text-red-600"><LogOut size={15} /> Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setOpen(false)} className="rounded-lg bg-forest-50 px-3 py-3 text-sm font-bold text-forest-800 dark:text-forest-300">Log in / Sign up</NavLink>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function NavItem({ to, children }: { to: string; children: ReactNode }) {
  return <NavLink to={to} end={to === '/'} className={({ isActive }) => `text-[13px] font-bold transition ${isActive ? 'text-forest-800 dark:text-forest-300' : 'text-slate-500 dark:text-slate-400 hover:text-forest-800'}`}>{children}</NavLink>;
}

function HomePage({ properties, loading }: { properties: Property[]; loading: boolean }) {
  const [category, setCategory] = useState('All types');
  const [status, setStatus] = useState('All statuses');
  const [location, setLocation] = useState('');
  const filtered = useMemo(() => properties.filter((property) => (category === 'All types' || property.category === category) && (status === 'All statuses' || property.status === status) && (!location || property.location.toLowerCase().includes(location.toLowerCase()))), [properties, category, status, location]);
  return <>
    <main>
      <section className="relative overflow-hidden bg-forest-950">
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(2,44,34,.98)_15%,rgba(4,78,59,.86)_60%,rgba(2,44,34,.55)),url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=85')] bg-cover bg-center" />
        <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-20 sm:px-6 sm:pb-36 sm:pt-28 lg:px-8">
          <div className="max-w-2xl animate-fade-up"><div className="mb-6 flex items-center gap-2 text-sm font-semibold text-gold-300"><Sparkles size={16} /> Curated spaces, thoughtfully found</div><h1 className="max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl">Your trusted partner <span className="text-gold-300">in properties.</span></h1><p className="mt-6 max-w-lg text-base leading-7 text-emerald-50/80 sm:text-lg">Exceptional homes, land and commercial spaces across Kenya, brought to you with clarity and care.</p></div>
          <div className="relative mt-12 rounded-[22px] border border-gold-400/70 bg-white dark:bg-slate-900 p-3 shadow-2xl shadow-black/20 sm:p-4"><div className="grid gap-3 md:grid-cols-[1.3fr_1fr_1fr_auto] md:items-end"><label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Location<input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Nairobi, Nakuru, Naivasha..." className="mt-2 w-full bg-transparent px-0 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400" /></label><SelectField label="Category" value={category} options={['All types', ...categories]} onChange={setCategory} /><SelectField label="Status" value={status} options={['All statuses', ...statuses]} onChange={setStatus} /><button className="flex h-[50px] items-center justify-center gap-2 rounded-xl bg-gold-600 px-5 text-sm font-bold text-white transition hover:bg-gold-700"><Search size={17} /> Search</button></div></div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"><div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">The Pachu edit</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-forest-950 dark:text-white sm:text-4xl">Featured properties</h2></div><Link to="/properties" className="flex items-center gap-2 text-sm font-bold text-gold-700 hover:text-gold-800">View all properties <ArrowRight size={16} /></Link></div>{loading ? <LoadingGrid /> : filtered.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filtered.slice(0, 6).map((property) => <PropertyCardWithHeart key={property.id} property={property} />)}</div> : <EmptyState />}</section>
      <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8"><TrustItem icon={<ShieldCheck />} title="Clear, honest guidance" text="Every listing is presented with the details you need to move confidently." /><TrustItem icon={<Star />} title="Spaces worth coming home to" text="A considered collection, selected for character, value, and long-term promise." /><TrustItem icon={<TrendingUp />} title="Local insight, lasting value" text="Neighbourhood knowledge that helps you choose not only a place, but a future." /></div></section>
    </main>
  </>;
}

function PropertyCardWithHeart({ property }: { property: Property }) {
  const { savedIds, toggle } = useSavedProperties();
  const saved = savedIds.has(property.id);
  return <PropertyCard property={property} saved={saved} onToggle={toggle} />;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label className="relative block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full appearance-none bg-transparent pr-5 text-sm font-semibold normal-case tracking-normal text-slate-800 dark:text-slate-100 outline-none">{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute bottom-1 right-1 text-slate-400 dark:text-slate-500" /></label>; }
function TrustItem({ icon, title, text }: { icon: ReactNode; title: string; text: string }) { return <div className="flex gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-50 text-gold-700">{icon}</div><div><h3 className="font-extrabold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p></div></div>; }
function LoadingGrid() { return <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-[440px] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />)}</div>; }
function EmptyState() { return <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-16 text-center"><Search className="mx-auto text-slate-300" size={32} /><h3 className="mt-4 font-bold text-slate-800 dark:text-slate-100">No properties match those filters</h3><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Try widening your search to see more of the collection.</p></div>; }

function BrowsePage({ title, eyebrow, categories: pageCategories, properties, loading }: { title: string; eyebrow: string; categories: PropertyCategory[]; properties: Property[]; loading: boolean }) {
  const [status, setStatus] = useState('All statuses');
  const [category, setCategory] = useState('All types');
  const [location, setLocation] = useState('');
  const filtered = properties.filter((p) => pageCategories.includes(p.category) && (status === 'All statuses' || p.status === status) && (category === 'All types' || p.category === category) && (!location || p.location.toLowerCase().includes(location.toLowerCase())));
  return <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div className="max-w-2xl"><p className="eyebrow">{eyebrow}</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight text-forest-950 dark:text-white sm:text-5xl">{title}</h1><p className="mt-5 text-lg leading-8 text-slate-500 dark:text-slate-400">Explore a considered collection of spaces across Kenya, with local guidance at every step.</p></div><div className="my-10 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"><label className="block min-w-[200px] flex-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Location<div className="mt-2 flex items-center gap-2"><MapPin size={15} className="text-gold-600" /><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Nairobi, Nakuru, Naivasha..." className="w-full bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400" /></div></label><SelectField label="Category" value={category} options={['All types', ...pageCategories]} onChange={setCategory} /><SelectField label="Status" value={status} options={['All statuses', ...statuses]} onChange={setStatus} /></div>{loading ? <LoadingGrid /> : filtered.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filtered.map((property) => <PropertyCardWithHeart key={property.id} property={property} />)}</div> : <EmptyState />}</main>;
}

function AboutPage() { return <main><section className="bg-forest-950 px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-7xl"><p className="eyebrow text-gold-300">A better way home</p><h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl">Property decisions made with <span className="text-gold-300">more humanity.</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-emerald-50/75">Pachu Haven Homes Ltd is a Kenya-first property partner for people buying, selling, and building the next chapter of their lives.</p></div></section><section className="mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center lg:px-8 lg:py-24"><img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=85" alt="Modern home interior" className="rounded-3xl object-cover shadow-xl" /><div><p className="eyebrow">Our point of view</p><h2 className="mt-3 text-3xl font-extrabold text-forest-950 dark:text-white">The right space changes how life feels.</h2><p className="mt-5 leading-8 text-slate-500 dark:text-slate-400">We believe the property journey should feel informed, personal, and calm. That means honest listings, thoughtful presentation, and a team that understands the places we call home.</p><div className="mt-8 grid gap-5 sm:grid-cols-2"><TrustItem icon={<MapPin />} title="Local by nature" text="Deep knowledge of Kenya's most promising neighborhoods." /><TrustItem icon={<Star />} title="Carefully curated" text="Quality over quantity in every collection we share." /></div></div></section><section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8"><p className="eyebrow">Visit us</p><h2 className="mt-3 text-3xl font-extrabold text-forest-950 dark:text-white">Our offices</h2><div className="mt-8 grid gap-5 sm:grid-cols-3">{[['Nakuru', 'Opposite Lands Office, opposite Judiciary'], ['Gilgil', 'Gilgil town'], ['Naivasha', 'Naivasha town']].map(([town, detail]) => <div key={town} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-gold-600"><MapPin size={18} /></span><h3 className="mt-4 text-lg font-extrabold text-forest-950 dark:text-white">{town}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p></div>)}</div></section></main>; }

function AdminPage({ properties, loading, onUpdate, onAdd, onDelete }: { properties: Property[]; loading: boolean; onUpdate: (id: string, changes: Partial<Property>) => Promise<void>; onAdd: (draft: PropertyDraft) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [tab, setTab] = useState<'All' | PropertyStatus>('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const filtered = tab === 'All' ? properties : properties.filter((p) => p.status === tab);
  const count = (value: PropertyStatus) => properties.filter((p) => p.status === value).length;

  async function handleDelete(property: Property) {
    if (!window.confirm(`Delete "${property.title}"? This can't be undone.`)) return;
    setDeletingId(property.id);
    await onDelete(property.id);
    setDeletingId(null);
  }

  return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Operations center</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight text-forest-950 dark:text-white">Listing dashboard</h1><p className="mt-3 text-slate-500 dark:text-slate-400">Keep your property collection current and ready for the next conversation.</p></div><button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 rounded-xl bg-forest-800 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-forest-900/10 transition hover:bg-forest-700"><Plus size={17} /> Add new property</button></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric title="Total listings" value={properties.length} icon={<LayoutDashboard />} tone="neutral" /><Metric title="Available" value={count('Available')} icon={<Check />} tone="green" /><Metric title="Pending" value={count('Pending')} icon={<Sparkles />} tone="gold" /><Metric title="Sold" value={count('Sold')} icon={<ShieldCheck />} tone="slate" /></div><section className="mt-10 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"><div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 px-5 py-4">{(['All', ...statuses] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === item ? 'bg-forest-800 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100'}`}>{item}</button>)}</div>{loading ? <div className="p-8 text-sm text-slate-500 dark:text-slate-400">Loading listings...</div> : <div className="overflow-x-auto"><table className="w-full min-w-[840px] text-left"><thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500"><tr><th className="px-5 py-4">Property</th><th className="px-5 py-4">Location</th><th className="px-5 py-4">Price</th><th className="px-5 py-4">Category</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filtered.map((property) => <tr key={property.id} className="text-sm"><td className="px-5 py-4"><div className="flex items-center gap-3"><img src={property.image_url || fallbackImage} alt="" className="h-10 w-12 rounded-lg object-cover" /><div><p className="font-bold text-slate-800 dark:text-slate-100">{property.title}</p><p className="mt-1 text-xs text-slate-400 dark:text-slate-500">#{property.id.slice(0, 8)}</p></div></div></td><td className="px-5 py-4 text-slate-500 dark:text-slate-400">{property.location}</td><td className="px-5 py-4 font-bold text-forest-900 dark:text-white">{money.format(property.price)}</td><td className="px-5 py-4 text-slate-500 dark:text-slate-400">{property.category}</td><td className="px-5 py-4"><select value={property.status} onChange={(e) => void onUpdate(property.id, { status: e.target.value as PropertyStatus })} className={`rounded-lg border-0 px-3 py-2 text-xs font-bold outline-none ${property.status === 'Available' ? 'bg-emerald-50 text-emerald-700' : property.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></td><td className="px-5 py-4"><div className="flex items-center justify-end gap-2"><button onClick={() => setEditing(property)} aria-label="Edit property" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 dark:text-slate-500 transition hover:bg-forest-50 hover:text-forest-800"><Pencil size={16} /></button><button onClick={() => void handleDelete(property)} disabled={deletingId === property.id} aria-label="Delete property" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 dark:text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table>{!filtered.length && <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">No listings in this status yet.</div>}</div>}</section>{showModal && <PropertyFormModal title="Add a property" submitLabel="Publish property" onClose={() => setShowModal(false)} onSubmit={async (draft) => { await onAdd(draft); setShowModal(false); }} />}{editing && <PropertyFormModal title="Edit property" submitLabel="Save changes" initial={editing} onClose={() => setEditing(null)} onSubmit={async (draft) => { await onUpdate(editing.id, draft); setEditing(null); }} />}</main>;
}
function Metric({ title, value, icon, tone }: { title: string; value: number; icon: ReactNode; tone: 'neutral' | 'green' | 'gold' | 'slate' }) { const styles = { neutral: 'bg-white dark:bg-slate-900 text-forest-800 dark:text-forest-300', green: 'bg-emerald-50 text-emerald-700', gold: 'bg-amber-50 text-amber-700', slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' }; return <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"><div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl ${styles[tone]}`}>{icon}</span><span className="text-3xl font-extrabold text-slate-900">{value}</span></div><p className="mt-5 text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p></div>; }
function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError('');
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('property-images').upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('property-images').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch {
      setError('Upload failed. Please try a different image.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="sm:col-span-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Photo</label>
      <div className="mt-2 flex items-center gap-4">
        <img src={value || fallbackImage} alt="" className="h-20 w-28 shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 object-cover" />
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleFile(file); }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-bold text-forest-800 dark:text-forest-300 transition hover:border-forest-300 hover:bg-forest-50 disabled:opacity-60"
          >
            <Upload size={15} /> {uploading ? 'Uploading...' : value ? 'Change photo' : 'Upload photo'}
          </button>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function PropertyFormModal({ initial, onClose, onSubmit, title, submitLabel }: { initial?: Property; onClose: () => void; onSubmit: (draft: PropertyDraft) => Promise<void>; title: string; submitLabel: string }) {
  const [form, setForm] = useState<PropertyDraft>(initial ? {
    title: initial.title, location: initial.location, price: initial.price, category: initial.category,
    status: initial.status, image_url: initial.image_url, beds: initial.beds, baths: initial.baths,
    size: initial.size, description: initial.description,
  } : { title: '', location: '', price: 0, category: 'Houses', status: 'Available', image_url: fallbackImage, beds: 0, baths: 0, size: '', description: '' });
  const [sizeNumber, setSizeNumber] = useState(() => initial?.size.match(/[\d,.]+/)?.[0].replace(/,/g, '') ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (key: keyof PropertyDraft, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  function updateSizeNumber(value: string) {
    setSizeNumber(value);
    update('size', value ? `${value} m\u00b2` : '');
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(form);
    } catch {
      setError('Please fill in the required details and try again.');
    } finally {
      setSaving(false);
    }
  }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white dark:bg-slate-900 p-6 sm:rounded-3xl sm:p-8"><div className="flex items-start justify-between"><div><p className="eyebrow">{initial ? 'Edit listing' : 'New listing'}</p><h2 className="mt-2 text-2xl font-extrabold text-forest-950 dark:text-white">{title}</h2></div><button onClick={onClose} className="rounded-full p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100"><X size={20} /></button></div><form onSubmit={submit} className="mt-7 grid gap-4 sm:grid-cols-2"><FormField label="Title" value={form.title} onChange={(value) => update('title', value)} required /><FormField label="Location" value={form.location} onChange={(value) => update('location', value)} required /><FormField label="Price (KSh)" value={form.price || ''} type="number" onChange={(value) => update('price', Number(value))} required /><SelectField label="Category" value={form.category} options={categories} onChange={(value) => update('category', value as PropertyCategory)} />{form.category !== 'Land & Plots' && <FormField label="Bedrooms" value={form.beds || ''} type="number" onChange={(value) => update('beds', Number(value))} />}{form.category !== 'Land & Plots' && <FormField label={form.category === 'Commercial' ? 'Washrooms' : 'Bathrooms'} value={form.baths || ''} type="number" onChange={(value) => update('baths', Number(value))} />}{form.category === 'Land & Plots' ? <div className="sm:col-span-2"><label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Size (e.g. 1/2 acre, 1/4 acre)<input required value={form.size} onChange={(e) => update('size', e.target.value)} placeholder="1/2 acre" className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none transition focus:border-forest-700 focus:ring-2 focus:ring-forest-100" /></label></div> : <FormField label="Size (m\u00b2)" value={sizeNumber} type="number" onChange={updateSizeNumber} required />}<SelectField label="Status" value={form.status} options={[...statuses]} onChange={(value) => update('status', value as PropertyStatus)} /><ImageUploader value={form.image_url} onChange={(url) => update('image_url', url)} /><div className="sm:col-span-2"><label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Description<textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-forest-700" /></label></div>{error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}<button disabled={saving} className="sm:col-span-2 mt-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-forest-800 text-sm font-bold text-white transition hover:bg-forest-700 disabled:opacity-60">{saving ? 'Saving...' : submitLabel} <ArrowRight size={16} /></button></form></div></div>;
}
function FormField({ label, value, onChange, type = 'text', required = false }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}<input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none transition focus:border-forest-700 focus:ring-2 focus:ring-forest-100" /></label>; }

function Footer() { return <footer className="bg-forest-950 text-white"><div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1.1fr] lg:px-8"><div><Link to="/" className="inline-flex items-center gap-3"><img src={logo} alt="Pachu Haven Homes Ltd" className="h-11 w-11 shrink-0 object-contain" /><span className="leading-none"><span className="block text-[14px] font-extrabold tracking-[0.15em]">PACHU HAVEN</span><span className="mt-1 block text-[10px] font-semibold tracking-[0.3em] text-gold-300">HOMES LTD</span></span></Link><p className="mt-6 max-w-xs text-sm leading-6 text-emerald-100/60">A considered way to find your next home, plot, or place to build in Kenya.</p><div className="mt-6 flex gap-2"><SocialIcon icon={<Instagram size={16} />} href="https://www.instagram.com/pachuhavenhomesltd" label="Instagram" /><SocialIcon icon={<Facebook size={16} />} href="https://www.facebook.com/pachuhavenhomesltd" label="Facebook" /><SocialIcon icon={<Twitter size={16} />} href="https://www.x.com/pachuhavenhomesltd" label="X (Twitter)" /></div></div><FooterColumn title="Explore" links={[['Properties', '/properties'], ['Land & Plots', '/land-plots'], ['About Us', '/about'], ['Saved listings', '/saved'], ['Admin Dashboard', '/admin']]} /><div><h3 className="text-sm font-bold text-gold-300">Get in touch</h3><div className="mt-5 space-y-4 text-sm text-emerald-100/70"><p className="flex items-center gap-3"><Phone size={15} /> +254 729 711 524</p><p className="flex items-center gap-3"><Phone size={15} /> +254 736 636 363</p><p className="flex items-center gap-3"><Mail size={15} /> hello@pachuhavens.co.ke</p><p className="flex items-start gap-3"><MapPin size={15} className="mt-0.5 shrink-0" /> Nakuru — opp. Lands Office, opp. Judiciary</p><p className="flex items-start gap-3"><MapPin size={15} className="mt-0.5 shrink-0" /> Gilgil</p><p className="flex items-start gap-3"><MapPin size={15} className="mt-0.5 shrink-0" /> Naivasha</p></div></div></div><div className="border-t border-white/10 px-4 py-5 text-center text-xs text-emerald-100/40 sm:px-6">© 2024 Pachu Haven Homes Ltd. Spaces with a little more soul.</div></footer>; }
function FooterColumn({ title, links }: { title: string; links: [string, string][] }) { return <div><h3 className="text-sm font-bold text-gold-300">{title}</h3><div className="mt-5 space-y-3">{links.map(([label, to]) => <Link key={label} to={to} className="block text-sm text-emerald-100/70 transition hover:text-white">{label}</Link>)}</div></div>; }
function SocialIcon({ icon, href, label }: { icon: ReactNode; href: string; label: string }) { return <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-emerald-100/70 transition hover:border-gold-400 hover:text-gold-300">{icon}</a>; }

export default App;
