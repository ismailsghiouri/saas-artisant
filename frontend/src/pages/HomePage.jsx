import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, MessageCircle, ShieldCheck, Rocket, BadgeCheck, Star, Camera } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ArtisanCard from '../components/ArtisanCard';
import VoiceAssistantBtn from '../components/VoiceAssistantBtn';
import { fetchTopRatedArtisans } from '../utils/api';
import { PROFESSIONS } from '../utils/helpers';

const PROFESSION_ICONS = {
  plombier: '🚰',
  electricien: '⚡',
  serrurier: '🔑',
  peintre: '🎨',
  menuisier: '🪵',
  climatisation: '❄️',
  electromenager: '🧺',
  macon: '🧱',
  autre: '🛠️',
};

export default function HomePage() {
  const { t } = useTranslation();
  const [topArtisans, setTopArtisans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const HOW_IT_WORKS = [
    {
      icon: Search,
      title: t('home.hiwStep1Title'),
      text: t('home.hiwStep1Text'),
      tint: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
    },
    {
      icon: MessageCircle,
      title: t('home.hiwStep2Title'),
      text: t('home.hiwStep2Text'),
      tint: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
    },
    {
      icon: ShieldCheck,
      title: t('home.hiwStep3Title'),
      text: t('home.hiwStep3Text'),
      tint: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    },
  ];

  useEffect(() => {
    fetchTopRatedArtisans(6)
      .then((res) => setTopArtisans(res.data))
      .catch(() => setTopArtisans([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center pt-20">
        {/* Background Image & Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#07428c]/95 via-[#07428c]/80 to-[#07428c]/30" />
        </div>

        <div className="page-container relative z-10 w-full flex flex-col items-center justify-center pt-10 pb-16">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6 drop-shadow-sm">
              {t('home.heroTitle1')} <br className="hidden sm:block" /> {t('home.heroTitle2')}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-white/95 max-w-2xl mx-auto leading-relaxed drop-shadow-sm mb-10">
              {t('home.heroSubtitle')}
            </p>
          </div>

          <div className="w-full max-w-4xl mx-auto mb-10">
            <SearchBar variant="hero" />
            
            {/* AI Diagnostic Buttons */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Link
                to="/diagnostic"
                className="w-full h-full inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm sm:text-base font-bold text-[#07428c] shadow-lg hover:shadow-xl hover:scale-105 transition-all border-2 border-white text-center"
              >
                <Camera className="h-5 w-5 shrink-0" />
                <span>
                  {t('home.photoDiagText1')} {t('home.photoDiagText2')}
                </span>
              </Link>
              <VoiceAssistantBtn className="w-full h-full" />
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 mt-4">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-[#2bd685]" />
              <span className="text-sm font-medium text-white">{t('home.badgeCertified')}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#2bd685]" />
              <span className="text-sm font-medium text-white">{t('home.badgeVerified')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[#2bd685]" />
              <span className="text-sm font-medium text-white">{t('home.badgeAi')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="page-container py-12">
        <div className="rounded-3xl bg-gradient-to-r from-primary-900 to-accent-900 p-8 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">{t('home.aiSectionTitle')}</h2>
            <p className="text-lg text-primary-100 mb-8 leading-relaxed">
              {t('home.aiSectionSubtitle')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Link
                to="/diagnostic"
                className="w-full h-full inline-flex items-center justify-center gap-2 bg-white text-primary-900 px-4 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform border-2 border-white text-center text-sm sm:text-base"
              >
                <Camera className="w-5 h-5 shrink-0" />
                <span>
                  {t('home.photoDiagText1')} {t('home.photoDiagText2')}
                </span>
              </Link>
              <VoiceAssistantBtn className="w-full h-full" />
            </div>
          </div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* Professions Grid */}
      <section className="page-container py-16">
        <div className="text-center mb-10">
          <h2 className="section-title">{t('home.servicesTitle')}</h2>
          <p className="section-subtitle mx-auto">{t('home.servicesSubtitle')}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {PROFESSIONS.slice(0, 8).map((p) => (
            <Link
              key={p.value}
              to={`/recherche?profession=${p.value}`}
              className="card-hover flex flex-col items-center gap-3 p-6 text-center group bg-white dark:bg-gray-900"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-3xl group-hover:scale-110 group-hover:bg-accent-50 transition-all duration-300">
                {PROFESSION_ICONS[p.value] || '🛠️'}
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-800 dark:group-hover:text-accent-400 transition-colors">
                {t(`professions.${p.value}`)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Rated Artisans */}
      <section className="page-container py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="section-title">{t('home.topArtisansTitle')}</h2>
            <p className="section-subtitle">{t('home.topArtisansSubtitle')}</p>
          </div>
          <Link to="/recherche" className="btn-outline self-start sm:self-auto">
            {t('home.viewAll')}
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="card p-6 h-64 animate-pulse bg-gray-100 dark:bg-gray-800/50" />
            ))}
          </div>
        ) : topArtisans.length === 0 ? (
          <div className="card p-12 text-center text-gray-500 dark:text-gray-400">
            {t('home.noArtisans')}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topArtisans.map((artisan) => (
              <ArtisanCard key={artisan._id} artisan={artisan} />
            ))}
          </div>
        )}
      </section>

      {/* How it Works */}
      <section id="comment-ca-marche" className="page-container pb-16 pt-8">
        <div className="rounded-3xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 p-8 sm:p-12">
          <div className="text-center mb-10">
            <h2 className="section-title">{t('home.howItWorksTitle')}</h2>
            <p className="section-subtitle mx-auto">
              {t('home.howItWorksSubtitle')}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ icon: Icon, title, text, tint }) => (
              <div key={title} className="card flex flex-col items-center p-6 text-center">
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${tint}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h4 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{title}</h4>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Become an Artisan CTA */}
      <section className="page-container pb-20">
        <div className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-3xl bg-primary-900 p-8 shadow-2xl sm:p-12 md:flex-row">
          <div className="relative z-10 max-w-xl text-center md:text-left">
            <h3 className="font-display text-2xl font-extrabold text-white sm:text-3xl mb-3">
              {t('home.ctaTitle')}
            </h3>
            <p className="mb-8 text-primary-100/90">
              {t('home.ctaSubtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:justify-start">
              <Link to="/inscription" className="btn-accent">
                {t('home.ctaBtn1')}
                <Rocket className="h-4 w-4" />
              </Link>
              <a
                href="#comment-ca-marche"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20"
              >
                {t('home.ctaBtn2')}
              </a>
            </div>
          </div>
          <div className="relative z-10 hidden h-40 w-40 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md md:flex">
            <span className="text-6xl">🛠️</span>
          </div>
          <div className="pointer-events-none absolute top-0 right-0 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl" />
        </div>
      </section>
    </div>
  );
}
