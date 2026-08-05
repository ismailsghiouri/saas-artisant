import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL });

// Attache le token JWT (client ou artisan) à chaque requête sortante, s'il est présent.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('maalam_expert_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalise les erreurs pour que les composants n'aient qu'à lire `error.message`.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Une erreur inattendue est survenue.';
    return Promise.reject(new Error(message));
  }
);

export default api;

// --- Artisans (workers) ---
export const fetchArtisans = (params) => api.get('/workers', { params }).then((res) => res.data);
export const fetchArtisanById = (id) => api.get(`/workers/${id}`).then((res) => res.data);
export const fetchTopRatedArtisans = (limit = 6) =>
  api.get('/workers/top-rated', { params: { limit } }).then((res) => res.data);
export const fetchArtisanReviews = (artisanId) =>
  api.get(`/workers/${artisanId}/reviews`).then((res) => res.data);

// --- Profil artisan connecté (tableau de bord worker) ---
export const fetchWorkerMe = () => api.get('/workers/me').then((res) => res.data);
export const updateWorkerProfile = (payload) =>
  api.put('/workers/me', payload).then((res) => res.data);
export const updateWorkerAvailability = (isAvailable) =>
  api.patch('/workers/me/availability', { isAvailable }).then((res) => res.data);
export const submitWorkerVerification = (payload) =>
  api.post('/workers/me/verification', payload).then((res) => res.data);
export const upgradeWorkerToPremium = () => api.put('/workers/upgrade-premium').then((res) => res.data);
export const fetchWorkerAnalytics = () => api.get('/workers/analytics').then((res) => res.data);

// --- Profil client connecté (tableau de bord client) ---
export const fetchClientMe = () => api.get('/clients/me').then((res) => res.data);
export const updateClientProfile = (payload) =>
  api.put('/clients/me', payload).then((res) => res.data);
export const toggleFavoriteWorker = (workerId) =>
  api.patch(`/clients/me/favorites/${workerId}`).then((res) => res.data);
export const fetchClientFavorites = () => api.get('/clients/favorites').then((res) => res.data);

// --- Auth ---
// Inscription/connexion sont centralisées sous /api/auth (JWT { id, email, role }).
export const registerClient = (payload) =>
  api.post('/auth/signup/client', payload).then((res) => res.data);
export const registerArtisan = (payload) =>
  api.post('/auth/signup/worker', payload).then((res) => res.data);
export const login = (payload) => api.post('/auth/login', payload).then((res) => res.data);
// Conservés pour compatibilité avec le code existant : les deux rôles
// partagent désormais le même endpoint de connexion.
export const loginClient = login;
export const loginArtisan = login;
export const fetchMe = () => api.get('/auth/me').then((res) => res.data);
// Connexion Google : le backend vérifie le token de session Supabase et émet
// notre propre JWT (voir routes/auth.js POST /google).
export const loginWithGoogle = (accessToken) =>
  api.post('/auth/google', { access_token: accessToken }).then((res) => res.data);

// --- Réservations ---
export const createReservation = (payload) =>
  api.post('/reservations', payload).then((res) => res.data);
// Contact direct d'un artisan précis depuis son profil (bouton WhatsApp).
export const createDirectReservation = (payload) =>
  api.post('/reservations/direct', payload).then((res) => res.data);
export const fetchMyReservationsAsClient = () =>
  api.get('/clients/reservations').then((res) => res.data);
export const fetchMyReservationsAsArtisan = () =>
  api.get('/workers/reservations').then((res) => res.data);
export const fetchAvailableJobs = () => api.get('/reservations/available').then((res) => res.data);
export const cancelReservation = (id, cancellationReason) =>
  api.patch(`/reservations/${id}/cancel`, { cancellationReason }).then((res) => res.data);
export const acceptReservation = (id) =>
  api.patch(`/reservations/${id}/accept`).then((res) => res.data);
export const startReservation = (id) =>
  api.patch(`/reservations/${id}/start`).then((res) => res.data);
export const completeReservation = (id, payload) =>
  api.patch(`/reservations/${id}/complete`, payload).then((res) => res.data);

// --- Diagnostic photo IA ---
export const diagnosePhoto = (formData) => api.post('/diagnose', formData).then((res) => res.data);
export const diagnoseVoice = (payload) => api.post('/diagnose/voice', payload).then((res) => res.data);

// --- Avis ---
export const createReview = (payload) => api.post('/reviews', payload).then((res) => res.data);
export const updateReview = (id, payload) => api.put(`/reviews/${id}`, payload).then((res) => res.data);
export const deleteReview = (id) => api.delete(`/reviews/${id}`).then((res) => res.data);

// --- Blog ---
export const fetchBlogPosts = (params) => api.get('/blog', { params }).then((res) => res.data);
export const fetchBlogPostBySlug = (slug) => api.get(`/blog/${slug}`).then((res) => res.data);
export const fetchBlogCategories = () => api.get('/blog/categories').then((res) => res.data);
export const createBlogPost = (payload, adminKey) =>
  api.post('/blog', payload, { headers: { 'x-admin-key': adminKey } }).then((res) => res.data);
export const updateBlogPost = (id, payload, adminKey) =>
  api.put(`/blog/${id}`, payload, { headers: { 'x-admin-key': adminKey } }).then((res) => res.data);
export const deleteBlogPost = (id, adminKey) =>
  api.delete(`/blog/${id}`, { headers: { 'x-admin-key': adminKey } }).then((res) => res.data);
