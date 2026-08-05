/**
 * __tests__/validation.test.js
 * -----------------------------------------------------------------------------
 * Validation des entrées (middleware/validation.js, schémas Joi) sur les
 * principaux endpoints d'écriture et de recherche.
 * -----------------------------------------------------------------------------
 */
const request = require("supertest");
const app = require("../server");
const {
  validClientPayload,
  validWorkerPayload,
  validReservationPayload,
  createClient,
} = require("./setup/fixtures");

describe("Validation - inscription client", () => {
  test("rejette un email invalide (400)", async () => {
    const res = await request(app)
      .post("/api/auth/signup/client")
      .send(validClientPayload({ email: "pas-un-email" }));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("rejette un mot de passe trop court (400)", async () => {
    const res = await request(app)
      .post("/api/auth/signup/client")
      .send(validClientPayload({ password: "123" }));
    expect(res.status).toBe(400);
  });

  test("rejette un numéro de téléphone non marocain (400)", async () => {
    const res = await request(app)
      .post("/api/auth/signup/client")
      .send(validClientPayload({ phone: "0011223344" }));
    expect(res.status).toBe(400);
  });

  test("rejette un champ requis manquant (name) (400)", async () => {
    const payload = validClientPayload();
    delete payload.name;

    const res = await request(app).post("/api/auth/signup/client").send(payload);
    expect(res.status).toBe(400);
  });
});

describe("Validation - inscription artisan", () => {
  test("rejette un métier hors de la liste autorisée (400)", async () => {
    const res = await request(app)
      .post("/api/auth/signup/worker")
      .send(validWorkerPayload({ category: "astronaute" }));
    expect(res.status).toBe(400);
  });
});

describe("Validation - recherche d'artisans", () => {
  test("rejette une limite de pagination hors bornes (400)", async () => {
    const res = await request(app).get("/api/workers").query({ limit: 500 });
    expect(res.status).toBe(400);
  });

  test("rejette lat sans lng associé (400)", async () => {
    const res = await request(app).get("/api/workers").query({ lat: 33.5 });
    expect(res.status).toBe(400);
  });
});

describe("Validation - création de réservation", () => {
  test("rejette une catégorie de service invalide (400)", async () => {
    const { token } = await createClient();

    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send(validReservationPayload({ serviceCategory: "inexistant" }));

    expect(res.status).toBe(400);
  });

  test("rejette des coordonnées géographiques incomplètes (400)", async () => {
    const { token } = await createClient();

    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send(validReservationPayload({ location: { coordinates: [-7.5] } }));

    expect(res.status).toBe(400);
  });

  test("rejette scheduledAt manquant quand urgency=scheduled (400)", async () => {
    const { token } = await createClient();

    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send(validReservationPayload({ urgency: "scheduled" }));

    expect(res.status).toBe(400);
  });
});

describe("Validation - création d'avis", () => {
  test("rejette une note hors de l'intervalle 1-5 (400)", async () => {
    const { token } = await createClient();

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservationId: "64b6f0f0f0f0f0f0f0f0f0f0", rating: 8 });

    expect(res.status).toBe(400);
  });

  test("rejette un reservationId qui n'est pas un ObjectId valide (400)", async () => {
    const { token } = await createClient();

    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ reservationId: "pas-un-id", rating: 4 });

    expect(res.status).toBe(400);
  });
});
