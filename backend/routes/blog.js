/**
 * routes/blog.js
 * -----------------------------------------------------------------------------
 * Routes publiques de lecture du blog (pages statiques/SSG côté frontend) et
 * routes d'administration du contenu, protégées par middleware/auth.js#protectAdmin.
 *
 * "/categories" est déclarée avant "/:slug" pour éviter qu'Express ne
 * l'interprète comme un slug d'article.
 * -----------------------------------------------------------------------------
 */

const express = require('express');
const blogController = require('../controllers/blogController');
const { protectAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// --- Lecture publique ---
router.get('/', blogController.getAllPosts);
router.get('/categories', blogController.getCategories);
router.get('/:slug', blogController.getPostBySlug);

// --- Administration (équipe FixNow) ---
router.post('/', protectAdmin, validate(schemas.createBlogPost), blogController.createPost);
router.put('/:id', protectAdmin, validate(schemas.updateBlogPost), blogController.updatePost);
router.delete('/:id', protectAdmin, blogController.deletePost);

module.exports = router;
