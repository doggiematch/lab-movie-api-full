const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const verificarToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Token no proporcionado", 401);
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "test-secret";

    req.usuario = jwt.verify(token, secret);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Token expirado", 401));
    }

    if (err.name === "JsonWebTokenError") {
      return next(new AppError("Token invalido", 401));
    }

    next(err);
  }
};

module.exports = verificarToken;
