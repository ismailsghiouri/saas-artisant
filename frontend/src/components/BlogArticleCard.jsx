import { Link } from 'react-router-dom';
import { formatDate, truncate } from '../utils/helpers';

export default function BlogArticleCard({ post }) {
  return (
    <article className="card-hover overflow-hidden">
      <Link to={`/blog/${post.slug}`}>
        <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          {post.coverImageUrl ? (
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300 dark:text-gray-700">
              FixNow
            </div>
          )}
        </div>
      </Link>
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
          <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
            {post.category}
          </span>
          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          <Link to={`/blog/${post.slug}`} className="hover:text-primary-600 dark:hover:text-primary-400">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {truncate(post.excerpt || post.content, 140)}
        </p>
        <Link
          to={`/blog/${post.slug}`}
          className="mt-3 inline-block text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
        >
          Lire l'article →
        </Link>
      </div>
    </article>
  );
}
