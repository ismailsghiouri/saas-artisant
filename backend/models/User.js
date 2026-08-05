/**
 * models/User.js
 * -----------------------------------------------------------------------------
 * Schéma parent commun aux deux populations d'utilisateurs de Maalam Expert (artisans
 * et clients), stockées dans une seule collection MongoDB ("users") grâce aux
 * discriminators Mongoose. Le champ "role" est la clé de différenciation :
 *   - role === 'worker' -> voir models/Worker.js
 *   - role === 'client' -> voir models/Client.js
 *
 * Tout ce qui est commun aux deux rôles (identité, authentification) vit ici ;
 * les champs propres à un rôle vivent dans son discriminator.
 * -----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['worker', 'client'];

// Numéro de téléphone marocain : 05/06/07XXXXXXXX ou +212 équivalent.
const MOROCCAN_PHONE = /^(\+212|0)[5-7][0-9]{8}$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom complet est requis.'],
      trim: true,
      minlength: [2, 'Le nom doit contenir au moins 2 caractères.'],
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères.'],
    },
    email: {
      type: String,
      required: [true, "L'email est requis."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Adresse email invalide.'],
    },
    password: {
      type: String,
      // Les comptes créés via Google (voir authProvider) n'ont pas de mot de
      // passe local : l'authentification passe entièrement par Supabase/Google.
      required: [
        function isPasswordRequired() {
          return this.authProvider !== 'google';
        },
        'Le mot de passe est requis.',
      ],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères.'],
      select: false,
    },
    phone: {
      type: String,
      // Google ne fournit pas de numéro de téléphone : les comptes créés par
      // ce biais le renseignent plus tard depuis leur profil.
      required: [
        function isPhoneRequired() {
          return this.authProvider !== 'google';
        },
        'Le numéro de téléphone est requis.',
      ],
      match: [MOROCCAN_PHONE, 'Numéro de téléphone marocain invalide.'],
    },
    role: {
      type: String,
      enum: { values: ROLES, message: 'Rôle invalide : {VALUE}.' },
      required: true,
    },
    // Origine du compte : "local" (email/mot de passe) ou "google" (OAuth via
    // Supabase). Détermine si password/phone sont obligatoires (voir ci-dessus).
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      trim: true,
      default: null,
    },
    // Vérification de l'adresse email (lien/OTP envoyé à l'inscription).
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Permet de désactiver un compte (suspension) sans le supprimer.
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // Sert à invalider les anciens tokens JWT émis avant un changement de mot
    // de passe.
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    discriminatorKey: 'role',
    collection: 'users',
  }
);

// --- Hooks ---

userSchema.pre('save', async function hashPassword(next) {
  if (!this.password || !this.isModified('password')) return next();

  try {
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    this.password = await bcrypt.hash(this.password, saltRounds);

    if (!this.isNew) {
      this.passwordChangedAt = new Date(Date.now() - 1000);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// --- Méthodes d'instance ---

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Retourne une version "sûre" du document, sans le mot de passe ni les
 * champs internes Mongoose — à utiliser dans toutes les réponses API.
 */
userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.__v;
  return obj;
};

// --- Méthodes statiques ---

userSchema.statics.findByRole = function findByRole(role) {
  return this.find({ role });
};

const User = mongoose.model('User', userSchema);

User.ROLES = ROLES;
User.MOROCCAN_PHONE = MOROCCAN_PHONE;

module.exports = User;
