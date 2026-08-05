/**
 * utils/email.js
 * -----------------------------------------------------------------------------
 * Envoi d'emails transactionnels via une API HTTP externe (ex. Resend),
 * appelée avec axios plutôt qu'un SDK dédié — conforme au choix technique du
 * projet (voir dépendances demandées).
 *
 * Important : un échec d'envoi d'email ne doit JAMAIS faire échouer le flux
 * métier principal (ex. création de réservation). On logue l'erreur et on
 * continue, plutôt que de propager l'exception.
 * -----------------------------------------------------------------------------
 */

const axios = require('axios');

const emailClient = axios.create({
  baseURL: process.env.EMAIL_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Envoie un email générique.
 *
 * @param {Object} params
 * @param {string} params.to        Adresse email destinataire.
 * @param {string} params.subject   Objet de l'email.
 * @param {string} params.html      Corps HTML de l'email.
 * @returns {Promise<boolean>}  true si l'envoi a réussi, false sinon.
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_API_KEY) {
    console.warn('⚠️  EMAIL_API_KEY non configurée : envoi d\'email ignoré (mode dev ?).');
    return false;
  }

  try {
    await emailClient.post('/emails', {
      from: process.env.EMAIL_FROM_ADDRESS || 'Maalam Expert <no-reply@maalam-expert.ma>',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error(
      "❌ Échec de l'envoi de l'email à",
      to,
      ':',
      error.response?.data || error.message
    );
    return false;
  }
};

/**
 * Email de bienvenue envoyé juste après inscription (client ou artisan).
 * @param {{ email: string, name: string }} user
 */
const sendWelcomeEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: 'Bienvenue sur Maalam Expert !',
    html: `
      <p>Bonjour ${user.name},</p>
      <p>Votre compte Maalam Expert a été créé avec succès. Vous pouvez dès à présent
      vous connecter et profiter de la plateforme.</p>
      <p>L'équipe Maalam Expert</p>
    `,
  });

/**
 * Email envoyé au client pour confirmer la prise en compte de sa demande.
 * @param {{ email: string, name: string }} client
 * @param {{ _id: string, serviceCategory: string }} reservation
 */
const sendReservationConfirmationEmail = (client, reservation) =>
  sendEmail({
    to: client.email,
    subject: 'Votre demande Maalam Expert a été enregistrée',
    html: `
      <p>Bonjour ${client.name},</p>
      <p>Votre demande d'intervention <strong>${reservation.serviceCategory}</strong>
      (référence #${reservation._id}) a bien été enregistrée. Nous recherchons
      actuellement un artisan disponible près de chez vous.</p>
      <p>L'équipe Maalam Expert</p>
    `,
  });

/**
 * Email envoyé au client lorsqu'un artisan a accepté sa demande.
 * @param {{ email: string, name: string }} client
 * @param {{ name: string, phone: string }} worker
 */
const sendWorkerAssignedEmail = (client, worker) =>
  sendEmail({
    to: client.email,
    subject: 'Un artisan a accepté votre demande !',
    html: `
      <p>Bonjour ${client.name},</p>
      <p><strong>${worker.name}</strong> a accepté votre demande et se
      dirige vers vous. Vous pouvez le contacter directement au ${worker.phone}
      ou via la messagerie de l'application.</p>
      <p>L'équipe Maalam Expert</p>
    `,
  });

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendReservationConfirmationEmail,
  sendWorkerAssignedEmail,
};
