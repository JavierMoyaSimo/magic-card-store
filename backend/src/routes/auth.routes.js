import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Máximo 30 intentos de registro/login cada 15 minutos por IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos. Inténtalo de nuevo en unos minutos.",
  },
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(user) {
  return jwt.sign(
    { email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { subject: String(user._id), expiresIn: "7d" },
  );
}

// Datos del usuario que sí se pueden enseñar (nunca el hash)
function publicUser(user) {
  return { id: user._id, email: user.email, role: user.role };
}

// POST /api/auth/register
router.post("/register", authLimiter, async (req, res) => {
  const { email: rawEmail, password: rawPassword } = req.body ?? {};
  const email = String(rawEmail ?? "")
    .trim()
    .toLowerCase();
  const password = String(rawPassword ?? "");

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "El email no es válido" });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }
  if (password.length > 72) {
    return res
      .status(400)
      .json({ error: "La contraseña no puede superar los 72 caracteres" });
  }

  try {
    if (await User.findOne({ email })) {
      return res
        .status(409)
        .json({ error: "Ya existe una cuenta con ese email" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash });

    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: "Ya existe una cuenta con ese email" });
    }
    res.status(500).json({ error: "No se pudo crear la cuenta" });
  }
});

// POST /api/auth/login
router.post("/login", authLimiter, async (req, res) => {
  const { email: rawEmail, password: rawPassword } = req.body ?? {};
  const email = String(rawEmail ?? "")
    .trim()
    .toLowerCase();
  const password = String(rawPassword ?? "");

  if (!email || !password) {
    return res.status(400).json({ error: "Faltan el email o la contraseña" });
  }

  try {
    const user = await User.findOne({ email });
    const valid = user && (await bcrypt.compare(password, user.passwordHash));

    // Mismo mensaje si falla el email o la contraseña, para no dar pistas
    if (!valid) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    res.json({ token: createToken(user), user: publicUser(user) });
  } catch {
    res.status(500).json({ error: "No se pudo iniciar sesión" });
  }
});

// GET /api/auth/me  (devuelve el usuario del pase actual)
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
