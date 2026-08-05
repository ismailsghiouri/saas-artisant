/**
 * __tests__/workers.test.js
 * -----------------------------------------------------------------------------
 * GET /api/workers (recherche publique), GET /api/workers/:id,
 * GET /api/workers/top-rated.
 * -----------------------------------------------------------------------------
 */
const request = require("supertest");
const app = require("../server");
const { createClient, createWorker } = require("./setup/fixtures");

describe("GET /api/workers - liste des artisans", () => {
  test("retourne une liste vide quand aucun artisan n'est en base", async () => {
    const res = await request(app).get("/api/workers");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  test("ne retourne que les artisans vérifiés et actifs", async () => {
    await createWorker({ name: "Vérifié Actif" });
    await createWorker({ name: "Non vérifié", verificationStatus: "pending", isAvailable: false });

    const res = await request(app).get("/api/workers");

    expect(res.status).toBe(200);
    expect(res.body.results).toBe(1);
    expect(res.body.data[0].name).toBe("Vérifié Actif");
  });

  test("filtre par catégorie", async () => {
    await createWorker({ category: "plombier" });
    await createWorker({ category: "electricien" });

    const res = await request(app).get("/api/workers").query({ category: "electricien" });

    expect(res.status).toBe(200);
    expect(res.body.results).toBe(1);
    expect(res.body.data[0].category).toBe("electricien");
  });

  test("filtre par ville, insensible à la casse", async () => {
    await createWorker({ city: "Rabat" });
    await createWorker({ city: "Marrakech" });

    const res = await request(app).get("/api/workers").query({ city: "rabat" });

    expect(res.status).toBe(200);
    expect(res.body.results).toBe(1);
    expect(res.body.data[0].city).toBe("Rabat");
  });

  test("pagination : page et limit sont respectées", async () => {
    await Promise.all(
      Array.from({ length: 5 }).map((_, i) => createWorker({ name: `Artisan ${i}` }))
    );

    const res = await request(app).get("/api/workers").query({ limit: 2, page: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(5);
    expect(res.body.totalPages).toBe(3);
  });

  test("ne renvoie jamais le mot de passe ni les documents de vérification", async () => {
    await createWorker();

    const res = await request(app).get("/api/workers");

    expect(res.body.data[0].password).toBeUndefined();
    expect(res.body.data[0].documents).toBeUndefined();
  });
});

describe("GET /api/workers/:id", () => {
  test("retourne 404 pour un identifiant inexistant", async () => {
    const res = await request(app).get("/api/workers/64b6f0f0f0f0f0f0f0f0f0f0");
    expect(res.status).toBe(404);
  });

  test("retourne le profil public pour un artisan actif", async () => {
    const { worker } = await createWorker();

    const res = await request(app).get(`/api/workers/${worker._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(String(worker._id));
    expect(res.body.data.password).toBeUndefined();
  });
});

describe("GET /api/workers/top-rated", () => {
  test("exclut les artisans sans aucun avis (totalReviews = 0)", async () => {
    await createWorker();

    const res = await request(app).get("/api/workers/top-rated");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe("Gestion du profil artisan authentifié", () => {
  test("GET /api/workers/me renvoie le profil complet (200)", async () => {
    const { worker, token } = await createWorker();

    const res = await request(app).get("/api/workers/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(worker.email);
  });

  test("PUT /api/workers/me met à jour le profil (200)", async () => {
    const { token } = await createWorker();

    const res = await request(app)
      .put("/api/workers/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Plombier expérimenté, disponible 7j/7.", yearsExperience: 12 });

    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe("Plombier expérimenté, disponible 7j/7.");
    expect(res.body.data.yearsExperience).toBe(12);
  });

  test("PATCH /api/workers/me/availability refuse si le profil n'est pas vérifié (403)", async () => {
    const { token } = await createWorker({ verificationStatus: "pending" });

    const res = await request(app)
      .patch("/api/workers/me/availability")
      .set("Authorization", `Bearer ${token}`)
      .send({ isAvailable: true });

    expect(res.status).toBe(403);
  });

  test("PATCH /api/workers/me/availability bascule la disponibilité (200)", async () => {
    const { token } = await createWorker({ verificationStatus: "verified", isAvailable: false });

    const res = await request(app)
      .patch("/api/workers/me/availability")
      .set("Authorization", `Bearer ${token}`)
      .send({ isAvailable: true });

    expect(res.status).toBe(200);
    expect(res.body.data.isAvailable).toBe(true);
  });

  test("POST /api/workers/me/verification soumet les documents et repasse en pending (200)", async () => {
    const { token } = await createWorker({ verificationStatus: "verified" });

    const res = await request(app)
      .post("/api/workers/me/verification")
      .set("Authorization", `Bearer ${token}`)
      .send({
        idCardUrl: "https://cdn.example.com/id.jpg",
        proofOfAddressUrl: "https://cdn.example.com/address.jpg",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.verificationStatus).toBe("pending");
  });

  test("PUT /api/workers/:id met à jour son propre profil (200)", async () => {
    const { worker, token } = await createWorker();

    const res = await request(app)
      .put(`/api/workers/${worker._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Mise à jour via id." });

    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe("Mise à jour via id.");
  });

  test("PUT /api/workers/:id refuse de modifier le profil d'un autre artisan (403)", async () => {
    const { worker: other } = await createWorker();
    const { token } = await createWorker();

    const res = await request(app)
      .put(`/api/workers/${other._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Tentative non autorisée." });

    expect(res.status).toBe(403);
  });
});

describe("GET /api/workers/analytics", () => {
  test("retourne les indicateurs d'activité de l'artisan authentifié", async () => {
    const { token } = await createWorker();

    const res = await request(app).get("/api/workers/analytics").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      totalReservations: 0,
      reservationsThisWeek: 0,
      revenue: 0,
      rating: 0,
      totalReviews: 0,
      isPremium: false,
    });
  });

  test("refuse l'accès à un client (403)", async () => {
    const { token } = await createClient();

    const res = await request(app).get("/api/workers/analytics").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe("PUT /api/workers/upgrade-premium", () => {
  test("refuse le premium si le profil n'est pas vérifié (403)", async () => {
    const { token } = await createWorker({ verificationStatus: "pending" });

    const res = await request(app)
      .put("/api/workers/upgrade-premium")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("active le premium sur son propre profil vérifié (200)", async () => {
    const { token } = await createWorker({ verificationStatus: "verified" });

    const res = await request(app)
      .put("/api/workers/upgrade-premium")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isPremium).toBe(true);
  });
});
