const { Router } = require("express");
const router = Router();

const {
  estadisticasDirectores,
  estadisticasGeneros,
  estadisticasGenerales,
} = require("../controllers/estadisticasController");

router.get("/", estadisticasGenerales);
router.get("/directores", estadisticasDirectores);
router.get("/generos", estadisticasGeneros);

module.exports = router;
