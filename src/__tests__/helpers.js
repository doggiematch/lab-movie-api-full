const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const createUser = async ({
  nombre = "Test User",
  email = "test@test.com",
  password = "pass123",
  rol = "usuario",
} = {}) => {
  const password_hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nombre, email, rol`,
    [nombre, email, password_hash, rol],
  );
  const user = rows[0];
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
  const { rows } = await pool.query(
    `INSERT INTO peliculas (titulo, anio, nota) VALUES ($1, $2, $3) RETURNING *`,
    [titulo, anio, nota],
  );
  return rows[0];
};

module.exports = { createUser, createMovie };
