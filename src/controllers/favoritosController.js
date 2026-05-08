const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");

// POST /api/favoritos/:peliculaId
const anadirFavorito = async (req, res, next) => {
  try {
    const peliculaId = Number(req.params.peliculaId);
    const usuarioId = req.usuario.id;

    const pelicula = await prisma.pelicula.findUnique({
      where: { id: peliculaId },
      select: { id: true },
    });

    if (!pelicula) {
      throw new AppError("Pelicula no encontrada", 404);
    }

    const favorito = await prisma.favorito.create({
      data: { usuarioId, peliculaId },
    });

    res.status(201).json({
      ok: true,
      favorito: {
        id: favorito.id,
        usuario_id: favorito.usuarioId,
        pelicula_id: favorito.peliculaId,
        created_at: favorito.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return next(new AppError("Esta pelicula ya esta en tus favoritos", 409));
    }

    next(err);
  }
};

// DELETE /api/favoritos/:peliculaId
const quitarFavorito = async (req, res, next) => {
  try {
    const peliculaId = Number(req.params.peliculaId);
    const usuarioId = req.usuario.id;

    const favorito = await prisma.favorito.findUnique({
      where: { usuarioId_peliculaId: { usuarioId, peliculaId } },
    });

    if (!favorito) {
      throw new AppError("Favorito no encontrado", 404);
    }

    await prisma.favorito.delete({
      where: { usuarioId_peliculaId: { usuarioId, peliculaId } },
    });

    res.json({ ok: true, mensaje: "Eliminado de favoritos" });
  } catch (err) {
    next(err);
  }
};

// GET /api/favoritos
const listarFavoritos = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;

    const favoritos = await prisma.favorito.findMany({
      where: { usuarioId },
      orderBy: { createdAt: "desc" },
      include: {
        pelicula: {
          include: {
            director: { select: { nombre: true } },
            genero: { select: { nombre: true, slug: true } },
          },
        },
      },
    });

    const rows = favoritos.map((favorito) => ({
      id: favorito.pelicula.id,
      titulo: favorito.pelicula.titulo,
      anio: favorito.pelicula.anio,
      nota: favorito.pelicula.nota,
      director: favorito.pelicula.director,
      genero: favorito.pelicula.genero,
      anadido_en: favorito.createdAt,
    }));

    res.json(rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { anadirFavorito, quitarFavorito, listarFavoritos };
