const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const isTest = process.env.NODE_ENV === "test";

const getConnectionString = () => {
  if (isTest) {
    const testUrl = process.env.TEST_DATABASE_URL;

    if (!testUrl) {
      throw new Error(
        "TEST_DATABASE_URL is required when NODE_ENV=test. Refusing to use the main database for tests.",
      );
    }

    if (!testUrl.toLowerCase().includes("test")) {
      throw new Error(
        "TEST_DATABASE_URL must point to a test database. Refusing to run tests against a database URL without 'test'.",
      );
    }

    return testUrl;
  }

  return process.env.DATABASE_URL;
};

const adapter = new PrismaPg({
  connectionString: getConnectionString(),
});

const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "warn", "error"]
      : ["error"],
});

module.exports = prisma;
