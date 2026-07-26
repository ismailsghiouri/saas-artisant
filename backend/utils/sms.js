/**
 * utils/sms.js
 * -----------------------------------------------------------------------------
 * Envoi de SMS (notamment aux artisans lors d'une nouvelle demande) via une
 * passerelle SMS tierce appelée en HTTP avec axios. Le fournisseur exact
 * (Twilio, aggrégateur local marocain, etc.) est configurable via les
 * variables d'environnement SMS_API_URL / SMS_API_KEY sans changer le code.
 *
 * Comme pour les emails, un échec d'envoi de SMS ne doit jamais bloquer le
 * flux métier principal — on logue et on continue.
 * -----------------------------------------------------------------------------
 */

const axios = require('axios');

const smsClient = axios.create({
  baseURL: process.env.SMS_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.SMS_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Envoie un SMS brut à un numéro donné.
 *
 * @param {string} phone    Numéro de téléphone au format marocain (+212...).
 * @param {string} message  Contenu du SMS (idéalement < 160 caractères).
 * @returns {Promise<boolean>}
 */
const sendSms = async (phone, message) => {
  if (!process.env.SMS_API_KEY) {
    console.warn('⚠️  SMS_API_KEY non configurée : envoi de SMS ignoré (mode dev ?).');
    return false;
  }

  try {
    await smsClient.post('/send', {
      sender: process.env.SMS_SENDER_ID || 'FixNow',
      to: phone,
      text: message,
    });
    return true;
  } catch (error) {
    console.error(
      "❌ Échec de l'envoi du SMS à",
      phone,
      ':',
      error.response?.data || error.message
    );
    return false;
  }
};

/**
 * Notifie un artisan qu'une nouvelle demande correspond à son profil.
 * Utilisé en complément du push notification (hors périmètre de ce backend)
 * pour garantir la réception même en cas de connexion data instable.
 *
 * @param {{ phone: string }} artisan
 * @param {{ serviceCategory: string, address: string }} reservation
 */
const notifyArtisanNewJob = (artisan, reservation) =>
  sendSms(
    artisan.phone,
    `FixNow : nouvelle demande "${reservation.serviceCategory}" pres de ${reservation.address}. Ouvrez l'app pour accepter.`
  );

/**
 * Notifie le client que sa demande a été annulée par l'artisan initialement
 * assigné (remise en recherche automatique).
 *
 * @param {{ phone: string }} client
 */
const notifyClientArtisanCancelled = (client) =>
  sendSms(
    client.phone,
    "FixNow : l'artisan assigné a annulé votre intervention. Nous recherchons un remplaçant."
  );

module.exports = { sendSms, notifyArtisanNewJob, notifyClientArtisanCancelled };
