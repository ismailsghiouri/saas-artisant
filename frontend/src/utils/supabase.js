import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Reste "null" tant que le projet Supabase n'est pas configuré (variables
// d'env absentes) : les boutons "Continuer avec Google" affichent alors un
// message clair au lieu de planter.
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

/**
 * Lance le flux OAuth Google via Supabase (redirection navigateur). La
 * session est ensuite récupérée côté /auth/callback (voir AuthCallback.jsx),
 * qui échange le token Supabase contre notre JWT applicatif.
 */
export const signInWithGoogle = () => {
  if (!supabase) {
    return Promise.reject(new Error("La connexion Google n'est pas configurée pour le moment."));
  }

  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
};
