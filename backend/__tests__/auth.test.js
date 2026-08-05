/**
 * __tests__/auth.test.js
 * -----------------------------------------------------------------------------
 * Inscription/connexion (clients et artisans) via /api/auth, et middleware
 * JWT auth()/requireRole().
 * -----------------------------------------------------------------------------
 */
const request = require("supertest");
const app = require("../server");
const { validClientPayload, validWorkerPayload, createClient, createWorker } = require("./setup/fixtures");
const Client = require("../models/Client");

describe("Authentification JWT - clients", () => {
  test("inscription : crée le compte et retourne un token (201)", async () => {
    const payload = validClientPayload();

    const res = await request(app).post("/api/auth/signup/client").send(payload);

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.user.role).toBe("client");
  });

  test("inscription : refuse un email déjà utilisé (409)", async () => {
    const payload = validClientPayload();
    await request(app).post("/api/auth/signup/client").send(payload);

    const res = await request(app).post("/api/auth/signup/client").send(payload);

    expect(res.status).toBe(409);
  });

  test("connexion : renvoie un token pour des identifiants valides (200)", async () => {
    const payload = validClientPayload();
    await request(app).post("/api/auth/signup/client").send(payload);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.role).toBe("client");
  });

  test("connexion : refuse un mauvais mot de passe (401)", async () => {
    const payload = validClientPayload();
    await request(app).post("/api/auth/signup/client").send(payload);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: payload.email, password: "MauvaisMotDePasse1!" });

    expect(res.status).toBe(401);
  });

  test("connexion : refuse un email inconnu (401)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "inconnu@example.com", password: "Password123!" });

    expect(res.status).toBe(401);
  });

  test("connexion : refuse un compte désactivé (403)", async () => {
    const { client } = await createClient();
    client.isActive = false;
    await client.save();

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: client.email, password: "Password123!" });

    expect(res.status).toBe(403);
  });
});

describe("Authentification JWT - artisans (workers)", () => {
  test("inscription : crée un compte en attente de vérification (201)", async () => {
    const payload = validWorkerPayload();

    const res = await request(app).post("/api/auth/signup/worker").send(payload);

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("worker");
    expect(typeof res.body.token).toBe("string");
  });

  test("connexion : renvoie un token pour des identifiants valides (200)", async () => {
    const payload = validWorkerPayload();
    await request(app).post("/api/auth/signup/worker").send(payload);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
  });

  test("inscription : refuse un email déjà utilisé (409)", async () => {
    const payload = validWorkerPayload();
    await request(app).post("/api/auth/signup/worker").send(payload);

    const res = await request(app).post("/api/auth/signup/worker").send(payload);

    expect(res.status).toBe(409);
  });

  test("connexion : refuse un mauvais mot de passe (401)", async () => {
    const payload = validWorkerPayload();
    await request(app).post("/api/auth/signup/worker").send(payload);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: payload.email, password: "MauvaisMotDePasse1!" });

    expect(res.status).toBe(401);
  });

  test("connexion : refuse un compte désactivé (403)", async () => {
    const { worker } = await createWorker();
    worker.isActive = false;
    await worker.save();

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: worker.email, password: "Password123!" });

    expect(res.status).toBe(403);
  });
});

describe("GET /api/auth/me", () => {
  test("refuse l'accès sans token (401)", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("refuse un token malformé (401)", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer token-invalide");
    expect(res.status).toBe(401);
  });

  test("accepte un token valide et renvoie le profil authentifié (200)", async () => {
    const { client, token } = await createClient();

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(client.email);
    expect(res.body.data.role).toBe("client");
  });
});

describe("Middleware requireRole() - accès aux routes protégées", () => {
  test("refuse un token dont le rôle ne correspond pas à la route (403)", async () => {
    const { token } = await createClient();

    // Route réservée aux artisans (requireRole('worker')) appelée avec un token client.
    const res = await request(app).get("/api/workers/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("refuse un token dont l'utilisateur n'existe plus (404)", async () => {
    const { client, token } = await createClient();
    await Client.findByIdAndDelete(client._id);

    const res = await request(app).get("/api/clients/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("Gestion du profil client authentifié", () => {
  test("PUT /api/clients/me met à jour le profil (200)", async () => {
    const { token } = await createClient();

    const res = await request(app)
      .put("/api/clients/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nouveau Nom", city: "Tanger" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Nouveau Nom");
    expect(res.body.data.city).toBe("Tanger");
  });

  test("PATCH /api/clients/me/favorites/:workerId puis GET /api/clients/favorites (200)", async () => {
    const { token } = await createClient();
    const { worker } = await createWorker();

    const toggleRes = await request(app)
      .patch(`/api/clients/me/favorites/${worker._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.data).toHaveLength(1);

    const listRes = await request(app)
      .get("/api/clients/favorites")
      .set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.results).toBe(1);
    expect(listRes.body.data[0]._id).toBe(String(worker._id));
  });
});

describe("Middleware protectAdmin - routes d'administration du blog", () => {
  test("refuse une requête sans clé admin (403)", async () => {
    const res = await request(app).post("/api/blog").send({});
    expect(res.status).toBe(403);
  });

  test("refuse une clé admin invalide (403)", async () => {
    const res = await request(app).post("/api/blog").set("x-admin-key", "mauvaise-cle").send({});
    expect(res.status).toBe(403);
  });

  test("refuse tout accès admin si ADMIN_API_KEY n'est pas configurée côté serveur (503)", async () => {
    const original = process.env.ADMIN_API_KEY;
    delete process.env.ADMIN_API_KEY;

    const res = await request(app).post("/api/blog").set("x-admin-key", "peu-importe").send({});

    process.env.ADMIN_API_KEY = original;
    expect(res.status).toBe(503);
  });

  test("laisse passer une clé admin valide (la requête atteint la validation Joi suivante)", async () => {
    const res = await request(app)
      .post("/api/blog")
      .set("x-admin-key", process.env.ADMIN_API_KEY)
      .send({});

    // protectAdmin laisse passer ; le payload vide est ensuite rejeté par la
    // validation Joi (400), ce qui prouve que le middleware a bien appelé next().
    expect(res.status).toBe(400);
  });
});
