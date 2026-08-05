import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, MapPin } from 'lucide-react';
import { PROFESSIONS, MOROCCAN_CITIES } from '../utils/helpers';

export default function SearchBar({ variant = 'hero' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profession, setProfession] = useState(searchParams.get('profession') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (profession) params.set('profession', profession);
    if (city) params.set('city', city);
    navigate(`/recherche?${params.toString()}`);
  };

  const isHero = variant === 'hero';

  if (isHero) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-center w-full max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden p-1.5 gap-2"
      >
        <div className="flex-1 flex items-center bg-white px-4 py-3 w-full">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <select
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className="w-full bg-transparent border-0 text-gray-700 focus:ring-0 text-sm sm:text-base font-medium px-3 appearance-none cursor-pointer"
          >
            <option value="">{t('search.professionPlaceholder')}</option>
            {PROFESSIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {t(`professions.${p.value}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden sm:block w-px h-10 bg-gray-200 shrink-0"></div>

        <div className="flex-1 flex items-center bg-white px-4 py-3 border-t sm:border-t-0 border-gray-100 w-full">
          <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-transparent border-0 text-gray-700 focus:ring-0 text-sm sm:text-base font-medium px-3 appearance-none cursor-pointer"
          >
            <option value="">{t('search.cityPlaceholder')}</option>
            {MOROCCAN_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto bg-[#00429a] hover:bg-[#00337a] text-white px-8 py-3.5 rounded-lg font-bold transition-colors shrink-0"
        >
          {t('search.searchBtn')}
        </button>
      </form>
    );
  }

  // Fallback for non-hero variant
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 shadow-sm"
    >
      <div className="relative flex-1">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
          <Search className="w-4 h-4" />
        </span>
        <select
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
          className="select-field w-full pl-10 border-0 bg-gray-50/80 dark:bg-gray-800/80 focus:ring-2 focus:ring-primary-500 font-medium"
        >
          <option value="">{t('search.allProfessions')}</option>
          {PROFESSIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {t(`professions.${p.value}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="relative flex-1">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
          <MapPin className="w-4 h-4" />
        </span>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="select-field w-full pl-10 border-0 bg-gray-50/80 dark:bg-gray-800/80 focus:ring-2 focus:ring-primary-500 font-medium"
        >
          <option value="">{t('search.allCities')}</option>
          {MOROCCAN_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn-accent px-8 text-base font-bold shadow-glow hover:scale-[1.02] transition-transform">
        {t('search.searchBtn')}
      </button>
    </form>
  );
}
