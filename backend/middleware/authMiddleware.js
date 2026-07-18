import jwt from 'jsonwebtoken';

/**
 * Verifies the JWT token and attaches user information to the request object.
 */
export const verifyToken = (req, res, next) => {
  const bearerToken = req.headers.authorization?.split(" ")[1];
  const headerToken = req.headers['x-auth-token'];
  const token = bearerToken || headerToken;
  
  if (!token) {
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Payload: { id, role, ... }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * Middleware to restrict routes to system_admin only.
 * Call this AFTER verifyToken.
 */
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'system_admin') {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Requires system_admin role." });
  }
};

/**
 * Middleware to restrict routes to staff members (admin, assistant, dentist).
 * Call this AFTER verifyToken.
 */
export const isStaff = (req, res, next) => {
  if (req.user && ['system_admin', 'admin', 'assistant', 'dentist'].includes(req.user.role)) {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Staff only." });
  }
};

/**
 * Middleware to restrict routes to admin or assistant.
 * Call this AFTER verifyToken.
 */
export const isAdminOrAssistant = (req, res, next) => {
  if (req.user && ['system_admin', 'admin', 'assistant'].includes(req.user.role)) {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Admin or assistant only." });
  }
};