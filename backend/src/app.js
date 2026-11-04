import express from "express";
import cors from "cors";
import scryfallRoutes from "./routes/scryfall.routes.js";
import cardRoutes from "./routes/cards.routes.js";
import identifyRoutes from "./routes/identify.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { requireAuth, requireAdmin } from "./middleware/auth.js";

const app = express();

// Detrás del balanceador de carga de Render, la IP real del visitante llega en una cabecera.
// Con esto, el límite de intentos se aplica por visitante y no a todos a la vez.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Solo las direcciones de esta lista pueden llamar a la API desde un navegador.
// FRONTEND_URL admite varias direcciones separadas por comas.
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""));

// Middlewares: funciones que se ejecutan en cada petición antes de llegar a las rutas
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Ruta de prueba
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor funcionando" });
});

app.use("/api/auth", authRoutes);
app.use("/api/scryfall", requireAuth, requireAdmin, scryfallRoutes);
app.use("/api/identify", requireAuth, requireAdmin, identifyRoutes);
app.use("/api/cards", cardRoutes);

export default app;
