const express = require("express");
const {
  listarPeliculas,
  obtenerPelicula,
  crearPelicula,
  actualizarPelicula,
  eliminarPelicula,
} = require("../controllers/peliculasPrismaController");

const router = express.Router();

router.get("/", listarPeliculas);
router.get("/:id", obtenerPelicula);
router.post("/", crearPelicula);
router.put("/:id", actualizarPelicula);
router.delete("/:id", eliminarPelicula);

module.exports = router;
