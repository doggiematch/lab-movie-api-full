jest.mock("../config/db", () => ({
  query: jest.fn(),
}));

jest.mock("../utils/verificarPelicula", () => jest.fn());

const pool = require("../config/db");
const verificarPeliculaExiste = require("../utils/verificarPelicula");
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

    verificarPeliculaExiste.mockResolvedValue({ id: 1 });
    pool.query.mockRejectedValue(error);

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

    pool.query.mockRejectedValue(error);

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
