import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BlogArticle from '../components/BlogArticle';
import { fetchBlogPostBySlug } from '../utils/api';

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
    <div className="page-container max-w-3xl py-10">
      <Link to="/blog" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
        ← Retour au blog
      </Link>

      <div className="mt-4">
        <BlogArticle post={post} />
      </div>
    </div>
  );
}
