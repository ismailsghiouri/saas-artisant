import { useEffect, useMemo, useState } from 'react';
import { createDirectReservation, fetchArtisanById, fetchArtisanReviews } from '../utils/api';
import { formatDate, formatPrice, initials, maskPhone, professionLabel, whatsappLink } from '../utils/helpers';
import { useAuth } from '../hooks/useAuth';
import LoginModal from './LoginModal';

const REVIEWS_PREVIEW_COUNT = 4;

/**
 * Récupère la position GPS du client (best-effort) : sert de secours quand la
 * demande créée par le "contact direct" n'a pas d'adresse géolocalisable
 * précise, la position de l'artisan contacté restant sinon le repli le plus
 * pertinent (voir ContactModal).
 */
function getBrowserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

/**
 * Formulaire minimal affiché avant l'ouverture de WhatsApp : sans lui, aucune
 * réservation n'était créée en base lors d'un contact (le bouton se
 * contentait d'ouvrir un lien externe), donc l'artisan ne voyait jamais la
 * demande apparaître dans son tableau de bord "Mes réservations".
 */
function ContactModal({ artisan, whatsappHref, onClose }) {
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(artisan.city || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const browserCoords = await getBrowserLocation();
      const coordinates = browserCoords || artisan.location?.coordinates;

      await createDirectReservation({
        workerId: artisan._id,
        description,
        address,
        location: { coordinates },
        urgency: 'today',
      });
      setIsSent(true);
    } catch (err) {
      setError(err.message || "Impossible d'envoyer la demande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contacter {artisan.name}</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        {isSent ? (
          <div className="space-y-4 text-center">
            <p className="text-4xl">✅</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ta demande a été envoyée à {artisan.name}, tu la retrouveras dans « Mes réservations ».
              Ouvre WhatsApp pour lui écrire directement :
            </p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 font-bold text-white shadow-md transition-transform active:scale-95"
            >
              <WhatsAppIcon />
              Ouvrir WhatsApp
            </a>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Décris rapidement ton besoin : ta demande apparaîtra dans le tableau de bord de
              l'artisan, puis WhatsApp s'ouvrira pour discuter directement avec lui.
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-field">Décris ton problème</label>
                <textarea
                  required
                  minLength={5}
                  maxLength={1000}
                  rows={3}
                  className="input-field"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex : fuite d'eau sous l'évier de la cuisine..."
                />
              </div>

              <div>
                <label className="label-field">Adresse d'intervention</label>
                <input
                  required
                  type="text"
                  className="input-field"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Quartier, ville..."
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function WhatsAppIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.13-2.9-7-1.87-1.87-4.35-2.9-7-2.94Zm0 18.1h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.34c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.19-8.24 8.19Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.4-.12-.56.13-.17.25-.65.81-.8.97-.15.17-.29.19-.54.06-.25-.12-1.06-.39-2.02-1.24-.75-.66-1.25-1.48-1.4-1.73-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42-.14 0-.31-.02-.48-.02-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.17 1.74 2.66 4.22 3.73.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z" />
    </svg>
  );
}

function ReviewItem({ review }) {
  const rounded = Math.round(review.rating || 0);
  return (
    <div className="flex flex-col gap-2 border-b border-gray-100 py-5 last:border-0 dark:border-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
            {initials(review.client?.name || 'Client')}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {review.client?.name || 'Client Maalam Expert'}
            </p>
            <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <span className="shrink-0 text-accent-500">
          {'★'.repeat(rounded)}
          <span className="text-gray-300 dark:text-gray-700">{'★'.repeat(5 - rounded)}</span>
        </span>
      </div>
      {review.comment && (
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{review.comment}</p>
      )}
    </div>
  );
}

export default function ArtisanDetail({ artisanId }) {
  const { isAuthenticated, isClient } = useAuth();
  const [artisan, setArtisan] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([fetchArtisanById(artisanId), fetchArtisanReviews(artisanId)])
      .then(([artisanRes, reviewsRes]) => {
        if (cancelled) return;
        setArtisan(artisanRes.data);
        setReviews(reviewsRes.data);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [artisanId]);

  useEffect(() => {
    const handleScroll = () => setShowStickyBar(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    return sortBy === 'rating'
      ? list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      : list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [reviews, sortBy]);

  const visibleReviews = showAllReviews ? sortedReviews : sortedReviews.slice(0, REVIEWS_PREVIEW_COUNT);

  if (isLoading) {
    return <p className="page-container py-10 text-gray-500 dark:text-gray-400">Chargement du profil...</p>;
  }
  if (error) {
    return <p className="page-container py-10 text-red-600 dark:text-red-400">{error}</p>;
  }
  if (!artisan) return null;

  const coverPhoto = artisan.photos?.[0];
  const whatsappHref = whatsappLink(
    artisan.phone,
    `Bonjour ${artisan.name}, je vous contacte via Maalam Expert pour une intervention.`
  );

  const openWhatsapp = () => window.open(whatsappHref, '_blank', 'noopener,noreferrer');

  // Un client doit être connecté pour qu'une réservation puisse être associée
  // à son compte : sans ça, le contact reste un simple lien WhatsApp anonyme
  // qui n'apparaît jamais dans le tableau de bord de l'artisan.
  const handleContactClick = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (isClient) {
      setShowContactModal(true);
      return;
    }
    openWhatsapp();
  };

  return (
    <div className="pb-24">
      {/* Cover */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 sm:h-64">
        {coverPhoto && <img src={coverPhoto} alt="" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="page-container -mt-16 grid grid-cols-1 gap-gutter sm:-mt-20 lg:grid-cols-12 lg:gap-stack-lg">
        {/* Left column */}
        <aside className="space-y-stack-md lg:col-span-4 xl:col-span-3">
          <div className="card p-6">
            <div className="relative mx-auto mb-4 h-28 w-28">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-4 border-white bg-primary-100 text-2xl font-bold text-primary-700 shadow-md dark:border-gray-900 dark:bg-primary-900/40 dark:text-primary-300">
                {artisan.avatarUrl ? (
                  <img src={artisan.avatarUrl} alt={artisan.name} className="h-full w-full object-cover" />
                ) : (
                  initials(artisan.name)
                )}
              </div>
              {artisan.verifiedBadge && (
                <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary-700 text-sm text-white shadow-sm">
                  ✓
                </span>
              )}
            </div>

            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{artisan.name}</h1>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {professionLabel(artisan.category)}
              </p>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <span className="text-accent-500">★</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {artisan.rating?.toFixed(1) ?? '0.0'}
                </span>
                <span className="text-sm text-gray-400">({artisan.totalReviews || 0} avis)</span>
              </div>
            </div>

            {(artisan.phone || artisan.email) && (
              <div className="mt-6 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                {artisan.phone && (
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      📞
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">Téléphone</p>
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {maskPhone(artisan.phone)}
                      </p>
                    </div>
                  </div>
                )}
                {artisan.email && (
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      ✉️
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">Email</p>
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {artisan.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Vérifications
            </h3>
            <div className="space-y-2">
              {artisan.verifiedBadge ? (
                <div className="flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 p-3 dark:border-primary-800 dark:bg-primary-900/20">
                  <span>✅</span>
                  <span className="text-sm font-semibold text-primary-800 dark:text-primary-300">
                    Artisan vérifié
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                  <span>⏳</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Vérification en cours
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 rounded-lg border border-primary-100 bg-primary-50/60 p-3 dark:border-primary-800/60 dark:bg-primary-900/10">
                <span>⚖️</span>
                <span className="text-sm font-medium text-primary-800 dark:text-primary-300">
                  Assurance décennale Maalam Expert
                </span>
              </div>
              <div
                className={`flex items-center gap-3 rounded-lg p-3 ${
                  artisan.isAvailable ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                <span>{artisan.isAvailable ? '⚡' : '💤'}</span>
                <span
                  className={`text-sm font-medium ${
                    artisan.isAvailable
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {artisan.isAvailable ? 'Disponible maintenant' : 'Indisponible actuellement'}
                </span>
              </div>
              {artisan.city && (
                <div className="flex items-center gap-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                  <span>📍</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Basé à {artisan.city}
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="space-y-stack-lg lg:col-span-8 xl:col-span-9">
          <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
            <section className="card p-6 sm:p-8 lg:col-span-2">
              <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">À propos</h2>
              {artisan.description ? (
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {artisan.description}
                </p>
              ) : (
                <p className="text-sm italic text-gray-400">
                  Cet artisan n'a pas encore ajouté de description.
                </p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="stat-tile">
                  <p className="text-lg font-bold text-primary-700 dark:text-primary-300">
                    {artisan.completedJobsCount || 0}
                  </p>
                  <p className="text-xs text-gray-400">Interventions</p>
                </div>
                <div className="stat-tile">
                  <p className="text-lg font-bold text-primary-700 dark:text-primary-300">
                    {artisan.yearsExperience || 0}
                  </p>
                  <p className="text-xs text-gray-400">Années</p>
                </div>
                <div className="stat-tile">
                  <p className="text-lg font-bold text-primary-700 dark:text-primary-300">
                    {artisan.serviceRadiusKm || 0} km
                  </p>
                  <p className="text-xs text-gray-400">Zone</p>
                </div>
                <div className="stat-tile">
                  <p className="text-lg font-bold text-primary-700 dark:text-primary-300">
                    {artisan.rating?.toFixed(1) ?? '0.0'}
                  </p>
                  <p className="text-xs text-gray-400">Note</p>
                </div>
              </div>
            </section>

            <div className="lg:col-span-1">
              <div className="card relative overflow-hidden bg-gradient-to-br from-primary-800 to-primary-900 p-6 text-white">
                <h3 className="mb-2 text-lg font-bold">
                  {artisan.isAvailable ? 'Disponible dès maintenant' : 'Réservez à l’avance'}
                </h3>
                <p className="mb-6 text-sm text-primary-100">
                  Contactez {artisan.name} directement sur WhatsApp, ou envoyez une demande de
                  réservation détaillée.
                </p>
                <div className="space-y-3">
                  {whatsappHref && (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 font-bold text-white shadow-md transition-transform active:scale-95"
                    >
                      <WhatsAppIcon />
                      Contacter sur WhatsApp
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleContactClick}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-bold text-primary-800 shadow-md transition-transform active:scale-95"
                  >
                    📋 Faire une demande de réservation
                  </button>
                </div>
              </div>
            </div>
          </div>

          {artisan.services?.length > 0 && (
            <section className="card p-6 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Prestations</h2>
                <span className="text-xs italic text-gray-400">
                  {artisan.priceEstimateRange?.min || artisan.priceEstimateRange?.max
                    ? `Estimation : ${formatPrice(artisan.priceEstimateRange.min)} - ${formatPrice(
                        artisan.priceEstimateRange.max
                      )}`
                    : 'Tarifs sur devis'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {artisan.services.map((service) => (
                  <div
                    key={service}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 dark:border-gray-800"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      🛠️
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{service}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="card p-6 sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Avis clients ({reviews.length})
              </h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Trier par :</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="select-field w-auto py-1.5 text-sm"
                  >
                    <option value="recent">Plus récents</option>
                    <option value="rating">Meilleures notes</option>
                  </select>
                </div>
              )}
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Aucun avis pour le moment.</p>
            ) : (
              <>
                {visibleReviews.map((review) => (
                  <ReviewItem key={review._id} review={review} />
                ))}
                {!showAllReviews && sortedReviews.length > REVIEWS_PREVIEW_COUNT && (
                  <button onClick={() => setShowAllReviews(true)} className="btn-outline mt-6 w-full">
                    Voir tous les avis ({sortedReviews.length})
                  </button>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* Sticky mobile FABs */}
      {whatsappHref && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 lg:hidden">
          <button
            type="button"
            onClick={handleContactClick}
            aria-label="Faire une demande de réservation"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-800 text-white shadow-glow transition-transform active:scale-95"
          >
            📋
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contacter sur WhatsApp"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-glow transition-transform active:scale-95"
          >
            <WhatsAppIcon className="h-7 w-7" />
          </a>
        </div>
      )}

      {/* Sticky desktop CTA bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 hidden border-t border-gray-100 bg-white/95 px-4 py-4 backdrop-blur transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900/95 lg:block ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="page-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              {artisan.avatarUrl ? (
                <img src={artisan.avatarUrl} alt={artisan.name} className="h-full w-full object-cover" />
              ) : (
                initials(artisan.name)
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{artisan.name}</p>
              <p className="text-xs text-gray-400">
                {artisan.rating?.toFixed(1) ?? '0.0'} ★ · {artisan.totalReviews || 0} avis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleContactClick}
              className="flex items-center gap-2 rounded-xl border border-primary-200 px-5 py-3 text-sm font-semibold text-primary-800 transition-all active:scale-95 dark:border-primary-800 dark:text-primary-300"
            >
              📋 Faire une demande
            </button>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all active:scale-95"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Contacter sur WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {showContactModal && (
        <ContactModal
          artisan={artisan}
          whatsappHref={whatsappHref}
          onClose={() => setShowContactModal(false)}
        />
      )}

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={(user) => (user?.role === 'client' ? setShowContactModal(true) : openWhatsapp())}
        />
      )}
    </div>
  );
}
