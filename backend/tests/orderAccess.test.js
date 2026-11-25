import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { canViewOrder } from "../src/utils/orderAccess.js";

describe("canViewOrder", () => {
  const order = { user: "64b7f0f2f2f2f2f2f2f2f2f2" };
  const owner = { id: "64b7f0f2f2f2f2f2f2f2f2f2", role: "customer" };
  const stranger = { id: "64b7f0f2f2f2f2f2f2f2f2f3", role: "customer" };
  const admin = { id: "64b7f0f2f2f2f2f2f2f2f2f4", role: "admin" };

  test("el dueño del pedido puede verlo", () => {
    assert.equal(canViewOrder(order, owner), true);
  });

  test("otro cliente no puede verlo", () => {
    assert.equal(canViewOrder(order, stranger), false);
  });

  test("un administrador puede ver cualquier pedido", () => {
    assert.equal(canViewOrder(order, admin), true);
  });

  test("un pedido que no existe no es visible para nadie", () => {
    assert.equal(canViewOrder(null, admin), false);
  });

  test("sin usuario no se ve nada", () => {
    assert.equal(canViewOrder(order, null), false);
  });

  test("funciona cuando el dueño es un ObjectId y no un texto", () => {
    const objectIdLike = { toString: () => owner.id };
    assert.equal(canViewOrder({ user: objectIdLike }, owner), true);
  });
});
