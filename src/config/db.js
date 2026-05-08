const { Pool } = require("pg");

const isTest = process.env.NODE_ENV === "test";

const ensureSafeTestUrl = (connectionString) => {
  if (!connectionString) {
    throw new Error(
      "TEST_DATABASE_URL is required when NODE_ENV=test. Refusing to use the main database for tests.",
    );
  }

  if (!connectionString.toLowerCase().includes("test")) {
    throw new Error(
      "TEST_DATABASE_URL must point to a test database. Refusing to run tests against a database URL without 'test'.",
    );
  }
};

const buildPoolConfig = () => {
  if (isTest) {
    ensureSafeTestUrl(process.env.TEST_DATABASE_URL);
    return { connectionString: process.env.TEST_DATABASE_URL };
  }

  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }

  return {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };
};

const pool = new Pool(buildPoolConfig());

module.exports = pool;
