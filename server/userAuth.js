const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

function signToken(user) {
  // Keep payload minimal
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role || "customer" },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function parseBearer(req) {
  const h = req.header("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

function requireAuth(req, res, next) {
  try {
    const token = parseBearer(req);
    if (!token) return res.status(401).json({ error: "Missing Authorization Bearer token" });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || "customer",
    };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function optionalAuth(req, _res, next) {
  try {
    const token = parseBearer(req);
    if (!token) {
      req.user = null;
      return next();
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || "customer",
    };
    next();
  } catch {
    // If token is present but invalid, treat as unauthenticated
    req.user = null;
    next();
  }
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  sanitizeUser,
  signToken,
  requireAuth,
  optionalAuth,
};
