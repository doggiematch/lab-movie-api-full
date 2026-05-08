jest.mock("../config/prisma", () => ({
  pelicula: {
    findUnique: jest.fn(),
  },
  favorito: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
}));

const prisma = require("../config/prisma");
const {
  anadirFavorito,
  listarFavoritos,
} = require("../controllers/favoritosController");

describe("favoritosController with mocks", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("anadirFavorito sends unexpected errors to next", async () => {
    const error = new Error("Database error");

    prisma.pelicula.findUnique.mockResolvedValue({ id: 1 });
    prisma.favorito.create.mockRejectedValue(error);

    const req = {
      params: { peliculaId: "1" },
      usuario: { id: 1 },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await anadirFavorito(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  test("listarFavoritos sends query errors to next", async () => {
    const error = new Error("Error listing favorites");

    prisma.favorito.findMany.mockRejectedValue(error);

    const req = {
      usuario: { id: 1 },
    };
    const res = {
      json: jest.fn(),
    };
    const next = jest.fn();

    await listarFavoritos(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
