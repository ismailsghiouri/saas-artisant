/**
 * __tests__/reservations.test.js
 * -----------------------------------------------------------------------------
 * POST /api/reservations (création) et cycle de vie complet
 * (pending -> assigned -> in_progress -> completed).
 * -----------------------------------------------------------------------------
 */
const request = require("supertest");
const app = require("../server");
const { createClient, createWorker, validReservationPayload } = require("./setup/fixtures");
const Reservation = require("../models/Reservation");

describe("POST /api/reservations - créer une réservation", () => {
  test("refuse une requête non authentifiée (401)", async () => {
    const res = await request(app).post("/api/reservations").send(validReservationPayload());
    expect(res.status).toBe(401);
  });

  test("refuse un token artisan : seul un client peut réserver (403)", async () => {
    const { token } = await createWorker();

    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send(validReservationPayload());

    expect(res.status).toBe(403);
  });

  test("crée une réservation pour un client authentifié (201)", async () => {
    const { client, token } = await createClient();

    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send(validReservationPayload());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.client).toBe(String(client._id));
    expect(res.body.data.serviceCategory).toBe("plombier");

    const inDb = await Reservation.findById(res.body.data._id);
    expect(inDb).not.toBeNull();
    expect(inDb.statusHistory).toHaveLength(1);
    expect(inDb.statusHistory[0].status).toBe("pending");
  });

  test("rejette un payload invalide : description trop courte (400)", async () => {
    const { token } = await createClient();

    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send(validReservationPayload({ description: "Hi" }));

    expect(res.status).toBe(400);
  });
});

describe("GET /api/clients/reservations", () => {
  test("ne retourne que les réservations du client authentifié", async () => {
    const { token: tokenA } = await createClient();
    const { token: tokenB } = await createClient();

    await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${tokenA}`)
      .send(validReservationPayload());

    const resA = await request(app).get("/api/clients/reservations").set("Authorization", `Bearer ${tokenA}`);
    const resB = await request(app).get("/api/clients/reservations").set("Authorization", `Bearer ${tokenB}`);

    expect(resA.body.results).toBe(1);
    expect(resB.body.results).toBe(0);
  });
});

describe("Cycle de vie complet d'une réservation", () => {
  test("pending -> assigned -> in_progress -> completed", async () => {
    const { token: clientToken } = await createClient();
    const { worker, token: workerToken } = await createWorker();

    const createRes = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${clientToken}`)
      .send(validReservationPayload());
    const reservationId = createRes.body.data._id;

    const acceptRes = await request(app)
      .patch(`/api/reservations/${reservationId}/accept`)
      .set("Authorization", `Bearer ${workerToken}`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe("assigned");
    // acceptReservation ne populate que "client" (pas "worker") : le champ
    // worker reste un simple id sérialisé, pas un sous-document peuplé.
    expect(acceptRes.body.data.worker).toBe(String(worker._id));

    const startRes = await request(app)
      .patch(`/api/reservations/${reservationId}/start`)
      .set("Authorization", `Bearer ${workerToken}`);
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.status).toBe("in_progress");

    const completeRes = await request(app)
      .patch(`/api/reservations/${reservationId}/complete`)
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ finalPrice: 250, paymentMethod: "cash" });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe("completed");
    expect(completeRes.body.data.paymentStatus).toBe("paid");
  });

  test("un second artisan ne peut pas accepter une demande déjà prise (409)", async () => {
    const { token: clientToken } = await createClient();
    const { token: workerToken1 } = await createWorker();
    const { token: workerToken2 } = await createWorker();

    const createRes = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${clientToken}`)
      .send(validReservationPayload());
    const reservationId = createRes.body.data._id;

    await request(app)
      .patch(`/api/reservations/${reservationId}/accept`)
      .set("Authorization", `Bearer ${workerToken1}`);

    const secondAccept = await request(app)
      .patch(`/api/reservations/${reservationId}/accept`)
      .set("Authorization", `Bearer ${workerToken2}`);

    expect(secondAccept.status).toBe(409);
  });

  test("le client peut annuler une réservation encore en attente (200)", async () => {
    const { token: clientToken } = await createClient();

    const createRes = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${clientToken}`)
      .send(validReservationPayload());

    const cancelRes = await request(app)
      .patch(`/api/reservations/${createRes.body.data._id}/cancel`)
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ cancellationReason: "Changement de plan" });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe("cancelled");
  });
});

describe("GET /api/workers/reservations", () => {
  test("retourne les réservations assignées à l'artisan authentifié", async () => {
    const { token: clientToken } = await createClient();
    const { token: workerToken } = await createWorker();

    const createRes = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${clientToken}`)
      .send(validReservationPayload());

    await request(app)
      .patch(`/api/reservations/${createRes.body.data._id}/accept`)
      .set("Authorization", `Bearer ${workerToken}`);

    const res = await request(app)
      .get("/api/workers/reservations")
      .set("Authorization", `Bearer ${workerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.results).toBe(1);
  });
});

describe("GET /api/reservations/available", () => {
  test("refuse si l'artisan n'est pas vérifié (403)", async () => {
    const { token } = await createWorker({ verificationStatus: "pending" });

    const res = await request(app)
      .get("/api/reservations/available")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("retourne les demandes en attente correspondant au métier et à proximité (200)", async () => {
    const { token: clientToken } = await createClient();
    const { token: workerToken } = await createWorker({ category: "plombier" });

    await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${clientToken}`)
      .send(validReservationPayload({ serviceCategory: "plombier" }));

    const res = await request(app)
      .get("/api/reservations/available")
      .set("Authorization", `Bearer ${workerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.results).toBe(1);
  });
});

describe("GET /api/reservations/:id", () => {
  test("retourne 404 pour une réservation inexistante", async () => {
    const { token } = await createClient();

    const res = await request(app)
      .get("/api/reservations/64b6f0f0f0f0f0f0f0f0f0f0")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test("autorise le client propriétaire (200)", async () => {
    const { token } = await createClient();

    const createRes = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send(validReservationPayload());

    const res = await request(app)
      .get(`/api/reservations/${createRes.body.data._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test("refuse un client qui n'est pas propriétaire de la réservation (403)", async () => {
    const { token: ownerToken } = await createClient();
    const { token: otherToken } = await createClient();

    const createRes = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send(validReservationPayload());

    const res = await request(app)
      .get(`/api/reservations/${createRes.body.data._id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  test("autorise l'artisan assigné (200)", async () => {
    const { token: clientToken } = await createClient();
    const { token: workerToken } = await createWorker();

    const createRes = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${clientToken}`)
      .send(validReservationPayload());

    await request(app)
      .patch(`/api/reservations/${createRes.body.data._id}/accept`)
      .set("Authorization", `Bearer ${workerToken}`);

    const res = await request(app)
      .get(`/api/reservations/${createRes.body.data._id}`)
      .set("Authorization", `Bearer ${workerToken}`);

    expect(res.status).toBe(200);
  });
});

describe("Transitions invalides et autorisations", () => {
  test("un artisan non vérifié ne peut pas accepter une demande (403)", async () => {
    const { token: clientToken } = await createClient();
    const { token: workerToken } = await createWorker({ verificationStatus: "pending" });

    const createRes = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${clientToken}`)
      .send(validReservationPayload());

    const res = await request(app)
      .patch(`/api/reservations/${createRes.body.data._id}/accept`)
      .set("Authorization", `Bearer ${workerToken}`);

    expect(res.status).toBe(403);
  });

  test("impossible de démarrer une réservation encore pending (409)", async () => {
    const { token: clientToken } = await createClient();
    const { token: workerToken } = await createWorker();

    const createRes = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${clientToken}`)
      .send(validReservationPayload());

    const res = await request(app)
      .patch(`/api/reservations/${createRes.body.data._id}/start`)
      .set("Authorization", `Bearer ${workerToken}`);

    expect(res.status).toBe(409);
  });

  test("impossible de clôturer une réservation qui n'est pas in_progress (409)", async () => {
    const { token: clientToken } = await createClient();
    const { token: workerToken } = await createWorker();

    const createRes = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${clientToken}`)
      .send(validReservationPayload());

    await request(app)
      .patch(`/api/reservations/${createRes.body.data._id}/accept`)
      .set("Authorization", `Bearer ${workerToken}`);

    const res = await request(app)
      .patch(`/api/reservations/${createRes.body.data._id}/complete`)
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ finalPrice: 100, paymentMethod: "cash" });

    expect(res.status).toBe(409);
  });

  test("un client ne peut pas annuler la réservation d'un autre client (403)", async () => {
    const { token: ownerToken } = await createClient();
    const { token: otherToken } = await createClient();

    const createRes = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send(validReservationPayload());

    const res = await request(app)
      .patch(`/api/reservations/${createRes.body.data._id}/cancel`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({});

    expect(res.status).toBe(403);
  });

  test("le client ne peut plus annuler une réservation déjà in_progress (409)", async () => {
    const { token: clientToken } = await createClient();
    const { token: workerToken } = await createWorker();

    const createRes = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${clientToken}`)
      .send(validReservationPayload());

    await request(app)
      .patch(`/api/reservations/${createRes.body.data._id}/accept`)
      .set("Authorization", `Bearer ${workerToken}`);
    await request(app)
      .patch(`/api/reservations/${createRes.body.data._id}/start`)
      .set("Authorization", `Bearer ${workerToken}`);

    const res = await request(app)
      .patch(`/api/reservations/${createRes.body.data._id}/cancel`)
      .set("Authorization", `Bearer ${clientToken}`)
      .send({});

    expect(res.status).toBe(409);
  });

  test("l'artisan assigné peut annuler : la réservation repasse en attente sans artisan (200)", async () => {
    const { token: clientToken } = await createClient();
    const { token: workerToken } = await createWorker();

    const createRes = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${clientToken}`)
      .send(validReservationPayload());

    await request(app)
      .patch(`/api/reservations/${createRes.body.data._id}/accept`)
      .set("Authorization", `Bearer ${workerToken}`);

    const res = await request(app)
      .patch(`/api/reservations/${createRes.body.data._id}/cancel`)
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ cancellationReason: "Imprévu" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.worker).toBeNull();
  });

  test("un artisan non assigné ne peut pas annuler une réservation (403)", async () => {
    const { token: clientToken } = await createClient();
    const { token: unrelatedWorkerToken } = await createWorker();

    const createRes = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${clientToken}`)
      .send(validReservationPayload());

    const res = await request(app)
      .patch(`/api/reservations/${createRes.body.data._id}/cancel`)
      .set("Authorization", `Bearer ${unrelatedWorkerToken}`)
      .send({});

    expect(res.status).toBe(403);
  });
});
