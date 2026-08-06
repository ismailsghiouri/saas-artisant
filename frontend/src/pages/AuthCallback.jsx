import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Page de retour du flux OAuth Google (redirectTo côté Supabase, voir
 * utils/supabase.js). Supabase renvoie le token de session directement dans
 * le fragment d'URL (#access_token=...) : on le lit ici nous-mêmes plutôt que
 * de dépendre de la détection automatique du SDK Supabase (getSession /
 * onAuthStateChange), qui s'est montrée peu fiable en production alors même
 * que le token est bien présent dans l'URL — le fragment étant disponible de
 * façon synchrone dès le montage, cette approche élimine tout risque de
 * condition de course.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const handledRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');

    if (!accessToken) {
      setError('Session Google introuvable.');
      setTimeout(() => navigate('/connexion', { replace: true }), 2000);
      return;
    }

    loginWithGoogle(accessToken)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch((err) => {
        setError(err.message || 'La connexion Google a échoué.');
        setTimeout(() => navigate('/connexion', { replace: true }), 2000);
      });
  }, [navigate, loginWithGoogle]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <p className="text-gray-500 dark:text-gray-400">
        {error || 'Connexion en cours...'}
      </p>
    </div>
  );
}
