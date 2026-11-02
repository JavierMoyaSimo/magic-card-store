import { Router } from "express";
import multer from "multer";
import { identifyCardName } from "../services/vision.js";
import { findCardByName } from "../services/scryfall.js";

const router = Router();

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// multer guarda la foto en memoria, con un límite de 5 MB y solo formatos de imagen
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    cb(null, ALLOWED_TYPES.includes(file.mimetype)),
});

// POST /api/identify   (multipart/form-data, campo "image")
router.post("/", (req, res) => {
  upload.single("image")(req, res, async (uploadError) => {
    if (uploadError) {
      const tooBig = uploadError.code === "LIMIT_FILE_SIZE";
      return res.status(400).json({
        error: tooBig
          ? "La imagen supera los 5 MB"
          : "Error al subir la imagen",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Sube una imagen JPG, PNG, WEBP o GIF en el campo 'image'",
      });
    }

    try {
      // 1. Claude lee el nombre de la carta en la foto
      const { name, confidence } = await identifyCardName(
        req.file.buffer,
        req.file.mimetype,
      );

      if (!name) {
        return res.status(422).json({
          error: "No he podido reconocer ninguna carta de Magic en la imagen",
        });
      }

      // 2. Scryfall devuelve la carta oficial con ese nombre
      const card = await findCardByName(name);

      res.json({ identifiedName: name, confidence, card });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  });
});

export default router;
