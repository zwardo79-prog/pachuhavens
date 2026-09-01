import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BedDouble, Building2, Heart, MapPin, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSavedProperties } from '@/lib/useSavedProperties';
import type { Property } from '@/types';

const money = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
});

const fallbackImage =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85';

const phoneNumbers = ['254729711524', '254736636363'];

export function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const { savedIds, toggle } = useSavedProperties();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      if (!id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        setProperty(data as Property);
      }

      setLoading(false);
    }

    loadProperty();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-800 px-6 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
            Loading property...
          </p>
        </div>
      </main>
    );
  }

  if (!property) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-800 px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-10 text-center shadow-sm">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Property not found
          </h1>

          <p className="mt-3 text-slate-500 dark:text-slate-300">
            This property may have been removed or is no longer available.
          </p>

          <Link
            to="/properties"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-forest-900 px-5 py-3 text-sm font-bold text-white"
          >
            <ArrowLeft size={16} />
            Back to properties
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/properties"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-forest-900 dark:text-white hover:text-gold-600"
        >
          <ArrowLeft size={16} />
          Back to properties
        </Link>

        <div className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-sm">
          <div className="relative aspect-[16/8] overflow-hidden">
            <img
              src={property.image_url || fallbackImage}
              alt={property.title}
              className="h-full w-full object-cover"
            />

            <span
              className={`absolute left-5 top-5 rounded-full px-4 py-2 text-xs font-bold ${
                property.status === 'Available'
                  ? 'bg-emerald-100 text-emerald-800'
                  : property.status === 'Pending'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200'
              }`}
            >
              {property.status}
            </span>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_320px]">
            <section>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">
                {property.category}
              </p>

              <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                {property.title}
              </h1>

              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-300">
                <MapPin size={17} className="text-gold-600" />
                {property.location}
              </p>

              <div className="my-7 flex flex-wrap gap-6 border-y border-slate-100 dark:border-slate-800 py-5 text-sm font-semibold text-slate-600 dark:text-slate-200">
                {property.beds > 0 && (
                  <span className="flex items-center gap-2">
                    <BedDouble size={18} />
                    {property.beds} bedrooms
                  </span>
                )}

                {property.baths > 0 && (
                  <span className="flex items-center gap-2">
                    <Building2 size={17} />
                    {property.baths} bathrooms
                  </span>
                )}

                <span>{property.size}</span>
              </div>

              <h2 className="text-xl font-extrabold text-slate-900">
                About this property
              </h2>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-200">
                {property.description}
              </p>
            </section>

            <aside className="h-fit rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    Asking price
                  </p>

                  <p className="mt-2 text-2xl font-extrabold text-forest-900 dark:text-white">
                    {money.format(property.price)}
                  </p>
                </div>

                <button
                  onClick={async () => {
                    setBusy(true);
                    await toggle(property.id);
                    setBusy(false);
                  }}
                  disabled={busy}
                  aria-label={savedIds.has(property.id) ? 'Remove from saved' : 'Save property'}
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition disabled:opacity-60 ${
                    savedIds.has(property.id)
                      ? 'border-gold-600 bg-gold-600 text-white'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-300 hover:border-gold-400 hover:text-gold-600'
                  }`}
                >
                  <Heart size={18} fill={savedIds.has(property.id) ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {phoneNumbers.map((phone) => (
                  <a
                    key={phone}
                    href={`https://wa.me/${phone}?text=${encodeURIComponent(
                      `Hello Pachu Haven Homes Ltd, I am interested in ${property.title}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-gold-600"
                  >
                    <MessageCircle size={17} />
                    WhatsApp
                  </a>
                ))}
              </div>

              <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-300">
                +254 729 711 524 · +254 736 636 363
              </p>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}