require("dotenv").config({ path: ".env.test", override: true });
const pool = require("../config/db");

const assertSafeTestDatabase = () => {
  const testUrl = process.env.TEST_DATABASE_URL;

  if (!testUrl) {
    throw new Error(
      "TEST_DATABASE_URL is required to run tests. Create .env.test from .env.test.example.",
    );
  }

  if (!testUrl.toLowerCase().includes("test")) {
    throw new Error(
      "TEST_DATABASE_URL must contain 'test'. Refusing to clean a non-test database.",
    );
  }
};

beforeEach(async () => {
  assertSafeTestDatabase();

  await pool.query(`
    TRUNCATE TABLE
      favoritos,
      resenas,
      peliculas,
      usuarios,
      directores,
      generos
    RESTART IDENTITY CASCADE
  `);
});

afterAll(async () => {
  const prisma = require("../config/prisma");

  if (typeof prisma.$disconnect === "function") {
    await prisma.$disconnect();
  }

  await pool.end();
});
