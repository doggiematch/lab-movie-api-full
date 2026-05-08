const { Router } = require("express");
const router = Router();
const verificarToken = require("../middleware/verificarToken");
const {
  anadirFavorito,
  quitarFavorito,
  listarFavoritos,
} = require("../controllers/favoritosController");

router.use(verificarToken);

router.post("/:peliculaId", anadirFavorito);
router.delete("/:peliculaId", quitarFavorito);
router.get("/", listarFavoritos);

module.exports = router;
