import { Router } from "express";
import { findCardByName, autocompleteCardName } from "../services/scryfall.js";

const router = Router();

// GET /api/scryfall/search?name=light bolt
router.get("/search", async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Falta el parámetro 'name'" });
  }

  try {
    const card = await findCardByName(name);
    res.json(card);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// GET /api/scryfall/autocomplete?q=light
router.get("/autocomplete", async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Falta el parámetro 'q'" });
  }

  try {
    const names = await autocompleteCardName(q);
    res.json(names);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
