import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdSlot from '../components/AdSlot';
import BlogArticleCard from '../components/BlogArticleCard';
import { fetchBlogCategories, fetchBlogPosts } from '../utils/api';

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const q = searchParams.get('q') || '';

  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBlogCategories()
      .then((res) => setCategories(res.data || res.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchBlogPosts({ category: category || undefined, q: q || undefined })
      .then((res) => setPosts(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [category, q]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="page-container py-10">
      <h1 className="section-title">Le blog Maalam Expert</h1>
      <p className="section-subtitle mb-6">
        Conseils pratiques, prix indicatifs et actualités pour bien choisir votre artisan.
      </p>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Rechercher un article..."
          value={q}
          onChange={(e) => updateParam('q', e.target.value)}
          className="input-field sm:w-72"
        />
        <select
          value={category}
          onChange={(e) => updateParam('category', e.target.value)}
          className="select-field sm:w-52"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <AdSlot slotId="blog-listing-top" className="mb-8 h-24" />

      {isLoading && <p className="text-gray-500 dark:text-gray-400">Chargement des articles...</p>}
      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
      {!isLoading && !error && posts.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">Aucun article pour le moment.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogArticleCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
}
