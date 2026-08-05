import { useEffect, useState } from 'react';
import {
  createBlogPost,
  deleteBlogPost,
  fetchBlogPosts,
  updateBlogPost,
} from '../utils/api';
import { formatDate } from '../utils/helpers';

const ADMIN_KEY_STORAGE = 'maalam_expert_admin_key';

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImageUrl: '',
  category: '',
  tags: '',
  city: '',
  authorName: 'Équipe Maalam Expert',
  status: 'draft',
  seoTitle: '',
  seoDescription: '',
};

const DIACRITICS_PATTERN = new RegExp('[̀-ͯ]', 'g');

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_PATTERN, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function PostForm({ initialPost, adminKey, onSaved, onCancel }) {
  const [form, setForm] = useState(() =>
    initialPost
      ? {
          ...emptyForm,
          ...initialPost,
          tags: (initialPost.tags || []).join(', '),
        }
      : emptyForm
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTitleChange = (title) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: initialPost ? prev.slug : slugify(title),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      coverImageUrl: form.coverImageUrl || null,
      category: form.category,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      city: form.city || null,
      authorName: form.authorName,
      status: form.status,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
    };

    try {
      if (initialPost) {
        delete payload.slug; // le slug n'est pas modifiable via updateBlogPost
        await updateBlogPost(initialPost._id, payload, adminKey);
      } else {
        await createBlogPost(payload, adminKey);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-3 p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
        {initialPost ? "Modifier l'article" : 'Nouvel article'}
      </h2>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div>
        <label className="label-field">Titre</label>
        <input
          required
          className="input-field"
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />
      </div>

      <div>
        <label className="label-field">Slug (URL)</label>
        <input
          required
          disabled={Boolean(initialPost)}
          className="input-field disabled:opacity-60"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label-field">Catégorie</label>
          <input
            required
            className="input-field"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>
        <div>
          <label className="label-field">Ville ciblée (SEO local)</label>
          <input
            className="input-field"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="label-field">Extrait</label>
        <textarea
          rows={2}
          maxLength={300}
          className="input-field"
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
        />
      </div>

      <div>
        <label className="label-field">Contenu</label>
        <textarea
          required
          rows={10}
          className="input-field"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label-field">Image de couverture (URL)</label>
          <input
            className="input-field"
            value={form.coverImageUrl}
            onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
          />
        </div>
        <div>
          <label className="label-field">Tags (séparés par des virgules)</label>
          <input
            className="input-field"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label-field">Titre SEO</label>
          <input
            maxLength={70}
            className="input-field"
            value={form.seoTitle}
            onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
          />
        </div>
        <div>
          <label className="label-field">Meta description SEO</label>
          <input
            maxLength={160}
            className="input-field"
            value={form.seoDescription}
            onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="label-field">Statut</label>
        <select
          className="select-field"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="draft">Brouillon</option>
          <option value="published">Publié</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn-outline flex-1">
          Annuler
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(ADMIN_KEY_STORAGE) || '');
  const [keyInput, setKeyInput] = useState('');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingPost, setEditingPost] = useState(undefined); // undefined = hidden, null = create, object = edit

  const loadPosts = () => {
    setIsLoading(true);
    setError(null);
    fetchBlogPosts({ limit: 50 })
      .then((res) => setPosts(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (adminKey) loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  const handleKeySubmit = (e) => {
    e.preventDefault();
    sessionStorage.setItem(ADMIN_KEY_STORAGE, keyInput);
    setAdminKey(keyInput);
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Supprimer l'article "${post.title}" ?`)) return;
    try {
      await deleteBlogPost(post._id, adminKey);
      loadPosts();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!adminKey) {
    return (
      <div className="page-container max-w-md py-16">
        <h1 className="section-title">Accès administrateur</h1>
        <p className="section-subtitle mb-6">
          Entrez la clé d'administration Maalam Expert pour gérer les articles du blog.
        </p>
        <form onSubmit={handleKeySubmit} className="card space-y-3 p-6">
          <div>
            <label className="label-field">Clé administrateur</label>
            <input
              required
              type="password"
              className="input-field"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Valider
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="page-container py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Gestion du blog</h1>
          <p className="section-subtitle">Créez, modifiez et publiez les articles Maalam Expert.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditingPost(null)} className="btn-accent">
            + Nouvel article
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem(ADMIN_KEY_STORAGE);
              setAdminKey('');
            }}
            className="btn-outline"
          >
            Se déconnecter
          </button>
        </div>
      </div>

      {editingPost !== undefined && (
        <div className="mb-8">
          <PostForm
            initialPost={editingPost}
            adminKey={adminKey}
            onCancel={() => setEditingPost(undefined)}
            onSaved={() => {
              setEditingPost(undefined);
              loadPosts();
            }}
          />
        </div>
      )}

      {isLoading && <p className="text-gray-500 dark:text-gray-400">Chargement...</p>}
      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post._id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{post.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {post.category} · {formatDate(post.publishedAt || post.createdAt)} · {post.viewsCount || 0} vues
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingPost(post)} className="btn-outline">
                Modifier
              </button>
              <button onClick={() => handleDelete(post)} className="btn-ghost text-red-600 dark:text-red-400">
                Supprimer
              </button>
            </div>
          </div>
        ))}
        {!isLoading && posts.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucun article publié pour le moment. Seuls les articles publiés apparaissent dans cette
            liste ; les brouillons restent visibles tant que la page n'est pas rechargée.
          </p>
        )}
      </div>
    </div>
  );
}
