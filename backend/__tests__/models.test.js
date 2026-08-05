/**
 * __tests__/models.test.js
 * -----------------------------------------------------------------------------
 * Comportements des modèles exercés directement (hooks Mongoose) qui ne sont
 * pas naturellement déclenchés par les flux HTTP testés ailleurs : mise à
 * jour du mot de passe sur un document déjà existant, sauvegarde d'une
 * réservation sans changement de statut.
 * -----------------------------------------------------------------------------
 */
const { createClient, createWorker, validReservationPayload } = require("./setup/fixtures");
const Reservation = require("../models/Reservation");

describe("Hooks Mongoose - changement de mot de passe sur un document existant", () => {
  test("Worker : passwordChangedAt est renseigné lors d'un changement de mot de passe ultérieur", async () => {
    const { worker } = await createWorker();
    expect(worker.passwordChangedAt).toBeNull();

    worker.password = "NouveauMotDePasse123!";
    await worker.save();

    expect(worker.passwordChangedAt).not.toBeNull();
    expect(await worker.comparePassword("NouveauMotDePasse123!")).toBe(true);
  });

  test("Client : passwordChangedAt est renseigné lors d'un changement de mot de passe ultérieur", async () => {
    const { client } = await createClient();
    expect(client.passwordChangedAt).toBeNull();

    client.password = "NouveauMotDePasse123!";
    await client.save();

    expect(client.passwordChangedAt).not.toBeNull();
    expect(await client.comparePassword("NouveauMotDePasse123!")).toBe(true);
  });
});

describe("Hook Mongoose - historique de statut de réservation", () => {
  test("une sauvegarde sans changement de statut n'ajoute pas d'entrée à l'historique", async () => {
    const { client } = await createClient();
    const reservation = await Reservation.create({
      ...validReservationPayload(),
      client: client._id,
    });
    expect(reservation.statusHistory).toHaveLength(1);

    reservation.description = "Description mise à jour, statut inchangé.";
    await reservation.save();

    expect(reservation.statusHistory).toHaveLength(1);
  });
});
