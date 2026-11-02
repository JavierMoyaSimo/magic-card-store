import express from "express";
import cors from "cors";
import scryfallRoutes from "./routes/scryfall.routes.js";
import cardRoutes from "./routes/cards.routes.js";
import identifyRoutes from "./routes/identify.routes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta comprueba que el servidor responde
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor funcionando" });
});

app.use("/api/scryfall", scryfallRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/identify", identifyRoutes);

export default app;
