import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns";

import scryfallRoutes from "./routes/scryfall.routes.js";
import cardRoutes from "./routes/cards.routes.js";

// Algunos routers/operadores rechazan las consultas SRV que necesita MongoDB Atlas.
// Usamos DNS públicos (Google y Cloudflare) para resolverlas.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Leer variables del archivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares: funciones que se ejecutan en cada petición antes de llegar a tus rutas
app.use(cors()); // permite peticiones desde el frontend
app.use(express.json()); // permite recibir datos en formato JSON

// Ruta de prueba: comprueba que el servidor responde
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor funcionando" });
});
// Rutas de Scryfall
app.use("/api/scryfall", scryfallRoutes);
// Rutas de cartas de la tienda
app.use("/api/cards", cardRoutes);

// Conecta con MongoDB y, solo si lo consigue, arranca el servidor
async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado a MongoDB");

    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error al conectar con MongoDB:", error.message);
    process.exit(1);
  }
}

start();
