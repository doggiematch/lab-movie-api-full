-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('usuario', 'admin');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'usuario',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directores" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,

    CONSTRAINT "directores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,

    CONSTRAINT "generos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peliculas" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "anio" INTEGER,
    "nota" DECIMAL(3,1),
    "director_id" INTEGER,
    "genero_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "peliculas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resenas" (
    "id" SERIAL NOT NULL,
    "pelicula_id" INTEGER NOT NULL,
    "autor" VARCHAR(100) NOT NULL,
    "texto" TEXT NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resenas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favoritos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "pelicula_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoritos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "directores_nombre_key" ON "directores"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "generos_slug_key" ON "generos"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "favoritos_usuario_id_pelicula_id_key" ON "favoritos"("usuario_id", "pelicula_id");

-- AddForeignKey
ALTER TABLE "peliculas" ADD CONSTRAINT "peliculas_director_id_fkey" FOREIGN KEY ("director_id") REFERENCES "directores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peliculas" ADD CONSTRAINT "peliculas_genero_id_fkey" FOREIGN KEY ("genero_id") REFERENCES "generos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_pelicula_id_fkey" FOREIGN KEY ("pelicula_id") REFERENCES "peliculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_pelicula_id_fkey" FOREIGN KEY ("pelicula_id") REFERENCES "peliculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
