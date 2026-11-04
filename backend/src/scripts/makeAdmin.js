import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns";
import User from "../models/User.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Uso: npm run make-admin -- tu@email.com");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOneAndUpdate(
    { email },
    { role: "admin" },
    { new: true },
  );

  if (!user) {
    console.error(
      `No existe ningún usuario con el email ${email}. Regístrate primero en la web.`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `${user.email} ahora es administrador. Cierra sesión y vuelve a entrar para que se aplique.`,
    );
  }
} catch (error) {
  console.error("Error:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
