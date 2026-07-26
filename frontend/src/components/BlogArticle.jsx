import { useEffect, useMemo, useState } from 'react';
import AdSlot from './AdSlot';
import BlogArticleCard from './BlogArticleCard';
import { fetchBlogPosts } from '../utils/api';
import { formatDate, slugify } from '../utils/helpers';

const WORDS_PER_MINUTE = 200;
const MID_AD_WORD_THRESHOLD = 500;

const countWords = (text = '') => (text.trim() ? text.trim().split(/\s+/).length : 0);

/**
 * Découpe le HTML de l'article (rédigé par l'équipe FixNow via AdminDashboard,
 * une route protégée par protectAdmin — ce n'est pas une saisie utilisateur)
 * en blocs de premier niveau. Chaque titre h2/h3 reçoit un id pour la table
 * des matières, et on repère la frontière de bloc la plus proche de 500 mots
 * pour y insérer l'encart publicitaire du milieu sans casser le HTML.
 */
function parseArticleContent(html) {
  if (!html) return { beforeAd: '', afterAd: '', toc: [], readTimeMinutes: 1 };

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks = Array.from(doc.body.children);
  const usedIds = new Set();
  const toc = [];
  let cumulativeWords = 0;
  let splitIndex = null;

  blocks.forEach((el, index) => {
    const words = countWords(el.textContent);

    if (/^h[23]$/i.test(el.tagName)) {
      let id = slugify(el.textContent) || `section-${index}`;
      while (usedIds.has(id)) id = `${id}-${index}`;
      usedIds.add(id);
      el.id = id;
      el.classList.add('scroll-mt-24');
      toc.push({ id, text: el.textContent, level: el.tagName.toUpperCase() === 'H2' ? 2 : 3 });
    }

    cumulativeWords += words;
    if (splitIndex === null && cumulativeWords >= MID_AD_WORD_THRESHOLD && index < blocks.length - 1) {
      splitIndex = index + 1;
    }
  });

  const totalWords = blocks.reduce((sum, el) => sum + countWords(el.textContent), 0);
  const readTimeMinutes = Math.max(1, Math.round(totalWords / WORDS_PER_MINUTE));
  const serialize = (list) => list.map((el) => el.outerHTML).join('');

  if (splitIndex === null) {
    return { beforeAd: serialize(blocks), afterAd: '', toc, readTimeMinutes };
  }

  return {
    beforeAd: serialize(blocks.slice(0, splitIndex)),
    afterAd: serialize(blocks.slice(splitIndex)),
    toc,
    readTimeMinutes,
  };
}

function TableOfContents({ items }) {
  if (items.length < 2) return null;

  return (
    <details className="card mb-8 p-4" open>
      <summary className="cursor-pointer text-sm font-semibold text-gray-900 dark:text-white">
        📑 Table des matières
      </summary>
      <ul className="mt-3 space-y-1.5 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? 'ml-4' : ''}>
            <a href={`#${item.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

function ShareButtons({ url, title }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const networks = [
    { label: 'Facebook', icon: '📘', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: 'X', icon: '𝕏', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { label: 'WhatsApp', icon: '💬', href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { label: 'LinkedIn', icon: '💼', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-gray-200 dark:border-gray-800 py-4">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Partager :</span>
      {networks.map((network) => (
        <a
          key={network.label}
          href={network.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={`Partager sur ${network.label}`}
        >
          <span aria-hidden="true">{network.icon}</span> {network.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        {copied ? '✅ Copié !' : '🔗 Copier le lien'}
      </button>
    </div>
  );
}

function RelatedPosts({ category, excludeSlug }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let active = true;
    fetchBlogPosts({ category, limit: 4 })
      .then((res) => {
        if (!active) return;
        setPosts((res.data || []).filter((p) => p.slug !== excludeSlug).slice(0, 3));
      })
      .catch(() => active && setPosts([]));
    return () => {
      active = false;
    };
  }, [category, excludeSlug]);

  if (posts.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="section-title mb-4 text-xl">Articles similaires</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogArticleCard key={post._id} post={post} />
        ))}
      </div>
    </section>
  );
}

// Pas d'API de commentaires côté backend pour l'instant : ils sont conservés
// dans le navigateur (par slug d'article) plutôt que de simuler un faux appel
// réseau qui donnerait l'illusion d'une persistance partagée.
function CommentsSection({ slug }) {
  const storageKey = `fixnow_comments_${slug}`;
  const [comments, setComments] = useState([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setComments(Array.isArray(stored) ? stored : []);
    } catch {
      setComments([]);
    }
  }, [storageKey]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    const next = [
      { id: Date.now(), name: name.trim(), text: text.trim(), createdAt: new Date().toISOString() },
      ...comments,
    ];
    setComments(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setName('');
    setText('');
  };

  return (
    <section className="mt-12">
      <h2 className="section-title text-xl">💬 Commentaires ({comments.length})</h2>
      <p className="mb-4 mt-1 text-xs text-gray-400">Enregistrés localement dans votre navigateur.</p>

      <form onSubmit={handleSubmit} className="card mb-6 space-y-3 p-4">
        <input
          type="text"
          placeholder="Votre nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          required
        />
        <textarea
          placeholder="Votre commentaire..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="input-field"
          required
        />
        <button type="submit" className="btn-primary">
          Publier
        </button>
      </form>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Soyez le premier à commenter cet article.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="card p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">{comment.name}</span>
                <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Affichage complet d'un article de blog : en-tête, image de couverture,
 * 3 encarts AdSense, table des matières, contenu, partage social, articles
 * similaires et commentaires. Le comptage des vues est déjà géré côté backend
 * (blogController.getPostBySlug incrémente viewsCount à chaque lecture) : ce
 * composant ne fait donc pas d'appel réseau supplémentaire pour ça.
 */
export default function BlogArticle({ post }) {
  const { beforeAd, afterAd, toc, readTimeMinutes } = useMemo(
    () => parseArticleContent(post.content),
    [post.content]
  );

  useEffect(() => {
    const previousTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescription?.getAttribute('content');

    document.title = post.seoTitle || `${post.title} — FixNow Blog`;
    if (metaDescription) {
      metaDescription.setAttribute('content', post.seoDescription || post.excerpt || '');
    }

    return () => {
      document.title = previousTitle;
      if (metaDescription && previousDescription !== undefined) {
        metaDescription.setAttribute('content', previousDescription);
      }
    };
  }, [post.seoTitle, post.seoDescription, post.excerpt, post.title]);

  return (
    <article>
      <header>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
            {post.category}
          </span>
          <span>· {post.authorName}</span>
        </div>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight text-gray-900 dark:text-white sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          <span>📅 {formatDate(post.publishedAt || post.createdAt)}</span>
          <span>📖 {readTimeMinutes} min de lecture</span>
          <span>👁️ {post.viewsCount ?? 0} vues</span>
        </div>
      </header>

      {post.coverImageUrl && (
        <img
          src={post.coverImageUrl}
          alt={post.title}
          className="mt-6 aspect-video w-full rounded-xl object-cover"
        />
      )}

      <AdSlot slotId="blog-article-top" className="my-8 h-24" />

      <TableOfContents items={toc} />

      <div className="prose-fixnow" dangerouslySetInnerHTML={{ __html: beforeAd }} />

      {afterAd && (
        <>
          <AdSlot slotId="blog-article-middle" className="my-8 h-24" />
          <div className="prose-fixnow" dangerouslySetInnerHTML={{ __html: afterAd }} />
        </>
      )}

      <AdSlot slotId="blog-article-bottom" className="my-8 h-24" />

      {post.tags?.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <ShareButtons url={typeof window !== 'undefined' ? window.location.href : ''} title={post.title} />

      <RelatedPosts category={post.category} excludeSlug={post.slug} />

      <CommentsSection slug={post.slug} />
    </article>
  );
}
