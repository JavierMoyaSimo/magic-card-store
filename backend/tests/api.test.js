import { describe, test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

// Estos tests comprueban las validaciones de la API.
// Fallan antes de tocar la base de datos, Scryfall o Claude,
// así que no necesitan conexión ni claves.
describe("API", () => {
  test("GET /api/health responde correctamente", async () => {
    const res = await request(app).get("/api/health");

    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
  });

  test("GET /api/scryfall/search sin 'name' devuelve 400", async () => {
    const res = await request(app).get("/api/scryfall/search");

    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  test("GET /api/scryfall/autocomplete sin 'q' devuelve 400", async () => {
    const res = await request(app).get("/api/scryfall/autocomplete");

    assert.equal(res.status, 400);
  });

  test("POST /api/cards sin 'name' devuelve 400", async () => {
    const res = await request(app).post("/api/cards").send({ price: 1 });

    assert.equal(res.status, 400);
  });

  test("GET /api/cards/:id con un id inválido devuelve 400", async () => {
    const res = await request(app).get("/api/cards/no-es-un-id");

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "El id no es válido");
  });

  test("PUT /api/cards/:id con un id inválido devuelve 400", async () => {
    const res = await request(app)
      .put("/api/cards/no-es-un-id")
      .send({ price: 2 });

    assert.equal(res.status, 400);
  });

  test("DELETE /api/cards/:id con un id inválido devuelve 400", async () => {
    const res = await request(app).delete("/api/cards/no-es-un-id");

    assert.equal(res.status, 400);
  });

  test("POST /api/identify sin imagen devuelve 400", async () => {
    const res = await request(app).post("/api/identify");

    assert.equal(res.status, 400);
  });

  test("POST /api/identify rechaza archivos que no son imágenes", async () => {
    const res = await request(app)
      .post("/api/identify")
      .attach("image", Buffer.from("esto no es una imagen"), {
        filename: "notas.txt",
        contentType: "text/plain",
      });

    assert.equal(res.status, 400);
  });
});
