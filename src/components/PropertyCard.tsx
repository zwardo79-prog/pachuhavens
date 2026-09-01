import { useNavigate } from 'react-router-dom';
import { BedDouble, Building2, Heart, MapPin, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '@/types';

const money = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
});

const fallbackImage =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85';

const phone = '254729711524';

interface PropertyCardProps {
  property: Property;
  saved?: boolean;
  onToggle?: (id: string) => Promise<'saved' | 'removed' | 'error'>;
}

export function PropertyCard({
  property,
  saved = false,
  onToggle,
}: PropertyCardProps) {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  function handleCardClick() {
    navigate(`/properties/${property.id}`);
  }

  async function handleHeart(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!onToggle) return;

    setBusy(true);
    await onToggle(property.id);
    setBusy(false);
  }

  function handleWhatsApp(event: React.MouseEvent) {
    event.stopPropagation();
  }

  return (
    <article
      onClick={handleCardClick}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-forest-900/10"
    >
      <div className="relative aspect-[1.28] overflow-hidden">
        <img
          src={property.image_url || fallbackImage}
          alt={property.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />

        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-bold ${
            property.status === 'Available'
              ? 'bg-emerald-100 text-emerald-800'
              : property.status === 'Pending'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          {property.status}
        </span>

        <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 backdrop-blur-sm">
          {property.category}
        </span>

        {onToggle && (
          <button
            onClick={handleHeart}
            disabled={busy}
            aria-label={saved ? 'Remove from saved' : 'Save property'}
            className={`absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full backdrop-blur-md transition disabled:opacity-60 ${
              saved
                ? 'bg-gold-600 text-white'
                : 'bg-white/90 text-slate-600 dark:text-slate-300 hover:bg-white hover:text-gold-600'
            }`}
          >
            <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
           <h3 className="text-lg font-extrabold text-slate-900">
            {property.title}
          </h3>

            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <MapPin size={13} className="text-gold-600" />
              {property.location}
            </p>
          </div>
        </div>

        <p className="min-h-10 text-sm leading-5 text-slate-500 dark:text-slate-400">
          {property.description}
        </p>

        <Link
          to={`/properties/${property.id}`}
          className="mt-4 inline-flex items-center rounded-lg bg-forest-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-gold-600"
        >
         View property details
       </Link>
        <div className="my-4 flex items-center gap-4 border-y border-slate-100 dark:border-slate-800 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {property.beds > 0 && (
            <span className="flex items-center gap-1.5">
              <BedDouble size={15} />
              {property.beds} beds
            </span>
          )}

          {property.baths > 0 && (
            <span className="flex items-center gap-1.5">
              <Building2 size={14} />
              {property.baths} baths
            </span>
          )}

          <span className="truncate">{property.size}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-extrabold text-forest-900 dark:text-white">
            {money.format(property.price)}
          </p>

          <a
            href={`https://wa.me/${phone}?text=${encodeURIComponent(
              `Hello Pachu Haven Homes Ltd, I am interested in ${property.title}.`,
            )}`}
            target="_blank"
            rel="noreferrer"
            onClick={handleWhatsApp}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-forest-50 px-3 py-2 text-xs font-bold text-forest-800 dark:text-forest-300 transition hover:bg-forest-800 hover:text-white"
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}
