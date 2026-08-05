/**
 * models/Client.js
 * -----------------------------------------------------------------------------
 * Discriminator Mongoose de User (role="client") : profil client qui soumet
 * des demandes d'intervention sur Maalam Expert.
 *
 * "reservations" et "reviewsPosted" sont exposés en virtuals populate (plutôt
 * que des tableaux d'ObjectId stockés) pour éviter toute désynchronisation
 * entre ce document et les collections Reservation/Review qui référencent déjà
 * le client — ces dernières restent la source de vérité.
 * -----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');
const User = require('./User');

const clientSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      trim: true,
      default: null,
    },
    savedWorkers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
      },
    ],
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

clientSchema.virtual('reservations', {
  ref: 'Reservation',
  localField: '_id',
  foreignField: 'client',
});

clientSchema.virtual('reviewsPosted', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'client',
});

const Client = User.discriminator('Client', clientSchema, 'client');

module.exports = Client;
