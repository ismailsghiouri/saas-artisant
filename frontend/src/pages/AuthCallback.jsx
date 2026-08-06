import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';

/**
 * Page de retour du flux OAuth Google (redirectTo côté Supabase, voir
 * utils/supabase.js). Échange la session Supabase fraîchement créée contre
 * notre JWT applicatif via loginWithGoogle avant de rediriger vers le tableau
 * de bord — l'utilisateur ne voit jamais Supabase.
 *
 * On écoute onAuthStateChange plutôt qu'un simple getSession() ponctuel : le
 * client Supabase parse le token présent dans l'URL (#access_token=...) de
 * façon asynchrone, et rien ne garantit que ce parsing soit déjà terminé au
 * moment où ce composant monte — un getSession() immédiat peut donc arriver
 * "trop tôt" et ne rien trouver (constaté en prod, où la latence réseau plus
 * élevée qu'en local rend cette course perdante plus souvent).
 * onAuthStateChange, lui, se déclenche de façon fiable dès que la session est
 * prête, quel que soit le moment où le parsing se termine.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const handledRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) {
      navigate('/connexion', { replace: true });
      return;
    }

    const finish = (path) => {
      if (handledRef.current) return;
      handledRef.current = true;
      navigate(path, { replace: true });
    };

    const handleSession = async (accessToken) => {
      if (handledRef.current || !accessToken) return;
      try {
        await loginWithGoogle(accessToken);
        finish('/dashboard');
      } catch (err) {
        setError(err.message || 'La connexion Google a échoué.');
        handledRef.current = true;
        setTimeout(() => navigate('/connexion', { replace: true }), 2000);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session?.access_token);
    });

    // Filet de sécurité : si la session était déjà prête avant même que ce
    // composant ne s'abonne (peu probable mais pas impossible).
    supabase.auth.getSession().then(({ data }) => handleSession(data?.session?.access_token));

    // Si aucune session n'arrive dans un délai raisonnable (token invalide,
    // utilisateur ayant refusé l'accès côté Google...), on abandonne proprement.
    const timeout = setTimeout(() => {
      if (handledRef.current) return;
      handledRef.current = true;
      setError('Session Google introuvable.');
      setTimeout(() => navigate('/connexion', { replace: true }), 2000);
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, loginWithGoogle]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <p className="text-gray-500 dark:text-gray-400">
        {error || 'Connexion en cours...'}
      </p>
    </div>
  );
}
