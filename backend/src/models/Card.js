import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    // Datos de la carta (vienen de Scryfall)
    scryfallId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    setCode: { type: String },
    setName: { type: String },
    collectorNumber: { type: String },
    typeLine: { type: String },
    colors: { type: [String], default: [] },
    manaValue: { type: Number, min: 0, default: 0 },
    manaCost: { type: String, default: "" },
    oracleText: { type: String, default: "" },
    rarity: { type: String },
    imageUrl: { type: String },

    // Datos de la tienda (los pones tú)
    price: { type: Number, min: 0, default: 0 },
    stock: { type: Number, min: 0, default: 1 },
    condition: {
      type: String,
      enum: ["NM", "LP", "MP", "HP", "DMG"],
      /*NM: Near Mint- Casi nueva
      LP: Light Play- Ligeramente usada
      MP: Medium Play- Medianamente usada
      HP: Heavy Play- Muy usada
      DMG: Damaged- Dañada */
      default: "NM",
    },
  },
  { timestamps: true }, // Crea automáticamente createdAt y updatedAt
);

export default mongoose.model("Card", cardSchema);
