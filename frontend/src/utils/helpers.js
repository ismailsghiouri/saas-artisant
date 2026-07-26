export const PROFESSIONS = [
  { value: 'plombier', label: 'Plombier' },
  { value: 'electricien', label: 'Électricien' },
  { value: 'serrurier', label: 'Serrurier' },
  { value: 'peintre', label: 'Peintre' },
  { value: 'menuisier', label: 'Menuisier' },
  { value: 'climatisation', label: 'Climatisation' },
  { value: 'electromenager', label: 'Électroménager' },
  { value: 'macon', label: 'Maçon' },
  { value: 'autre', label: 'Autre' },
];

export const URGENCY_LEVELS = [
  { value: 'immediate', label: 'Immédiat' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'scheduled', label: 'Planifié' },
];

export const RESERVATION_STATUS_LABELS = {
  pending: { label: 'En attente', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  assigned: { label: 'Assignée', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  in_progress: { label: 'En cours', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  completed: { label: 'Terminée', className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  cancelled: { label: 'Annulée', className: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

export const professionLabel = (value) =>
  PROFESSIONS.find((p) => p.value === value)?.label || value;

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

export const formatPrice = (amount) => {
  if (amount === null || amount === undefined) return 'Sur devis';
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
};

export const truncate = (text = '', maxLength = 140) =>
  text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;

export const initials = (fullName = '') =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const slugify = (text = '') =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
