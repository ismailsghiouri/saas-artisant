import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { PROFESSIONS } from '../utils/helpers';

const emptyRegisterForm = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  city: '',
  profession: PROFESSIONS[0].value,
};

export default function LoginModal({ onClose }) {
  const { login, register } = useAuth();
  const [accountType, setAccountType] = useState('client');
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login({ ...loginForm, role: accountType });
      } else {
        const payload = { ...registerForm, role: accountType };
        if (accountType === 'client') delete payload.profession;
        await register(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 text-sm font-medium">
          {['client', 'artisan'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              className={`flex-1 rounded-md py-1.5 transition-colors ${
                accountType === type
                  ? 'bg-white dark:bg-gray-900 text-primary-700 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {type === 'client' ? 'Je suis client' : 'Je suis artisan'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <>
              <div>
                <label className="label-field">Nom complet</label>
                <input
                  required
                  className="input-field"
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="label-field">Téléphone</label>
                <input
                  required
                  placeholder="06XXXXXXXX"
                  className="input-field"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="label-field">Ville</label>
                <input
                  required
                  className="input-field"
                  value={registerForm.city}
                  onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })}
                />
              </div>
              {accountType === 'artisan' && (
                <div>
                  <label className="label-field">Métier</label>
                  <select
                    className="select-field"
                    value={registerForm.profession}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, profession: e.target.value })
                    }
                  >
                    {PROFESSIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div>
            <label className="label-field">Email</label>
            <input
              required
              type="email"
              className="input-field"
              value={mode === 'login' ? loginForm.email : registerForm.email}
              onChange={(e) =>
                mode === 'login'
                  ? setLoginForm({ ...loginForm, email: e.target.value })
                  : setRegisterForm({ ...registerForm, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label-field">Mot de passe</label>
            <input
              required
              minLength={8}
              type="password"
              className="input-field"
              value={mode === 'login' ? loginForm.password : registerForm.password}
              onChange={(e) =>
                mode === 'login'
                  ? setLoginForm({ ...loginForm, password: e.target.value })
                  : setRegisterForm({ ...registerForm, password: e.target.value })
              }
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {mode === 'login' ? "Pas encore de compte ?" : 'Déjà un compte ?'}{' '}
          <button
            type="button"
            className="font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            onClick={() => {
              setError('');
              setMode(mode === 'login' ? 'register' : 'login');
            }}
          >
            {mode === 'login' ? "S'inscrire" : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  );
}
