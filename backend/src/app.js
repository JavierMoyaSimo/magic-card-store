import express from "express";
import cors from "cors";
import scryfallRoutes from "./routes/scryfall.routes.js";
import cardRoutes from "./routes/cards.routes.js";
import identifyRoutes from "./routes/identify.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { requireAuth, requireAdmin } from "./middleware/auth.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta comprueba que el servidor responde
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor funcionando" });
});

app.use("/api/auth", authRoutes);
app.use("/api/scryfall", requireAuth, requireAdmin, scryfallRoutes);
app.use("/api/identify", requireAuth, requireAdmin, identifyRoutes);
app.use("/api/cards", cardRoutes);

export default app;
