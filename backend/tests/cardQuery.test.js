import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildCardQuery } from "../src/utils/cardQuery.js";

describe("buildCardQuery", () => {
  test("sin parámetros usa los valores por defecto", () => {
    const query = buildCardQuery({});

    assert.deepEqual(query.filter, {});
    assert.equal(query.page, 1);
    assert.equal(query.limit, 12);
    assert.deepEqual(query.sort, { name: 1 });
  });

  test("limita el tamaño de página a 50 cartas", () => {
    assert.equal(buildCardQuery({ limit: "9999" }).limit, 50);
  });

  test("ignora páginas inválidas", () => {
    assert.equal(buildCardQuery({ page: "-3" }).page, 1);
    assert.equal(buildCardQuery({ page: "abc" }).page, 1);
  });

  test("filtra por tipo de carta con una lista blanca", () => {
    assert.ok(buildCardQuery({ type: "creature" }).filter.typeLine);
    assert.equal(buildCardQuery({ type: "dragon" }).filter.typeLine, undefined);
  });

  test("filtra por colores, incluida la carta incolora", () => {
    const { filter } = buildCardQuery({ colors: "u,c,x" });

    assert.deepEqual(filter.$or, [
      { colors: { $in: ["U"] } },
      { colors: { $size: 0 } },
    ]);
  });

  test("el coste de maná 7 significa 7 o más", () => {
    assert.deepEqual(buildCardQuery({ manaValue: "7" }).filter.manaValue, {
      $gte: 7,
    });
    assert.equal(buildCardQuery({ manaValue: "3" }).filter.manaValue, 3);
  });

  test("escapa los símbolos especiales de la búsqueda", () => {
    assert.equal(buildCardQuery({ search: "a.b" }).filter.name.$regex, "a\\.b");
  });

  test("ignora valores que no son texto (inyección de operadores)", () => {
    const { filter } = buildCardQuery({
      search: { $ne: "" },
      type: ["land"],
      colors: { $gt: "" },
    });

    assert.deepEqual(filter, {});
  });

  test("usa el orden por nombre si el orden pedido no existe", () => {
    assert.deepEqual(buildCardQuery({ sort: "constructor" }).sort, { name: 1 });
  });
});
