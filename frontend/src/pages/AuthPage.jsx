import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PROFESSIONS, MOROCCAN_CITIES } from '../utils/helpers';
import { signInWithGoogle } from '../utils/supabase';
import { DotMap } from '../components/ui/travel-connect-signin-1';

const emptyForm = {
  email: '',
  password: '',
  name: '',
  phone: '',
  city: '',
  category: '',
  years_experience: '',
};

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  
  const isRegisterRoute = location.pathname.includes('inscription');
  const [isSignUp, setIsSignUp] = useState(isRegisterRoute);
  const [userType, setUserType] = useState('client');
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state if route changes
  useEffect(() => {
    setIsSignUp(isRegisterRoute);
  }, [isRegisterRoute]);

  const updateField = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || "La connexion Google n'est pas disponible.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          city: formData.city,
          role: userType || 'client',
          ...(userType === 'worker' && {
            category: formData.category,
            years_experience: formData.years_experience ? Number(formData.years_experience) : 0,
          }),
        };
        await register(payload);
        navigate('/dashboard');
      } else {
        await login(formData.email, formData.password);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = (mode) => {
    setIsSignUp(mode === 'register');
    navigate(mode === 'register' ? '/inscription' : '/connexion', { replace: true });
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Return to home link (Optional, adds a nice touch for full pages) */}
      <div className="absolute top-6 left-6 z-10 hidden sm:block">
        <Link to="/" className="flex items-center text-primary-800 hover:text-primary-600 font-semibold text-sm transition-colors">
          <span className="mr-2">←</span> Retour à l'accueil
        </Link>
      </div>

      <main className="flex-grow flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-xl overflow-hidden shadow-[0_4px_20px_-1px_rgba(26,43,76,0.08)] border border-gray-100/50 min-h-[700px]">
          
          {/* Left Side: Branding & Trust */}
          {isSignUp ? (
            // Inscription Left Side
            <div className="hidden md:flex flex-col justify-between p-8 lg:p-12 bg-[#0f52ba] text-white">
              <div>
                <img src="/new-logo.png" alt="Maalam Expert" className="h-9 w-auto object-contain mb-6 brightness-0 invert" />
                <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-8">Des pros certifiés pour vos travaux, en toute confiance.</h2>
                <ul className="space-y-5">
                  <li className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-white/20 text-[#d8e3fb] text-lg font-bold">✓</span>
                    <span className="text-base lg:text-lg">Artisans vérifiés et qualifiés</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-white/20 text-[#d8e3fb] text-lg font-bold">✓</span>
                    <span className="text-base lg:text-lg">Transparence totale des prix</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-white/20 text-[#d8e3fb] text-lg font-bold">✓</span>
                    <span className="text-base lg:text-lg">Réservation simple et rapide</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 lg:mt-12 relative rounded-lg overflow-hidden h-48 lg:h-56 shadow-lg group shrink-0">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCD_E9CQ9e1OjdM0vhk5Th6IqbDW7rxdouXbJBoRTLILUNfEfVDuFaZnswpy6z-FayFswD3M04Ji7mrOMCH1c1x-k6YSSj-Z2mIXILXyIc_coEIxRC6p4PJ-FWSQg6KXMY8nybK8zKhw5iU6sF3OtAzqHOJqOyMgZh2bHFueFDTOy343hSZu_h--xBUiRCR0cMIroJ4dzdqZCo8lyyTsEymLOFD90sWaftKBqGB4fzFjNtCrh_CELg')" }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f52ba]/90 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-sm italic opacity-90 leading-snug">"Grâce à Maalam Expert, j'ai trouvé un électricien en moins de 30 minutes. Travail impeccable !"</p>
                  <p className="text-sm font-bold mt-1.5 text-[#d8e3fb]">— Marie L., Propriétaire</p>
                </div>
              </div>
            </div>
          ) : (
            // Connexion Left Side
            <div className="hidden md:flex flex-col relative overflow-hidden bg-[#003c90] border-r border-[#003c90]/50 p-12">
              <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDBbCk6qZNK7SKsQjbKdtSnsLJWKgWSKjYbYII2R9F1i89ase5MPhuCVj7kVUa7_Y86V069tLXWnRo_qySD1JHklh-V-FT70bm_8ihtobVmTLjt7R0h1-RvxQghAQUedG1kLVSAq3DWnV8LZiN7EFXG0u-wmLaBZP8sCYBqvSKwK6o5hfMPRqP1Q5rUhL7N2cBElA6rx3DdxeFbLu6KZeDfU5gZ2nfG3g14Z4TuMHKpPoYG95OaV-I')" }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#003c90] via-[#003c90]/80 to-transparent"></div>
              
              <div className="relative z-10 flex flex-col justify-center h-full text-white">
                <h2 className="text-4xl font-bold leading-tight mb-6">
                  Gérez vos projets en toute sérénité
                </h2>
                <p className="text-lg text-[#b0c6ff] leading-relaxed max-w-sm mb-12">
                  Accédez à votre espace professionnel Maalam Expert pour suivre vos interventions, gérer vos devis et développer votre activité locale.
                </p>
                <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-6">
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full border-2 border-[#003c90] bg-gray-200 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDBzeRi3y74vZ9kjSxl3-FwAXc_hWFRMWmBUkXPaNvyahUZuT04izXUKKPms3ohCZW4c6GM75xCy22SAhMB1sBtmoYcWc9jnyJybAtG9_LxNqiZIvtpz8jAXLXEit281Sp-2JUTR_nmdv2gIgFiu1eFp6JlTjmxF8N4m6RYdAomOXZlsftKHIhXYeY48-KaRq8_EQL1S4WpNTLzTQViEnIbvw-c4z5HKx5DKe1yjVTfaHNpEfmi9gA')" }}></div>
                    <div className="w-10 h-10 rounded-full border-2 border-[#003c90] bg-gray-200 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDWRSA6mafEK3ZU_4TFR0SuwsItJU_DjZr5-24MPJhPuClosmLMgGMoR7GpuwthPoXay8R1Li6nHHHJva7_-59OaA48BQNf6zhrBc6PuUxYTs88yaebpoFCk-Z5bWOM3bGaoemzPMhkbKnDo5P2ZajtL0b3erKQqDupi0WbC2OeCev4vRlrMzeb6YXz_WVsBCopHHQgcBklIpzsH0XRmCLr_buijPzFpY_q2jSdIcS3Es-9GLHz_Z8')" }}></div>
                    <div className="w-10 h-10 rounded-full border-2 border-[#003c90] bg-gray-200 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBDeJ_Eqz_6iXlIhCzXBnnJA66hHjRUJmLVUQXFYlbY_HrTnhKfzZLVCOwE9ELj1FIzU3bE__2LRr24E_Ce7LvwMLDisT42KBo96zSUR_5G0A_Ng-ndMKz3uK9qbsTuQ_sdiHa6kbd-FkFhhZr-WmzYVjGEvb9C_lnOxgdO1tdc3FdwCNJbo1LkvzBUH2qLZ0TFcLOJY_r39-aniQttHR56yJHtdOSVQ01ys3z_EjSlJnpqf47sn58')" }}></div>
                  </div>
                  <p className="text-sm font-medium text-[#b0c6ff]">
                    Rejoignez <span className="font-bold text-white">+2,000</span> artisans de confiance
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Right Side: Forms */}
          <div className="p-8 md:p-12 flex flex-col justify-center bg-white relative overflow-y-auto">
            {!isSignUp && (
              <div className="absolute top-8 right-8 hidden md:block">
                <img src="/new-logo.png" alt="Maalam Expert" className="h-8 w-auto object-contain" />
              </div>
            )}

            <div className="w-full max-w-sm mx-auto my-auto">
              {isSignUp ? (
                // Inscription Form
                <>
                  <div className="mb-8 text-left">
                    <h3 className="text-2xl font-bold text-[#003c90] mb-2">Créez votre compte</h3>
                    <p className="text-gray-500 text-sm">Rejoignez la communauté Maalam Expert aujourd'hui.</p>
                  </div>
                  
                  <div className="flex p-1 bg-gray-100 rounded-lg mb-8">
                    <button
                      type="button"
                      onClick={() => setUserType('client')}
                      className={`flex-1 py-3 px-4 rounded-md text-sm font-semibold transition-all ${
                        userType === 'client' ? 'bg-[#0f52ba] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      S'inscrire en tant que Client
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType('worker')}
                      className={`flex-1 py-3 px-4 rounded-md text-sm font-semibold transition-all ${
                        userType === 'worker' ? 'bg-[#0f52ba] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      S'inscrire en tant qu'Artisan
                    </button>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 mb-4">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-600">Nom complet</label>
                      <input
                        required
                        type="text"
                        placeholder="Jean Dupont"
                        className="w-full py-2 bg-transparent border-0 border-b-2 border-gray-300 focus:ring-0 focus:border-[#0f52ba] transition-colors text-base p-0"
                        value={formData.name}
                        onChange={updateField('name')}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-600">Adresse email</label>
                      <input
                        required
                        type="email"
                        placeholder="jean.dupont@email.com"
                        className="w-full py-2 bg-transparent border-0 border-b-2 border-gray-300 focus:ring-0 focus:border-[#0f52ba] transition-colors text-base p-0"
                        value={formData.email}
                        onChange={updateField('email')}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-600">Téléphone</label>
                      <input
                        required
                        type="tel"
                        placeholder="06XXXXXXXX"
                        className="w-full py-2 bg-transparent border-0 border-b-2 border-gray-300 focus:ring-0 focus:border-[#0f52ba] transition-colors text-base p-0"
                        value={formData.phone}
                        onChange={updateField('phone')}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-600">Ville</label>
                      <select
                        required
                        className="w-full py-2 bg-transparent border-0 border-b-2 border-gray-300 focus:ring-0 focus:border-[#0f52ba] transition-colors text-base p-0 cursor-pointer text-gray-700"
                        value={formData.city}
                        onChange={updateField('city')}
                      >
                        <option value="" disabled>Sélectionnez votre ville</option>
                        {MOROCCAN_CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {userType === 'worker' && (
                      <>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium text-gray-600">Métier</label>
                          <select
                            required
                            className="w-full py-2 bg-transparent border-0 border-b-2 border-gray-300 focus:ring-0 focus:border-[#0f52ba] transition-colors text-base p-0 cursor-pointer text-gray-700"
                            value={formData.category}
                            onChange={updateField('category')}
                          >
                            <option value="" disabled>Sélectionnez votre métier</option>
                            {PROFESSIONS.map((p) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium text-gray-600">Années d'expérience</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="Ex: 5"
                            className="w-full py-2 bg-transparent border-0 border-b-2 border-gray-300 focus:ring-0 focus:border-[#0f52ba] transition-colors text-base p-0"
                            value={formData.years_experience}
                            onChange={updateField('years_experience')}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-600">Mot de passe</label>
                      <div className="relative">
                        <input
                          required
                          minLength={6}
                          type="password"
                          placeholder="••••••••"
                          className="w-full py-2 bg-transparent border-0 border-b-2 border-gray-300 focus:ring-0 focus:border-[#0f52ba] transition-colors text-base p-0 pr-8"
                          value={formData.password}
                          onChange={updateField('password')}
                        />
                        <button type="button" className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 py-2">
                      <input type="checkbox" id="terms" required className="mt-1 rounded border-gray-300 text-[#0f52ba] focus:ring-[#0f52ba]" />
                      <label htmlFor="terms" className="text-xs text-gray-600 leading-snug">
                        J'accepte les <a href="#" className="text-[#0f52ba] font-bold hover:underline">Conditions d'utilisation</a> et la <a href="#" className="text-[#0f52ba] font-bold hover:underline">Politique de confidentialité</a>.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-[#0f52ba] text-white font-semibold rounded-lg shadow-md hover:bg-[#003c90] active:scale-[0.98] transition-all mt-4"
                    >
                      {loading ? 'Chargement...' : 'Créer mon compte'}
                    </button>
                  </form>

                  <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-500">
                      Déjà inscrit ?{' '}
                      <button type="button" onClick={() => toggleAuthMode('login')} className="text-[#0f52ba] font-bold hover:underline">
                        Se connecter
                      </button>
                    </p>
                  </div>

                  {userType === 'client' && (
                    <div className="mt-4 p-4 bg-[#e7eeff] rounded-lg border border-[#b0c6ff]/30 flex items-start gap-2">
                      <span className="text-[#0f52ba] text-lg leading-none">ℹ️</span>
                      <span className="text-xs text-[#003c90] font-medium leading-relaxed">
                        En tant que client, vous accédez à un réseau d'artisans notés et certifiés par nos équipes locales.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                // Connexion Form
                <>
                  <header className="mb-8 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Bon retour parmi nous</h2>
                    <p className="text-sm text-gray-500">Veuillez entrer vos coordonnées pour vous connecter.</p>
                  </header>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full h-12 flex items-center justify-center gap-3 border border-gray-300 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continuer avec Google
                  </button>

                  <div className="relative flex items-center py-6">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase tracking-wider font-medium">
                      ou par email
                    </span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 mb-4">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-900">Email</label>
                      <input
                        required
                        type="email"
                        placeholder="nom@exemple.com"
                        className="w-full py-2 bg-transparent border-0 border-b-2 border-gray-300 focus:ring-0 focus:border-[#0f52ba] transition-colors text-base p-0"
                        value={formData.email}
                        onChange={updateField('email')}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-900">Mot de passe</label>
                        <a href="#" className="text-sm font-medium text-[#0f52ba] hover:underline">Mot de passe oublié ?</a>
                      </div>
                      <input
                        required
                        minLength={6}
                        type="password"
                        placeholder="••••••••"
                        className="w-full py-2 bg-transparent border-0 border-b-2 border-gray-300 focus:ring-0 focus:border-[#0f52ba] transition-colors text-base p-0"
                        value={formData.password}
                        onChange={updateField('password')}
                      />
                    </div>

                    <div className="flex items-center space-x-2 py-2">
                      <input type="checkbox" id="remember" className="w-4 h-4 text-[#0f52ba] border-gray-300 rounded focus:ring-[#0f52ba]" />
                      <label htmlFor="remember" className="text-sm text-gray-500">Se souvenir de moi</label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-[#0f52ba] text-white font-semibold rounded-lg shadow-md hover:bg-[#003c90] active:scale-[0.98] transition-all mt-6"
                    >
                      {loading ? 'Chargement...' : 'Se connecter'}
                    </button>
                  </form>

                  <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                      Nouveau sur Maalam Expert ?{' '}
                      <button type="button" onClick={() => toggleAuthMode('register')} className="text-[#0f52ba] font-bold hover:underline">
                        Créer un compte
                      </button>
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Mini Footer for Connexion (only on Desktop to match design) */}
            {!isSignUp && (
              <div className="mt-auto pt-8 flex justify-center gap-4 hidden md:flex w-full">
                <a href="#" className="text-xs text-gray-400 hover:text-[#0f52ba]">Politique de confidentialité</a>
                <span className="text-gray-300">•</span>
                <a href="#" className="text-xs text-gray-400 hover:text-[#0f52ba]">Conditions d'utilisation</a>
                <span className="text-gray-300">•</span>
                <a href="#" className="text-xs text-gray-400 hover:text-[#0f52ba]">Support</a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
