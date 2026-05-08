require("dotenv").config();

const express = require("express");
const peliculasRouter = require("./src/routes/peliculas");
const authRouter = require("./src/routes/auth");
const estadisticasRouter = require("./src/routes/estadisticas");
const favoritosRouter = require("./src/routes/favoritos");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/peliculas", peliculasRouter);
app.use("/api/auth", authRouter);
app.use("/api/estadisticas", estadisticasRouter);
app.use("/api/favoritos", favoritosRouter);

app.use((req, res) => {
  res
    .status(404)
    .json({ error: `Ruta ${req.method} ${req.url} no encontrada` });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Error interno del servidor",
  });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
  });
}

module.exports = app;
