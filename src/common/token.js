const jwt = require("jsonwebtoken");

// JWT secret key - centralized in one place
const JWT_SECRET = "ASDSADKSADKSKLASNKLAS45";
const TOKEN_EXPIRY = "5m"; // 5 minutes

// Generate authentication token for user
exports.generateAuthToken = (user) => {
  const token = jwt.sign({ _id: user._id.toString() }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
  return token;
};

// Verify authentication token
exports.verifyAuthToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

// Decode token without verification (for checking expiration)
exports.decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

// Check if token is about to expire (within 2 minutes)
exports.isTokenExpiringSoon = (token) => {
  try {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;

    // Refresh if token expires within 2 minutes (120 seconds)
    return timeUntilExpiry <= 120;
  } catch (error) {
    return true;
  }
};

// Get token expiration time in seconds
exports.getTokenExpirationTime = (token) => {
  try {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return 0;

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp - now;
  } catch (error) {
    return 0;
  }
};

// Check if token is expired
exports.isTokenExpired = (token) => {
  try {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch (error) {
    return true;
  }
};
