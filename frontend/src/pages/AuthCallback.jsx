import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';

/**
 * Page de retour du flux OAuth Google (redirectTo côté Supabase, voir
 * utils/supabase.js). Récupère la session Supabase fraîchement créée, puis
 * l'échange contre notre JWT applicatif via loginWithGoogle avant de
 * rediriger vers le tableau de bord — l'utilisateur ne voit jamais Supabase.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const handledRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    if (!supabase) {
      navigate('/connexion', { replace: true });
      return;
    }

    supabase.auth
      .getSession()
      .then(async ({ data, error: sessionError }) => {
        const accessToken = data?.session?.access_token;
        if (sessionError || !accessToken) {
          throw new Error('Session Google introuvable.');
        }
        await loginWithGoogle(accessToken);
        navigate('/dashboard', { replace: true });
      })
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
