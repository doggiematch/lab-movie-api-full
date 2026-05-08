const request = require("supertest");
const app = require("../../index");
const { createUser, createMovie } = require("./helpers");

describe("Favorites", () => {
  describe("POST /api/favoritos/:peliculaId", () => {
    it("adds a movie to favorites (201)", async () => {
      const { token } = await createUser();
      const movie = await createMovie();

      const res = await request(app)
        .post(`/api/favoritos/${movie.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("ok", true);
      expect(res.body.favorito).toHaveProperty("pelicula_id", movie.id);
    });

    it("returns 401 without a token", async () => {
      const movie = await createMovie();

      const res = await request(app).post(`/api/favoritos/${movie.id}`);

      expect(res.status).toBe(401);
    });

    it("returns 404 if the movie does not exist", async () => {
      const { token } = await createUser();

      const res = await request(app)
        .post("/api/favoritos/99999")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it("returns 409 if the movie is already in favorites", async () => {
      const { token } = await createUser();
      const movie = await createMovie();

      // First request
      await request(app)
        .post(`/api/favoritos/${movie.id}`)
        .set("Authorization", `Bearer ${token}`);

      // Second request should fail
      const res = await request(app)
        .post(`/api/favoritos/${movie.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(409);
    });
  });

  describe("DELETE /api/favoritos/:peliculaId", () => {
    it("removes a movie from favorites (200)", async () => {
      const { token } = await createUser();
      const movie = await createMovie();

      // Add it first
      await request(app)
        .post(`/api/favoritos/${movie.id}`)
        .set("Authorization", `Bearer ${token}`);

      // Then remove it
      const res = await request(app)
        .delete(`/api/favoritos/${movie.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("ok", true);
    });

    it("returns 404 if the favorite does not exist", async () => {
      const { token } = await createUser();
      const movie = await createMovie();

      const res = await request(app)
        .delete(`/api/favoritos/${movie.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/favoritos", () => {
    it("returns the authenticated user's favorites", async () => {
      const { token } = await createUser();
      const movie1 = await createMovie({ titulo: "Movie 1" });
      const movie2 = await createMovie({ titulo: "Movie 2" });

      await request(app)
        .post(`/api/favoritos/${movie1.id}`)
        .set("Authorization", `Bearer ${token}`);

      await request(app)
        .post(`/api/favoritos/${movie2.id}`)
        .set("Authorization", `Bearer ${token}`);

      const res = await request(app)
        .get("/api/favoritos")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty("titulo");
    });

    it("does not show another user's favorites", async () => {
      const { token: token1 } = await createUser({ email: "user1@test.com" });
      const { token: token2 } = await createUser({ email: "user2@test.com" });
      const movie = await createMovie();

      await request(app)
        .post(`/api/favoritos/${movie.id}`)
        .set("Authorization", `Bearer ${token1}`);

      const res = await request(app)
        .get("/api/favoritos")
        .set("Authorization", `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });
});
