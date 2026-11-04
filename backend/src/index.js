import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";
import app from "./app.js";

// Algunos routers/operadores rechazan las consultas SRV que necesita MongoDB Atlas.
// Usamos DNS públicos (Google y Cloudflare) para resolverlas.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const PORT = process.env.PORT || 5000;

// Conecta con MongoDB y, solo si lo consigue, arranca el servidor
async function start() {
  if (!process.env.JWT_SECRET) {
    console.error("Falta JWT_SECRET en el archivo .env");
    process.exit(1);
  }
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
