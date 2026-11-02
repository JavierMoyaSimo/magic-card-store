import { Router } from "express";
import mongoose from "mongoose";
import Card from "../models/Card.js";
import { findCardByName } from "../services/scryfall.js";

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

// Escapa los símbolos especiales para poder usar el texto del usuario en una búsqueda segura
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// CREATE: POST /api/cards
// Body: { "name": "lightning bolt", "price": 1.5, "stock": 4, "condition": "NM" }
router.post("/", async (req, res) => {
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
router.get("/", async (req, res) => {
  const { search } = req.query;
  const filter = search
    ? { name: { $regex: escapeRegex(search), $options: "i" } }
    : {};

  try {
    const cards = await Card.find(filter).sort({ name: 1 });
    res.json(cards);
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
router.put("/:id", async (req, res) => {
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
router.delete("/:id", async (req, res) => {
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
