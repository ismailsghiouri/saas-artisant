/**
 * models/Client.js
 * -----------------------------------------------------------------------------
 * Schéma Mongoose représentant un client (particulier ou professionnel) qui
 * soumet des demandes d'intervention sur FixNow.
 *
 * Volontairement plus simple que le modèle Artisan : pas de KYC, pas de
 * géolocalisation permanente (l'adresse est fournie à chaque réservation).
 * -----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const clientSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Le nom complet est requis.'],
      trim: true,
      minlength: [2, 'Le nom complet doit contenir au moins 2 caractères.'],
      maxlength: [100, 'Le nom complet ne peut pas dépasser 100 caractères.'],
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
      required: [true, 'Le mot de passe est requis.'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères.'],
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Le numéro de téléphone est requis.'],
      match: [/^(\+212|0)[5-7][0-9]{8}$/, 'Numéro de téléphone marocain invalide.'],
    },
    city: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    profilePhotoUrl: {
      type: String,
      default: null,
    },
    // Type de compte : un particulier standard ou un compte professionnel
    // (syndic, agence) évoqué en Phase 2 du cahier des charges. Champ prévu
    // dès le MVP pour éviter une migration de schéma ultérieure.
    accountType: {
      type: String,
      enum: ['particulier', 'professionnel'],
      default: 'particulier',
    },
    companyName: {
      type: String,
      trim: true,
      default: null,
    },
    favoriteArtisans: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artisan',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      default: 'client',
      immutable: true,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Hache le mot de passe avant sauvegarde si celui-ci a été modifié.
 */
clientSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);

    if (!this.isNew) {
      this.passwordChangedAt = new Date(Date.now() - 1000);
    }

    next();
  } catch (error) {
    next(error);
  }
});

clientSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

clientSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Client', clientSchema);
