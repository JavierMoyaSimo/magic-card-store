import jwt from "jsonwebtoken";

// Exige que la petición traiga un pase válido: Authorization: Bearer <token>
export function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Debes iniciar sesión" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Sesión caducada o no válida" });
  }
}

// Exige además que el usuario sea administrador (se usa después de requireAuth)
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ error: "No tienes permisos para esta acción" });
  }
  next();
}
