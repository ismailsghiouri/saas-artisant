import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { PROFESSIONS, MOROCCAN_CITIES } from '../utils/helpers';
import { signInWithGoogle } from '../utils/supabase';
import { DotMap } from './ui/travel-connect-signin-1';

const emptyForm = {
  email: '',
  password: '',
  name: '',
  phone: '',
  city: '',
  category: '',
  years_experience: '',
};

/**
 * Panneau gauche pour la page de Connexion
 */
function BrandPanelConnexion() {
  return (
    <div className="hidden md:flex w-1/2 relative overflow-hidden bg-primary-900 border-r border-primary-800/50">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 opacity-95" />
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <DotMap />
      </div>

      <div className="relative z-10 flex flex-col justify-between p-8 sm:p-10 text-white w-full h-full">
        {/* Placeholder for images like in the original design if needed, but for now we keep the abstract map */}
        <div className="flex-grow flex flex-col justify-center py-6">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl sm:text-3xl font-extrabold leading-tight text-white mb-3"
          >
            Gérez vos projets en toute sérénité
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-sm sm:text-base text-primary-100/90 leading-relaxed max-w-sm"
          >
            Accédez à votre espace professionnel FixNow pour suivre vos interventions, gérer vos devis et développer votre activité locale.
          </motion.p>

          <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
            <div className="flex -space-x-2">
              <div className="h-9 w-9 rounded-full border-2 border-primary-900 bg-primary-700 flex items-center justify-center text-xs font-bold text-white">
                YA
              </div>
              <div className="h-9 w-9 rounded-full border-2 border-primary-900 bg-secondary-600 flex items-center justify-center text-xs font-bold text-white">
                RB
              </div>
              <div className="h-9 w-9 rounded-full border-2 border-primary-900 bg-primary-500 flex items-center justify-center text-xs font-bold text-white">
                AT
              </div>
            </div>
            <p className="text-xs font-medium text-primary-200">
              Rejoignez <span className="font-bold text-white">+2,000</span> artisans de confiance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Panneau gauche pour la page d'Inscription
 */
function BrandPanelInscription() {
  return (
    <div className="hidden md:flex flex-col justify-between p-12 bg-primary-700 text-white w-1/2">
      <div>
        <h1 className="text-2xl font-bold mb-8 text-primary-100">FixNow</h1>
        <h2 className="text-3xl font-bold leading-tight mb-8">Des pros certifiés pour vos travaux, en toute confiance.</h2>
        <ul className="space-y-4">
          <li className="flex items-center gap-3">
            <span className="text-xl text-primary-100">✓</span>
            <span className="text-base font-medium">Artisans vérifiés et qualifiés</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-xl text-primary-100">✓</span>
            <span className="text-base font-medium">Transparence totale des prix</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-xl text-primary-100">✓</span>
            <span className="text-base font-medium">Réservation simple et rapide</span>
          </li>
        </ul>
      </div>
      <div className="mt-8 relative rounded-lg overflow-hidden h-64 shadow-lg group">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-sm italic opacity-90 text-white">"Grâce à FixNow, j'ai trouvé un électricien en moins de 30 minutes. Travail impeccable !"</p>
          <p className="text-sm font-bold mt-1 text-white">— Marie L., Propriétaire</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginModal({ onClose, onSuccess, initialRole = null }) {
  const { login, register } = useAuth();
  const [userType, setUserType] = useState(initialRole || 'client');
  const [isSignUp, setIsSignUp] = useState(Boolean(initialRole));
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        const user = await register(payload);
        onSuccess?.(user);
      } else {
        const user = await login(formData.email, formData.password);
        onSuccess?.(user);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="flex w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {isSignUp ? <BrandPanelInscription /> : <BrandPanelConnexion />}

        {/* Right Side */}
        <div className="flex-1 bg-white flex flex-col px-8 py-10 overflow-y-auto relative">
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-6 right-6 rounded-full p-2 text-gray-400 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>

          {!isSignUp && (
            <div className="absolute top-8 right-16 text-primary-700 font-bold text-xl">
              FixNow
            </div>
          )}

          <div className="w-full max-w-sm mx-auto space-y-6 my-auto">
            {!isSignUp ? (
              // CONNEXION FORM
              <>
                <header className="space-y-2 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-gray-900">Bon retour parmi nous</h2>
                  <p className="text-sm text-gray-500">
                    Veuillez entrer vos coordonnées pour vous connecter.
                  </p>
                </header>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full h-12 flex items-center justify-center gap-3 border border-gray-300 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continuer avec Google
                </button>

                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase tracking-wider font-medium">
                    OU PAR EMAIL
                  </span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Email</label>
                    <div className="relative group border-b-2 border-gray-200 focus-within:border-primary-700 transition-all duration-200">
                      <input
                        required
                        type="email"
                        className="w-full py-2 bg-transparent border-none focus:ring-0 text-sm text-gray-900 placeholder-gray-400 p-0"
                        placeholder="nom@exemple.com"
                        value={formData.email}
                        onChange={updateField('email')}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-gray-500">Mot de passe</label>
                      <a href="#" className="text-xs font-medium text-gray-500 hover:text-primary-700">
                        Mot de passe oublié ?
                      </a>
                    </div>
                    <div className="relative group border-b-2 border-gray-200 focus-within:border-primary-700 transition-all duration-200">
                      <input
                        required
                        minLength={6}
                        type="password"
                        className="w-full py-2 bg-transparent border-none focus:ring-0 text-sm text-gray-900 placeholder-gray-400 p-0"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={updateField('password')}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 py-2">
                    <input type="checkbox" id="remember" className="w-4 h-4 text-primary-700 border-gray-300 rounded focus:ring-primary-700" />
                    <label htmlFor="remember" className="text-sm text-gray-600">
                      Se souvenir de moi
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-primary-800 hover:bg-primary-900 text-white font-medium text-sm rounded-lg transition-all duration-200 shadow-md mt-6"
                  >
                    {loading ? 'Chargement...' : 'Se connecter'}
                  </button>
                </form>

                <footer className="text-center pt-6">
                  <p className="text-sm text-gray-500">
                    Nouveau sur FixNow ?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setIsSignUp(true);
                      }}
                      className="font-bold text-primary-800 hover:underline"
                    >
                      Créer un compte
                    </button>
                  </p>
                </footer>
              </>
            ) : (
              // INSCRIPTION FORM
              <>
                <header className="space-y-2 mb-6 text-left">
                  <h3 className="text-2xl font-bold text-primary-800">Créez votre compte</h3>
                  <p className="text-sm text-gray-500">
                    Rejoignez la communauté FixNow aujourd'hui.
                  </p>
                </header>

                <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
                  <button
                    type="button"
                    onClick={() => setUserType('client')}
                    className={`flex-1 py-3 px-4 rounded-md text-sm font-semibold transition-all ${
                      userType === 'client'
                        ? 'bg-primary-800 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    S'inscrire en tant que Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('worker')}
                    className={`flex-1 py-3 px-4 rounded-md text-sm font-semibold transition-all ${
                      userType === 'worker'
                        ? 'bg-primary-800 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-200'
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
                    <label className="text-xs font-semibold text-gray-600">Nom complet</label>
                    <div className="relative border-b-2 border-gray-200 focus-within:border-primary-800 transition-colors">
                      <input
                        required
                        className="w-full py-2 pr-4 bg-transparent border-none focus:ring-0 text-sm text-gray-900 placeholder-gray-400 p-0"
                        placeholder="Jean Dupont"
                        value={formData.name}
                        onChange={updateField('name')}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600">Adresse email</label>
                    <div className="relative border-b-2 border-gray-200 focus-within:border-primary-800 transition-colors">
                      <input
                        required
                        type="email"
                        className="w-full py-2 pr-4 bg-transparent border-none focus:ring-0 text-sm text-gray-900 placeholder-gray-400 p-0"
                        placeholder="jean.dupont@email.com"
                        value={formData.email}
                        onChange={updateField('email')}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600">Téléphone</label>
                    <div className="relative border-b-2 border-gray-200 focus-within:border-primary-800 transition-colors">
                      <input
                        required
                        type="tel"
                        className="w-full py-2 pr-4 bg-transparent border-none focus:ring-0 text-sm text-gray-900 placeholder-gray-400 p-0"
                        placeholder="06XXXXXXXX"
                        value={formData.phone}
                        onChange={updateField('phone')}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600">Ville</label>
                    <div className="relative border-b-2 border-gray-200 focus-within:border-primary-800 transition-colors">
                      <select
                        required
                        className="w-full py-2 pr-4 bg-transparent border-none focus:ring-0 text-sm text-gray-900 p-0 cursor-pointer"
                        value={formData.city}
                        onChange={updateField('city')}
                      >
                        <option value="" disabled>Sélectionnez votre ville</option>
                        {MOROCCAN_CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {userType === 'worker' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600">Métier</label>
                        <div className="relative border-b-2 border-gray-200 focus-within:border-primary-800 transition-colors">
                          <select
                            required
                            className="w-full py-2 pr-4 bg-transparent border-none focus:ring-0 text-sm text-gray-900 p-0 cursor-pointer"
                            value={formData.category}
                            onChange={updateField('category')}
                          >
                            <option value="" disabled>Sélectionnez votre métier</option>
                            {PROFESSIONS.map((p) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600">Années d'expérience</label>
                        <div className="relative border-b-2 border-gray-200 focus-within:border-primary-800 transition-colors">
                          <input
                            type="number"
                            min="0"
                            className="w-full py-2 pr-4 bg-transparent border-none focus:ring-0 text-sm text-gray-900 p-0"
                            placeholder="Ex: 5"
                            value={formData.years_experience}
                            onChange={updateField('years_experience')}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-600">Mot de passe</label>
                    <div className="relative border-b-2 border-gray-200 focus-within:border-primary-800 transition-colors">
                      <input
                        required
                        minLength={6}
                        type="password"
                        className="w-full py-2 pr-4 bg-transparent border-none focus:ring-0 text-sm text-gray-900 placeholder-gray-400 p-0"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={updateField('password')}
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 py-2">
                    <input type="checkbox" id="terms" required className="mt-1 rounded border-gray-300 text-primary-800 focus:ring-primary-800" />
                    <label htmlFor="terms" className="text-xs text-gray-600 leading-snug">
                      J'accepte les <a href="#" className="text-primary-800 font-bold hover:underline">Conditions d'utilisation</a> et la <a href="#" className="text-primary-800 font-bold hover:underline">Politique de confidentialité</a>.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-primary-800 hover:bg-primary-900 text-white font-medium text-sm rounded-lg shadow-md transition-all active:scale-[0.98] mt-4"
                  >
                    {loading ? 'Chargement...' : 'Créer mon compte'}
                  </button>
                </form>

                <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-500">
                    Déjà inscrit ?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setIsSignUp(false);
                      }}
                      className="text-primary-800 font-bold hover:underline"
                    >
                      Se connecter
                    </button>
                  </p>
                </div>

                {userType === 'client' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-2">
                    <span className="text-primary-700 text-lg leading-none">ℹ️</span>
                    <span className="text-xs text-primary-800 font-medium leading-relaxed">
                      En tant que client, vous accédez à un réseau d'artisans notés et certifiés par nos équipes locales.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Mini Footer for Connexion */}
          {!isSignUp && (
            <div className="mt-auto pt-8 flex flex-wrap justify-center gap-4">
              <a href="#" className="text-xs text-gray-400 hover:text-primary-700 transition-colors">Politique de confidentialité</a>
              <span className="text-gray-300">•</span>
              <a href="#" className="text-xs text-gray-400 hover:text-primary-700 transition-colors">Conditions d'utilisation</a>
              <span className="text-gray-300">•</span>
              <a href="#" className="text-xs text-gray-400 hover:text-primary-700 transition-colors">Support</a>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
