import { useRef, useState } from 'react';
import { diagnosePhoto } from '../utils/api';
import { DIAGNOSTIC_URGENCY_LABELS, professionLabel } from '../utils/helpers';
import ArtisanCard from './ArtisanCard';
import { useTranslation } from 'react-i18next';

export default function PhotoDiagnostic() {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError('');
  };

  const handleLocate = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsLocating(false);
      },
      () => {
        setLocationError("Impossible d'obtenir votre position. Autorisez la géolocalisation.");
        setIsLocating(false);
      }
    );
  };

  const handleReset = () => {
    setPhoto(null);
    setPreviewUrl(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) return;

    setIsSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('photo', photo);
      if (coordinates) {
        formData.append('lat', coordinates.lat);
        formData.append('lng', coordinates.lng);
      }
      const res = await diagnosePhoto(formData);
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    const urgency = DIAGNOSTIC_URGENCY_LABELS[result.urgency] || DIAGNOSTIC_URGENCY_LABELS.moderee;
    return (
      <div className="space-y-6">
        <div className="card p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
              {professionLabel(result.category)}
            </span>
            <span className={`badge ${urgency.className}`}>{urgency.label}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{result.diagnosis}</p>
          <button onClick={handleReset} className="btn-outline mt-6">
            {t('diagnosticPage.analyzeAnother')}
          </button>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            {t('diagnosticPage.artisansAvailable', { profession: t(`professions.${result.category.toLowerCase()}`, professionLabel(result.category)).toLowerCase() })}
          </h2>
          {result.artisans.length === 0 ? (
            <div className="card p-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('diagnosticPage.noArtisans')}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.artisans.map((artisan) => (
                <ArtisanCard key={artisan._id} artisan={artisan} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card mx-auto max-w-xl space-y-5 p-6 sm:p-8">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="diagnostic-photo"
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center hover:border-primary-500 transition-colors"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Aperçu" className="h-40 w-full rounded-lg object-cover" />
          ) : (
            <>
              <span className="text-4xl">📷</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('diagnosticPage.takePhoto')}
              </span>
              <span className="text-xs text-gray-400">{t('diagnosticPage.photoSpecs')}</span>
            </>
          )}
        </label>
        <input
          ref={fileInputRef}
          id="diagnostic-photo"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div>
        <button type="button" onClick={handleLocate} className="btn-outline w-full" disabled={isLocating}>
          {coordinates
            ? t('diagnosticPage.positionSaved')
            : isLocating
              ? t('diagnosticPage.locating')
              : t('diagnosticPage.usePosition')}
        </button>
        {locationError && <p className="mt-1 text-xs text-red-600">{locationError}</p>}
        <p className="mt-1 text-xs text-gray-400">
          {t('diagnosticPage.positionHint')}
        </p>
      </div>

      <button type="submit" disabled={!photo || isSubmitting} className="btn-accent w-full">
        {isSubmitting ? t('diagnosticPage.analyzing') : t('diagnosticPage.analyzeBtn')}
      </button>
    </form>
  );
}
