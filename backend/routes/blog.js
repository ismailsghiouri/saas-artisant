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
// "/search" et "/categories" sont déclarées avant "/:slug" pour éviter
// qu'Express ne les interprète comme un slug d'article. getAllPosts gère déjà
// la recherche plein texte via ?q=... (voir blogController.js) ; "/search"
// n'est qu'un alias explicite du même contrôleur.
router.get('/', blogController.getAllPosts);
router.get('/search', blogController.getAllPosts);
router.get('/categories', blogController.getCategories);
router.get('/:slug', blogController.getPostBySlug);

// --- Administration (équipe FixNow) ---
router.post('/', protectAdmin, validate(schemas.createBlogPost), blogController.createPost);
router.put('/:id', protectAdmin, validate(schemas.updateBlogPost), blogController.updatePost);
router.delete('/:id', protectAdmin, blogController.deletePost);

module.exports = router;
