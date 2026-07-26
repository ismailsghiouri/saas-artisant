import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL });

// Attache le token JWT (client ou artisan) à chaque requête sortante, s'il est présent.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fixnow_token');
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

// --- Artisans ---
export const fetchArtisans = (params) => api.get('/artisans', { params }).then((res) => res.data);
export const fetchArtisanById = (id) => api.get(`/artisans/${id}`).then((res) => res.data);
export const fetchTopRatedArtisans = (limit = 6) =>
  api.get('/artisans/top-rated', { params: { limit } }).then((res) => res.data);
export const fetchArtisanReviews = (artisanId) =>
  api.get(`/artisans/${artisanId}/reviews`).then((res) => res.data);

// --- Auth ---
export const registerClient = (payload) =>
  api.post('/clients/register', payload).then((res) => res.data);
export const loginClient = (payload) => api.post('/clients/login', payload).then((res) => res.data);
export const registerArtisan = (payload) =>
  api.post('/artisans/register', payload).then((res) => res.data);
export const loginArtisan = (payload) =>
  api.post('/artisans/login', payload).then((res) => res.data);
export const fetchMe = (role) =>
  api.get(role === 'artisan' ? '/artisans/me' : '/clients/me').then((res) => res.data);

// --- Réservations ---
export const createReservation = (payload) =>
  api.post('/reservations', payload).then((res) => res.data);
export const fetchMyReservationsAsClient = () =>
  api.get('/reservations/me').then((res) => res.data);
export const fetchMyReservationsAsArtisan = () =>
  api.get('/reservations/artisan/me').then((res) => res.data);
export const fetchAvailableJobs = () => api.get('/reservations/available').then((res) => res.data);
export const cancelReservation = (id, cancellationReason) =>
  api.patch(`/reservations/${id}/cancel`, { cancellationReason }).then((res) => res.data);
export const acceptReservation = (id) =>
  api.patch(`/reservations/${id}/accept`).then((res) => res.data);
export const startReservation = (id) =>
  api.patch(`/reservations/${id}/start`).then((res) => res.data);
export const completeReservation = (id, payload) =>
  api.patch(`/reservations/${id}/complete`, payload).then((res) => res.data);

// --- Avis ---
export const createReview = (payload) => api.post('/reviews', payload).then((res) => res.data);

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
