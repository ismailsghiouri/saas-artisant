/**
 * controllers/blogController.js
 * -----------------------------------------------------------------------------
 * Gestion des articles de blog. Les endpoints de lecture (getAllPosts,
 * getPostBySlug) sont publics et ne renvoient que les articles publiés ; les
 * endpoints d'écriture sont protégés par middleware/auth.js#protectAdmin.
 * -----------------------------------------------------------------------------
 */

const BlogPost = require('../models/BlogPost');
const { AppError, asyncHandler } = require('../utils/errorHandler');

/**
 * GET /api/blog
 * Liste paginée des articles publiés, avec filtres optionnels par catégorie
 * et par ville (SEO local — voir cahier des charges section 4.3).
 */
const getAllPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 12);
  const skip = (page - 1) * limit;

  const filter = { status: 'published' };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.city) filter.city = new RegExp(`^${req.query.city}$`, 'i');
  if (req.query.q) filter.$text = { $search: req.query.q };

  const [posts, total] = await Promise.all([
    BlogPost.find(filter)
      .select('-content') // le contenu complet n'est renvoyé que sur la page détail
      .sort('-publishedAt')
      .skip(skip)
      .limit(limit),
    BlogPost.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    results: posts.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    data: posts,
  });
});

/**
 * GET /api/blog/categories
 * Liste des catégories distinctes utilisées par des articles publiés, pour
 * alimenter la navigation du blog.
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await BlogPost.distinct('category', { status: 'published' });
  res.status(200).json({ success: true, data: categories });
});

/**
 * GET /api/blog/:slug
 * Détail public d'un article. Incrémente le compteur de vues de façon
 * atomique (pas de lecture-modification-écriture, pour éviter les pertes de
 * comptage sous forte concurrence).
 */
const getPostBySlug = asyncHandler(async (req, res, next) => {
  const post = await BlogPost.findOneAndUpdate(
    { slug: req.params.slug, status: 'published' },
    { $inc: { viewsCount: 1 } },
    { new: true }
  );

  if (!post) {
    return next(new AppError('Article introuvable.', 404));
  }

  res.status(200).json({ success: true, data: post });
});

/**
 * POST /api/blog
 * Création d'un article (accès réservé à l'équipe FixNow — protectAdmin).
 */
const createPost = asyncHandler(async (req, res, next) => {
  const existing = await BlogPost.findOne({ slug: req.body.slug });
  if (existing) {
    return next(new AppError('Un article utilise déjà ce slug.', 409));
  }

  const post = await BlogPost.create(req.body);
  res.status(201).json({ success: true, data: post });
});

/**
 * PUT /api/blog/:id
 */
const updatePost = asyncHandler(async (req, res, next) => {
  const post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!post) {
    return next(new AppError('Article introuvable.', 404));
  }

  res.status(200).json({ success: true, data: post });
});

/**
 * DELETE /api/blog/:id
 */
const deletePost = asyncHandler(async (req, res, next) => {
  const post = await BlogPost.findByIdAndDelete(req.params.id);

  if (!post) {
    return next(new AppError('Article introuvable.', 404));
  }

  res.status(204).json({ success: true, data: null });
});

module.exports = { getAllPosts, getCategories, getPostBySlug, createPost, updatePost, deletePost };
