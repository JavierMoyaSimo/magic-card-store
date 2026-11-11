import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";
import Card from "../models/Card.js";
import { findCardById } from "../services/scryfall.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  await mongoose.connect(process.env.MONGODB_URI);

  // lean() devuelve objetos simples, sin valores por defecto añadidos por Mongoose
  const cards = await Card.find({ manaValue: { $exists: false } }).lean();
  console.log(`Cartas por actualizar: ${cards.length}`);

  for (const card of cards) {
    try {
      const data = await findCardById(card.scryfallId);
      await Card.updateOne(
        { _id: card._id },
        { $set: { colors: data.colors, manaValue: data.manaValue } },
      );
      console.log(`OK: ${card.name}`);
    } catch (error) {
      console.error(`Error con ${card.name}: ${error.message}`);
    }

    // Scryfall pide 50-100 ms entre peticiones
    await sleep(120);
  }
} catch (error) {
  console.error("Error:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
