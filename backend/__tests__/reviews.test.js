/**
 * __tests__/reviews.test.js
 * -----------------------------------------------------------------------------
 * POST /api/reviews (publication d'un avis) et GET /api/reviews/worker/:id.
 * -----------------------------------------------------------------------------
 */
const request = require("supertest");
const app = require("../server");
const { createClient, createWorker, validReservationPayload } = require("./setup/fixtures");
const Reservation = require("../models/Reservation");
const Worker = require("../models/Worker");

/** Crée directement en base une réservation déjà "completed", prête à être notée. */
const createCompletedReservation = (clientId, workerId) =>
  Reservation.create({
    ...validReservationPayload(),
    client: clientId,
    worker: workerId,
    status: "completed",
    finalPrice: 200,
    paymentMethod: "cash",
    paymentStatus: "paid",
  });

describe("POST /api/reviews - poster un avis", () => {
  test("refuse une requête non authentifiée (401)", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({ reservationId: "64b6f0f0f0f0f0f0f0f0f0f0", rating: 5 });
    expect(res.status).toBe(401);
  });

  test("refuse un token artisan : seul un client peut noter (403)", async () => {
    const { token } = await createWorker();

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservationId: "64b6f0f0f0f0f0f0f0f0f0f0", rating: 5 });

    expect(res.status).toBe(403);
  });

  test("refuse de noter une réservation qui n'est pas terminée (409)", async () => {
    const { client, token } = await createClient();
    const { worker } = await createWorker();
    const reservation = await Reservation.create({
      ...validReservationPayload(),
      client: client._id,
      worker: worker._id,
      status: "in_progress",
    });

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservationId: reservation._id, rating: 4 });

    expect(res.status).toBe(409);
  });

  test("refuse de noter la réservation d'un autre client (403)", async () => {
    const { client: owner } = await createClient();
    const { token: otherClientToken } = await createClient();
    const { worker } = await createWorker();
    const reservation = await createCompletedReservation(owner._id, worker._id);

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${otherClientToken}`)
      .send({ reservationId: reservation._id, rating: 4 });

    expect(res.status).toBe(403);
  });

  test("crée un avis et met à jour la note moyenne de l'artisan (201)", async () => {
    const { client, token } = await createClient();
    const { worker } = await createWorker();
    const reservation = await createCompletedReservation(client._id, worker._id);

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservationId: reservation._id, rating: 5, comment: "Excellent travail !" });

    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(5);

    const updatedWorker = await Worker.findById(worker._id);
    expect(updatedWorker.rating).toBe(5);
    expect(updatedWorker.totalReviews).toBe(1);
  });

  test("refuse un second avis sur la même réservation (409)", async () => {
    const { client, token } = await createClient();
    const { worker } = await createWorker();
    const reservation = await createCompletedReservation(client._id, worker._id);

    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservationId: reservation._id, rating: 5 });

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservationId: reservation._id, rating: 3 });

    expect(res.status).toBe(409);
  });

  test("retourne 404 si la réservation référencée n'existe pas", async () => {
    const { token } = await createClient();

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservationId: "64b6f0f0f0f0f0f0f0f0f0f0", rating: 4 });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/reviews - listing avec filtre worker_id", () => {
  test("retourne les avis via ?worker_id=... (alias de /worker/:workerId)", async () => {
    const { client, token } = await createClient();
    const { worker } = await createWorker();
    const reservation = await createCompletedReservation(client._id, worker._id);

    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservationId: reservation._id, rating: 4 });

    const res = await request(app).get("/api/reviews").query({ worker_id: String(worker._id) });

    expect(res.status).toBe(200);
    expect(res.body.results).toBe(1);
  });

  test("rejette la requête si aucun worker_id n'est fourni (400)", async () => {
    const res = await request(app).get("/api/reviews");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/reviews/worker/:workerId", () => {
  test("liste les avis publiés pour un artisan", async () => {
    const { client, token } = await createClient();
    const { worker } = await createWorker();
    const reservation = await createCompletedReservation(client._id, worker._id);

    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservationId: reservation._id, rating: 4, comment: "Bon travail" });

    const res = await request(app).get(`/api/reviews/worker/${worker._id}`);

    expect(res.status).toBe(200);
    expect(res.body.results).toBe(1);
    expect(res.body.data[0].comment).toBe("Bon travail");
  });
});

describe("PUT /api/reviews/:id - modifier un avis", () => {
  test("retourne 404 pour un avis inexistant", async () => {
    const { token } = await createClient();

    const res = await request(app)
      .put("/api/reviews/64b6f0f0f0f0f0f0f0f0f0f0")
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 3 });

    expect(res.status).toBe(404);
  });

  test("refuse de modifier l'avis d'un autre client (403)", async () => {
    const { client, token } = await createClient();
    const { token: otherToken } = await createClient();
    const { worker } = await createWorker();
    const reservation = await createCompletedReservation(client._id, worker._id);

    const createRes = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservationId: reservation._id, rating: 4 });

    const res = await request(app)
      .put(`/api/reviews/${createRes.body.data._id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ rating: 1 });

    expect(res.status).toBe(403);
  });

  test("met à jour la note et le commentaire de son propre avis (200)", async () => {
    const { client, token } = await createClient();
    const { worker } = await createWorker();
    const reservation = await createCompletedReservation(client._id, worker._id);

    const createRes = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservationId: reservation._id, rating: 4, comment: "Bien" });

    const res = await request(app)
      .put(`/api/reviews/${createRes.body.data._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ rating: 2, comment: "Finalement moins bien" });

    expect(res.status).toBe(200);
    expect(res.body.data.rating).toBe(2);
    expect(res.body.data.comment).toBe("Finalement moins bien");

    const updatedWorker = await Worker.findById(worker._id);
    expect(updatedWorker.rating).toBe(2);
  });
});

describe("DELETE /api/reviews/:id - supprimer un avis", () => {
  test("retourne 404 pour un avis inexistant", async () => {
    const { token } = await createClient();

    const res = await request(app)
      .delete("/api/reviews/64b6f0f0f0f0f0f0f0f0f0f0")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test("refuse de supprimer l'avis d'un autre client (403)", async () => {
    const { client, token } = await createClient();
    const { token: otherToken } = await createClient();
    const { worker } = await createWorker();
    const reservation = await createCompletedReservation(client._id, worker._id);

    const createRes = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservationId: reservation._id, rating: 4 });

    const res = await request(app)
      .delete(`/api/reviews/${createRes.body.data._id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  test("supprime son propre avis et remet la note de l'artisan à zéro (204)", async () => {
    const { client, token } = await createClient();
    const { worker } = await createWorker();
    const reservation = await createCompletedReservation(client._id, worker._id);

    const createRes = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservationId: reservation._id, rating: 5 });

    const res = await request(app)
      .delete(`/api/reviews/${createRes.body.data._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);

    const updatedWorker = await Worker.findById(worker._id);
    expect(updatedWorker.rating).toBe(0);
    expect(updatedWorker.totalReviews).toBe(0);
  });
});
