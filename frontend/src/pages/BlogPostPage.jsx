import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AdSlot } from '../components/BlogArticle';
import { fetchBlogPostBySlug } from '../utils/api';
import { formatDate } from '../utils/helpers';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchBlogPostBySlug(slug)
      .then((res) => setPost(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) return <p className="page-container py-10 text-gray-500 dark:text-gray-400">Chargement...</p>;
  if (error)
    return (
      <div className="page-container py-10">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Link to="/blog" className="btn-outline mt-4 inline-flex">
          Retour au blog
        </Link>
      </div>
    );
  if (!post) return null;

  return (
    <article className="page-container max-w-3xl py-10">
      <Link to="/blog" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
        ← Retour au blog
      </Link>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          {post.category}
        </span>
        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
        <span>· {post.authorName}</span>
      </div>

      <h1 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">{post.title}</h1>

      {post.coverImageUrl && (
        <img
          src={post.coverImageUrl}
          alt={post.title}
          className="mt-6 aspect-video w-full rounded-xl object-cover"
        />
      )}

      <AdSlot slotId="blog-post-top" className="my-8 h-24" />

      <div className="prose-fixnow mt-6 whitespace-pre-line">{post.content}</div>

      <AdSlot slotId="blog-post-bottom" className="my-8 h-24" />

      {post.tags?.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="badge bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
