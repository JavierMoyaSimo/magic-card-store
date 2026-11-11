import { Router } from "express";
import mongoose from "mongoose";
import Card from "../models/Card.js";
import { findCardByName } from "../services/scryfall.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { buildCardQuery } from "../utils/cardQuery.js";

const router = Router();

// Antes de cualquier ruta con :id, comprobamos que el id tiene formato válido de MongoDB
router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "El id no es válido" });
  }
  next();
});

// Convierte los errores en una respuesta con el código HTTP adecuado
function handleError(res, error) {
  if (error.name === "ValidationError") {
    return res.status(400).json({ error: error.message });
  }
  res.status(error.status || 500).json({ error: error.message });
}

// CREATE: POST /api/cards
// Body: { "name": "lightning bolt", "price": 1.5, "stock": 4, "condition": "NM" }
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, price, stock, condition } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Falta el campo 'name'" });
  }

  try {
    // 1. Averiguamos qué carta es con Scryfall
    const scryfallCard = await findCardByName(name);

    // 2. Si ya la tenemos en la tienda, avisamos
    const existing = await Card.findOne({
      scryfallId: scryfallCard.scryfallId,
    });
    if (existing) {
      return res.status(409).json({
        error:
          "Esta carta ya está en la tienda. Edítala para cambiar su stock o precio.",
        card: existing,
      });
    }

    // 3. Guardamos datos de Scryfall + datos de la tienda
    const card = await Card.create({
      ...scryfallCard,
      price,
      stock,
      condition,
    });
    res.status(201).json(card);
  } catch (error) {
    handleError(res, error);
  }
});

// READ (lista): GET /api/cards  o  GET /api/cards?search=bolt
// READ (lista): GET /api/cards?search=&type=&colors=&manaValue=&sort=&page=&limit=
router.get("/", async (req, res) => {
  const {
    filter,
    sort,
    page: requestedPage,
    limit,
  } = buildCardQuery(req.query);

  try {
    const total = await Card.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    // Si piden una página que ya no existe (por ejemplo, tras borrar), usamos la última
    const page = Math.min(requestedPage, totalPages);

    const cards = await Card.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ cards, page, limit, total, totalPages });
  } catch (error) {
    handleError(res, error);
  }
});

// READ (una carta): GET /api/cards/:id
router.get("/:id", async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ error: "Carta no encontrada" });
    }
    res.json(card);
  } catch (error) {
    handleError(res, error);
  }
});

// UPDATE: PUT /api/cards/:id
// Solo permitimos cambiar los datos de la tienda, no los de la carta
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const updates = {};
  for (const field of ["price", "stock", "condition"]) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  try {
    const card = await Card.findByIdAndUpdate(req.params.id, updates, {
      new: true, // devuelve la carta ya actualizada
      runValidators: true, // aplica las reglas del modelo (precio >= 0, etc.)
    });
    if (!card) {
      return res.status(404).json({ error: "Carta no encontrada" });
    }
    res.json(card);
  } catch (error) {
    handleError(res, error);
  }
});

// DELETE: DELETE /api/cards/:id
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const card = await Card.findByIdAndDelete(req.params.id);
    if (!card) {
      return res.status(404).json({ error: "Carta no encontrada" });
    }
    res.json({ message: "Carta eliminada", card });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
