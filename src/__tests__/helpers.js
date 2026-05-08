const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const createUser = async ({
  nombre = "Test User",
  email = "test@test.com",
  password = "pass123",
  rol = "usuario",
} = {}) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.usuario.create({
    data: { nombre, email, passwordHash, rol },
    select: { id: true, nombre: true, email: true, rol: true },
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1h" },
  );
  return { usuario: user, token };
};

const createMovie = async ({
  titulo = "Test Movie",
  anio = 2024,
  nota = 8.0,
} = {}) => {
  return prisma.pelicula.create({
    data: { titulo, anio, nota },
  });
};

module.exports = { createUser, createMovie };
