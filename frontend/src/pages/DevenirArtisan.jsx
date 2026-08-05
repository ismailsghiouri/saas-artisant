import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function DevenirArtisan() {
  const { t } = useTranslation();

  return (
    <main className="bg-white dark:bg-gray-950 antialiased">
      {/* Hero Section */}
      <section className="relative min-h-[870px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-cover bg-center opacity-90" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBY1DFKl5eR2alg4Ul47_PMtXdzj-8yqeWdRZyODLB8T4NGRljH71tdQhs3Y6NIk_dBZjTY0YV5R6l7UkgbOs1TGeUovoaEH7W6vy2XuOTndh8DYJBdm8pTG4WWmfHRXBxDLGQTUZKZ04I9rCwqdoDoRl6s-SAKOyfwyWG5aLbKBOFNMlovH5dNHCHHX9mbDOTgmxYyM16oIUE5zt8duzMR8zae4O-Rc66n-KWmEMfW4785n44pRSU')" }}>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/90 via-primary-600/40 to-transparent dark:from-gray-900/90 dark:via-gray-900/60"></div>
        </div>
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-24">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">{t('devenirArtisan.heroTitle')}</h1>
            <p className="text-lg sm:text-xl opacity-90 mb-10 max-w-xl">
              {t('devenirArtisan.heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/connexion" className="bg-white text-primary-700 px-8 py-4 rounded-xl font-semibold shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                {t('devenirArtisan.createProfile')}
                <span className="text-xl">→</span>
              </Link>
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all">
                {t('devenirArtisan.learnMore')}
              </button>
            </div>
            
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                  <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-gT-BmRpwtwmADPAFdJYmO4KT1dp3bCR9Cnyp600I2E5uINYbnEjqsT5fVJtx_KIH6l3E_eKZudbQjB0KoV2GiUijVTKHkvyLosnpnLborMbw5125mg8azc5tjWAJu49sMx6-UK6Di0NVe0_dMSSdytGnMuk68OAjw7TvzN25y3-YFm61IRQJDTC4mdu2GG-OMa7sCMHbfjX4p7FnjZ7BAvkDEB1x7Uld7UNmxOoTSJOUvZq6RfQ" alt="Artisan 1" />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-300 overflow-hidden">
                  <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeITTN6BeiNUN6Pe9l-INYXW68YE0mbgNdWm-Gzv4c_g41i7cQmJBrrjec5HqRmpP1yenB9DkoAaoZXyCRaze-2k0p9zUe2u4P_tuOJeLf-2mbTTM2pNrkQCQYwa1V8q9jNCaFdKbMONNyGHmnzTtPWSAQ7-k4k3UJ1i4ASZ7ll3z4UqVtNQ49nGzYjWx5D7opVM167pkb1g1yIw0O32BmjtSQi49igFwPfSt1KHEaLwIhnwsdf-Y" alt="Artisan 2" />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-400 overflow-hidden">
                  <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuASJtiDCRgJ3TE8Ea6rtgA_ZdWr61E0rHvOzhWApnd72tEUnv7kM8VilzsTN3zq8kHF6YZfZH0JhLr0qomx-L2EmpNIhi1wjfSTudstP1y0bt8ohifaYdF8XkOUTVo7xXsmStr1szvqRQdrnHrXKPmFzPV81mNdDWLVWXjFAbC-XnWM4ipWxIQkhVdsTKU_Tj2Tgex3eXVM48bEG9VtIJJUaA15GCxXZB7m1F7YXZP-G1waXtHXfpQ" alt="Artisan 3" />
                </div>
              </div>
              <p className="text-xs text-white/80 uppercase tracking-widest">{t('devenirArtisan.trustedBy')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary-600 dark:text-primary-400 font-bold tracking-widest text-sm uppercase">{t('devenirArtisan.whyUsLabel')}</span>
            <h2 className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{t('devenirArtisan.whyUsTitle')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-6 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t('devenirArtisan.benefit1Title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('devenirArtisan.benefit1Text')}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-6 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🛠️</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t('devenirArtisan.benefit2Title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('devenirArtisan.benefit2Text')}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow group">
              <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-6 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t('devenirArtisan.benefit3Title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('devenirArtisan.benefit3Text')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white dark:bg-gray-950 overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl font-bold mb-12 text-gray-900 dark:text-white">{t('devenirArtisan.howItWorksTitle')}</h2>
              <div className="space-y-12">
                <div className="flex gap-6">
                  <div className="flex-none w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl">1</div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('devenirArtisan.step1Title')}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{t('devenirArtisan.step1Text')}</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-none w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl">2</div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('devenirArtisan.step2Title')}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{t('devenirArtisan.step2Text')}</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-none w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-xl">3</div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('devenirArtisan.step3Title')}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{t('devenirArtisan.step3Text')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 relative">
              <div className="bg-primary-100 dark:bg-primary-900/20 rounded-full w-full aspect-square absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 blur-3xl"></div>
              <div className="relative bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700">
                <img className="rounded-xl w-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIo50yhVI9SrjaMn7t-j6OjLWE2YLaxgVK9Nd-oTQk5KGx0CVyS3K5ZwVeW4rJemHueJo9WypaX7T_5QToSoHU-NtSi9_R4vINGOHntQEFfgJylZTn718kT824CsEHzwncZhw_EFzoSqVxz_1EeXZ_FRK7n6sEIzo_7jF8-iw1BXKqa2ZALO95N-O5d0-zT5cPmniL6yayNII754X9OoDVlU2wVqUxKHHQi-KlcPCvkqEizI1GSkk" alt="Dashboard" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="py-20 bg-primary-600 dark:bg-primary-900 text-white">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold mb-2">+2000</div>
              <div className="text-xs uppercase tracking-wider opacity-80">{t('devenirArtisan.statPartners')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">15k</div>
              <div className="text-xs uppercase tracking-wider opacity-80">{t('devenirArtisan.statProjects')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.8/5</div>
              <div className="text-xs uppercase tracking-wider opacity-80">{t('devenirArtisan.statRating')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24h</div>
              <div className="text-xs uppercase tracking-wider opacity-80">{t('devenirArtisan.statPayment')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900 dark:text-white">{t('devenirArtisan.ctaFinalTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-12">
              {t('devenirArtisan.ctaFinalText')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link to="/connexion" className="bg-primary-600 text-white px-10 py-5 rounded-xl font-semibold shadow-xl hover:scale-105 hover:bg-primary-700 transition-all">
                {t('devenirArtisan.ctaStart')}
              </Link>
              <button className="bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border border-gray-200 dark:border-gray-700 px-10 py-5 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                {t('devenirArtisan.ctaTalk')}
              </button>
            </div>
            <p className="mt-8 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
              <span>✓</span>
              {t('devenirArtisan.ctaFooter')}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
