const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");

const parseBoolean = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

// GET /api/peliculas
const listarPeliculas = async (req, res, next) => {
  try {
    const { genero, director, anio, destacada, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (genero) where.genero = { slug: genero };
    if (director)
      where.director = { nombre: { contains: director, mode: "insensitive" } };
    if (anio) where.anio = Number(anio);
    if (destacada !== undefined) where.destacada = parseBoolean(destacada);

    const [peliculas, total] = await prisma.$transaction([
      prisma.pelicula.findMany({
        where,
        include: {
          director: { select: { nombre: true } },
          genero: { select: { nombre: true, slug: true } },
          _count: { select: { resenas: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.pelicula.count({ where }),
    ]);

    res.json({
      data: peliculas,
      total,
      pagina: Number(page),
      totalPaginas: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/peliculas/:id
const obtenerPelicula = async (req, res, next) => {
  try {
    const pelicula = await prisma.pelicula.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        director: true,
        genero: true,
        resenas: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: { select: { resenas: true, favoritos: true } },
      },
    });

    if (!pelicula) {
      throw new AppError("Película no encontrada", 404);
    }

    res.json(pelicula);
  } catch (err) {
    next(err);
  }
};

// POST /api/peliculas
const crearPelicula = async (req, res, next) => {
  try {
    const { titulo, anio, nota, director, genero, destacada } = req.body;

    if (!titulo || !anio) {
      throw new AppError("titulo y anio son obligatorios", 400);
    }

    // Buscar o crear director y género en una transacción
    const pelicula = await prisma.$transaction(async (tx) => {
      let directorId = null;
      if (director) {
        const directorRecord = await tx.director.upsert({
          where: { nombre: director },
          update: {},
          create: { nombre: director },
        });
        directorId = directorRecord.id;
      }

      let generoId = null;
      if (genero) {
        const generoRecord = await tx.genero.findFirst({
          where: {
            OR: [
              { slug: genero.toLowerCase() },
              { nombre: { equals: genero, mode: "insensitive" } },
            ],
          },
        });
        generoId = generoRecord?.id || null;
      }

      return tx.pelicula.create({
        data: {
          titulo,
          anio: Number(anio),
          nota: nota ? Number(nota) : null,
          destacada: parseBoolean(destacada) ?? false,
          directorId,
          generoId,
        },
        include: {
          director: true,
          genero: true,
        },
      });
    });

    res.status(201).json(pelicula);
  } catch (err) {
    next(err);
  }
};

// PUT /api/peliculas/:id
const actualizarPelicula = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { titulo, anio, nota, destacada, directorId, generoId } = req.body;

    const existe = await prisma.pelicula.findUnique({ where: { id } });
    if (!existe) {
      throw new AppError("Película no encontrada", 404);
    }

    const pelicula = await prisma.pelicula.update({
      where: { id },
      data: {
        titulo,
        anio: anio ? Number(anio) : undefined,
        nota: nota !== undefined ? (nota ? Number(nota) : null) : undefined,
        destacada: parseBoolean(destacada),
        directorId: directorId ? Number(directorId) : undefined,
        generoId: generoId ? Number(generoId) : undefined,
      },
      include: { director: true, genero: true },
    });

    res.json(pelicula);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/peliculas/:id
const eliminarPelicula = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const existe = await prisma.pelicula.findUnique({ where: { id } });
    if (!existe) {
      throw new AppError("Película no encontrada", 404);
    }

    await prisma.pelicula.delete({ where: { id } });

    res.json({ ok: true, mensaje: "Película eliminada" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listarPeliculas,
  obtenerPelicula,
  crearPelicula,
  actualizarPelicula,
  eliminarPelicula,
};
