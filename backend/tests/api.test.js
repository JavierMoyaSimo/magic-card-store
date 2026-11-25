import { describe, test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";

// Clave de pruebas: solo existe mientras se ejecutan los tests
process.env.JWT_SECRET = "test-secret";

const FAKE_ID = "64b7f0f2f2f2f2f2f2f2f2f2";

// Fabrica un pase válido con el rol indicado, sin pasar por la base de datos
function authHeader(role, userId = FAKE_ID) {
  const token = jwt.sign(
    { email: `${role}@test.com`, role },
    process.env.JWT_SECRET,
    {
      subject: userId,
      expiresIn: "1h",
    },
  );
  return { Authorization: `Bearer ${token}` };
}

// Estos tests comprueban permisos y validaciones. Fallan antes de tocar
// la base de datos, Scryfall o Claude, así que no necesitan conexión ni claves.
describe("Public routes", () => {
  test("GET /api/health responde correctamente", async () => {
    const res = await request(app).get("/api/health");

    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
  });

  test("GET /api/cards/:id con un id inválido devuelve 400", async () => {
    const res = await request(app).get("/api/cards/no-es-un-id");

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "El id no es válido");
  });

  test("Las respuestas incluyen cabeceras de seguridad", async () => {
    const res = await request(app).get("/api/health");

    assert.equal(res.headers["x-content-type-options"], "nosniff");
    assert.equal(res.headers["x-powered-by"], undefined);
  });
});

describe("Authentication required (401)", () => {
  test("POST /api/cards sin sesión devuelve 401", async () => {
    const res = await request(app)
      .post("/api/cards")
      .send({ name: "Lightning Bolt" });

    assert.equal(res.status, 401);
  });

  test("GET /api/scryfall/search sin sesión devuelve 401", async () => {
    const res = await request(app).get("/api/scryfall/search?name=bolt");

    assert.equal(res.status, 401);
  });

  test("POST /api/identify sin sesión devuelve 401", async () => {
    const res = await request(app).post("/api/identify");

    assert.equal(res.status, 401);
  });

  test("Un pase falso devuelve 401", async () => {
    const res = await request(app)
      .post("/api/cards")
      .set("Authorization", "Bearer pase-inventado")
      .send({ name: "Lightning Bolt" });

    assert.equal(res.status, 401);
  });
});

describe("Admin role required (403)", () => {
  test("Un cliente no puede añadir cartas", async () => {
    const res = await request(app)
      .post("/api/cards")
      .set(authHeader("customer"))
      .send({ name: "Lightning Bolt" });

    assert.equal(res.status, 403);
  });

  test("Un cliente no puede usar Scryfall", async () => {
    const res = await request(app)
      .get("/api/scryfall/search?name=bolt")
      .set(authHeader("customer"));

    assert.equal(res.status, 403);
  });

  test("Un cliente no puede usar la identificación por foto", async () => {
    const res = await request(app)
      .post("/api/identify")
      .set(authHeader("customer"));

    assert.equal(res.status, 403);
  });
});

describe("Validations as admin", () => {
  test("GET /api/scryfall/search sin 'name' devuelve 400", async () => {
    const res = await request(app)
      .get("/api/scryfall/search")
      .set(authHeader("admin"));

    assert.equal(res.status, 400);
  });

  test("GET /api/scryfall/autocomplete sin 'q' devuelve 400", async () => {
    const res = await request(app)
      .get("/api/scryfall/autocomplete")
      .set(authHeader("admin"));

    assert.equal(res.status, 400);
  });

  test("POST /api/cards sin 'name' devuelve 400", async () => {
    const res = await request(app)
      .post("/api/cards")
      .set(authHeader("admin"))
      .send({ price: 1 });

    assert.equal(res.status, 400);
  });

  test("PUT /api/cards/:id con un id inválido devuelve 400", async () => {
    const res = await request(app)
      .put("/api/cards/no-es-un-id")
      .set(authHeader("admin"))
      .send({ price: 2 });

    assert.equal(res.status, 400);
  });

  test("DELETE /api/cards/:id con un id inválido devuelve 400", async () => {
    const res = await request(app)
      .delete("/api/cards/no-es-un-id")
      .set(authHeader("admin"));

    assert.equal(res.status, 400);
  });

  test("POST /api/identify sin imagen devuelve 400", async () => {
    const res = await request(app)
      .post("/api/identify")
      .set(authHeader("admin"));

    assert.equal(res.status, 400);
  });

  test("POST /api/identify rechaza archivos que no son imágenes", async () => {
    const res = await request(app)
      .post("/api/identify")
      .set(authHeader("admin"))
      .attach("image", Buffer.from("esto no es una imagen"), {
        filename: "notas.txt",
        contentType: "text/plain",
      });

    assert.equal(res.status, 400);

    test("POST /api/identify aplica un límite de uso por usuario", async () => {
      // Usamos otro id de usuario para no consumir el límite de los demás tests
      const headers = authHeader("admin", "64b7f0f2f2f2f2f2f2f2f2f3");
      let lastResponse;

      for (let i = 0; i < 31; i++) {
        lastResponse = await request(app).post("/api/identify").set(headers);
      }

      assert.equal(lastResponse.status, 429);
    });
  });
});

describe("Auth endpoints", () => {
  test("POST /api/auth/register con email inválido devuelve 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "esto-no-es-un-email", password: "clave-segura-123" });

    assert.equal(res.status, 400);
  });

  test("POST /api/auth/register con contraseña corta devuelve 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "prueba@ejemplo.com", password: "corta" });

    assert.equal(res.status, 400);
  });

  test("POST /api/auth/login sin datos devuelve 400", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    assert.equal(res.status, 400);
  });

  test("GET /api/auth/me con un pase válido devuelve el usuario", async () => {
    const res = await request(app).get("/api/auth/me").set(authHeader("admin"));

    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, "admin");
  });

  test("GET /api/auth/me sin sesión devuelve 401", async () => {
    const res = await request(app).get("/api/auth/me");

    assert.equal(res.status, 401);
  });
});

describe("Orders", () => {
  test("POST /api/orders sin sesión devuelve 401", async () => {
    const res = await request(app).post("/api/orders").send({ items: [] });

    assert.equal(res.status, 401);
  });

  test("GET /api/orders/mine sin sesión devuelve 401", async () => {
    const res = await request(app).get("/api/orders/mine");

    assert.equal(res.status, 401);
  });

  test("Un cliente no puede ver todos los pedidos", async () => {
    const res = await request(app)
      .get("/api/orders")
      .set(authHeader("customer"));

    assert.equal(res.status, 403);
  });

  test("Un cliente no puede cambiar el estado de un pedido", async () => {
    const res = await request(app)
      .patch(`/api/orders/${FAKE_ID}/status`)
      .set(authHeader("customer"))
      .send({ status: "shipped" });

    assert.equal(res.status, 403);
  });

  test("POST /api/orders con el carrito vacío devuelve 400", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set(authHeader("customer"))
      .send({ items: [] });

    assert.equal(res.status, 400);
  });

  test("POST /api/orders con una cantidad inválida devuelve 400", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set(authHeader("customer"))
      .send({ items: [{ cardId: FAKE_ID, quantity: 0 }] });

    assert.equal(res.status, 400);
  });

  test("PATCH /api/orders/:id/status con un estado inválido devuelve 400", async () => {
    const res = await request(app)
      .patch(`/api/orders/${FAKE_ID}/status`)
      .set(authHeader("admin"))
      .send({ status: "refunded" });

    assert.equal(res.status, 400);
  });

  test("GET /api/orders/:id sin sesión devuelve 401", async () => {
    const res = await request(app).get(`/api/orders/${FAKE_ID}`);

    assert.equal(res.status, 401);
  });

  test("GET /api/orders/:id con un id inválido devuelve 400", async () => {
    const res = await request(app)
      .get("/api/orders/no-es-un-id")
      .set(authHeader("customer"));

    assert.equal(res.status, 400);
  });
});
