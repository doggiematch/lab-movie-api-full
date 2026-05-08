const prisma = require("../config/prisma");

const estadisticasGenerales = async (req, res, next) => {
  try {
    const [total, notas] = await prisma.$transaction([
      prisma.pelicula.count(),
      prisma.pelicula.aggregate({
        where: { nota: { not: null } },
        _avg: { nota: true },
        _max: { nota: true },
        _min: { nota: true },
      }),
    ]);

    res.json({
      total,
      media_nota: notas._avg.nota,
      nota_maxima: notas._max.nota,
      nota_minima: notas._min.nota,
    });
  } catch (err) {
    next(err);
  }
};

const estadisticasDirectores = async (req, res, next) => {
  try {
    const directores = await prisma.director.findMany({
      select: {
        id: true,
        nombre: true,
        _count: { select: { peliculas: true } },
      },
      orderBy: { peliculas: { _count: "desc" } },
    });

    res.json(
      directores.map((director) => ({
        id: director.id,
        director: director.nombre,
        cantidad: director._count.peliculas,
      })),
    );
  } catch (err) {
    next(err);
  }
};

const estadisticasGeneros = async (req, res, next) => {
  try {
    const generos = await prisma.genero.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
        _count: { select: { peliculas: true } },
      },
      orderBy: { peliculas: { _count: "desc" } },
    });

    res.json(
      generos.map((genero) => ({
        id: genero.id,
        genero: genero.nombre,
        slug: genero.slug,
        cantidad: genero._count.peliculas,
      })),
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  estadisticasGenerales,
  estadisticasDirectores,
  estadisticasGeneros,
};
