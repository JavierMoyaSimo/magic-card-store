import { Router } from "express";
import mongoose from "mongoose";
import Card from "../models/Card.js";
import Order from "../models/Order.js";
import { requireAdmin } from "../middleware/auth.js";
import { canViewOrder } from "../utils/orderAccess.js";

const router = Router();

const MAX_DISTINCT_CARDS = 50;
const MAX_QUANTITY_PER_CARD = 99;

// Error con un código HTTP asociado, para responder con el mensaje adecuado
class OrderError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function handleError(res, error) {
  if (error instanceof OrderError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error(error);
  res.status(500).json({ error: "No se pudo completar la operación" });
}

// Antes de cualquier ruta con :id, comprobamos que el id tiene formato válido
router.param("id", (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ error: "El id no es válido" });
  }
  next();
});

// Valida el carrito que envía la web y devuelve un Map: idDeCarta -> cantidad
function parseItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new OrderError("El carrito está vacío");
  }

  const quantities = new Map();

  for (const raw of rawItems) {
    const cardId = String(raw?.cardId ?? "");
    const quantity = Number(raw?.quantity);

    if (!mongoose.isObjectIdOrHexString(cardId)) {
      throw new OrderError("Hay una carta con un identificador no válido");
    }
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY_PER_CARD
    ) {
      throw new OrderError(
        `La cantidad debe ser un número entero entre 1 y ${MAX_QUANTITY_PER_CARD}`,
      );
    }

    // Si la misma carta llega en dos líneas, sumamos las cantidades
    quantities.set(cardId, (quantities.get(cardId) ?? 0) + quantity);
  }

  if (quantities.size > MAX_DISTINCT_CARDS) {
    throw new OrderError(
      `Un pedido admite como máximo ${MAX_DISTINCT_CARDS} cartas distintas`,
    );
  }

  return quantities;
}

// POST /api/orders   Body: { "items": [{ "cardId": "...", "quantity": 2 }] }
router.post("/", async (req, res) => {
  let session;

  try {
    const quantities = parseItems(req.body?.items);
    let order;

    session = await mongoose.startSession();

    // Todo lo que hay dentro se aplica entero o no se aplica nada
    await session.withTransaction(async () => {
      const items = [];
      let totalCents = 0;

      for (const [cardId, quantity] of quantities) {
        // Descuento atómico: solo se aplica si queda stock suficiente
        const card = await Card.findOneAndUpdate(
          { _id: cardId, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } },
          { new: true, session },
        );

        if (!card) {
          const existing = await Card.findById(cardId).session(session);
          throw new OrderError(
            existing
              ? `No hay stock suficiente de "${existing.name}" (quedan ${existing.stock})`
              : "Una de las cartas ya no está disponible",
            409,
          );
        }

        items.push({
          card: card._id,
          name: card.name,
          setName: card.setName,
          imageUrl: card.imageUrl,
          unitPrice: card.price,
          quantity,
        });

        // Calculamos en céntimos para evitar errores de decimales (0.1 + 0.2)
        totalCents += Math.round(card.price * 100) * quantity;
      }

      const created = await Order.create(
        [{ user: req.user.id, items, total: totalCents / 100 }],
        { session },
      );
      order = created[0];
    });

    res.status(201).json(order);
  } catch (error) {
    handleError(res, error);
  } finally {
    await session?.endSession();
  }
});

// GET /api/orders/mine   Los pedidos del usuario que ha iniciado sesión
router.get("/mine", async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    handleError(res, error);
  }
});

// GET /api/orders   Todos los pedidos (solo administrador)
router.get("/", requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "email");
    res.json(orders);
  } catch (error) {
    handleError(res, error);
  }
});

// GET /api/orders/:id   Un pedido concreto (de su dueño o, si es administrador, de cualquiera)
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    // Si no existe o es de otra persona, respondemos exactamente lo mismo: 404.
    // Un 403 confirmaría que ese identificador existe.
    if (!canViewOrder(order, req.user)) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Al administrador le añadimos el email del cliente
    // populate: resolver referencias entre documentos.
    if (req.user.role === "admin") {
      await order.populate("user", "email"); // esto devuelve un objeto con { _id, email } en order.user
    }

    res.json(order);
  } catch (error) {
    handleError(res, error);
  }
});

// PATCH /api/orders/:id/status   Body: { "status": "shipped" | "cancelled" } (solo administrador)
router.patch("/:id/status", requireAdmin, async (req, res) => {
  const { status } = req.body ?? {};

  if (!["shipped", "cancelled"].includes(status)) {
    return res
      .status(400)
      .json({ error: "El estado debe ser 'shipped' o 'cancelled'" });
  }

  let session;

  try {
    let updated;
    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      // Solo se puede cambiar un pedido que sigue pendiente
      updated = await Order.findOneAndUpdate(
        { _id: req.params.id, status: "pending" },
        { status },
        { new: true, session },
      );

      if (!updated) {
        throw new OrderError("El pedido no existe o ya no está pendiente", 409);
      }

      // Si se cancela, las cartas vuelven al stock
      if (status === "cancelled") {
        for (const item of updated.items) {
          await Card.updateOne(
            { _id: item.card },
            { $inc: { stock: item.quantity } },
            { session },
          );
        }
      }
    });

    res.json(updated);
  } catch (error) {
    handleError(res, error);
  } finally {
    await session?.endSession();
  }
});

export default router;
