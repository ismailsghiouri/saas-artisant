/**
 * models/BlogPost.js
 * -----------------------------------------------------------------------------
 * Article de blog utilisé pour l'acquisition SEO (voir document
 * d'architecture Maalam Expert, section blog). Les articles publiés sont exposés en
 * lecture publique ; la création/édition est réservée à l'équipe Maalam Expert.
 * -----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const STATUSES = ['draft', 'published'];

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre est requis.'],
      trim: true,
      maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères.'],
    },
    // Identifiant unique et lisible utilisé dans l'URL (ex. /blog/plombier-casablanca-prix).
    slug: {
      type: String,
      required: [true, 'Le slug est requis.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Le slug ne doit contenir que des lettres minuscules, chiffres et tirets.'],
    },
    excerpt: {
      type: String,
      maxlength: [300, "L'extrait ne peut pas dépasser 300 caractères."],
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Le contenu est requis.'],
    },
    coverImageUrl: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      required: [true, 'La catégorie est requise.'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    // Ville ciblée pour le SEO local (ex. "Casablanca"), optionnelle pour les
    // articles génériques non localisés.
    city: {
      type: String,
      trim: true,
      default: null,
    },
    authorName: {
      type: String,
      trim: true,
      default: 'Équipe Maalam Expert',
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: 'Statut de publication invalide : {VALUE}.',
      },
      default: 'draft',
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    seoTitle: {
      type: String,
      maxlength: [70, 'Le titre SEO ne devrait pas dépasser 70 caractères.'],
      default: null,
    },
    seoDescription: {
      type: String,
      maxlength: [160, 'La meta description ne devrait pas dépasser 160 caractères.'],
      default: null,
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1 });
// Index texte pour une recherche simple par mots-clés dans le titre/contenu.
blogPostSchema.index({ title: 'text', content: 'text' });

/**
 * Renseigne automatiquement publishedAt la première fois qu'un article passe
 * au statut "published", pour éviter d'avoir à le faire manuellement dans
 * chaque contrôleur.
 */
blogPostSchema.pre('save', function setPublishedAt(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

BlogPost.STATUSES = STATUSES;

module.exports = BlogPost;
