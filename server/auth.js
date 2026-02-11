function hasAdminKey(req) {
  const expected = process.env.ADMIN_KEY || "";
  if (!expected) return false;
  const provided = req.header("x-admin-key");
  return Boolean(provided && provided === expected);
}

function hasAdminRole(req) {
  return Boolean(req.user && (req.user.role === "admin"));
}

/**
 * Admin access if either:
 *  - x-admin-key matches ADMIN_KEY
 *  - user is authenticated and has role=admin (JWT)
 */
function requireAdminAny(req, res, next) {
  if (hasAdminKey(req) || hasAdminRole(req)) return next();
  return res.status(401).json({ error: "Admin access required" });
}

module.exports = {
  hasAdminKey,
  hasAdminRole,
  requireAdminAny,
};
