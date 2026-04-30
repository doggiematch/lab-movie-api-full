![logo_ironhack_blue 7](https://user-images.githubusercontent.com/23629340/40541063-a07a0a8a-601a-11e8-91b5-2f13e4e6b441.png)

# Lab | API de Películas Completa

## Objetivo

Integrar todo lo aprendido durante la semana en una API de producción: autenticación JWT, base de datos relacional con Prisma, tests con Jest/Supertest, documentación con Postman y un endpoint especial para integración con IA. El proyecto es evaluado como entrega de semana.

## Requisitos previos

- Haber completado los labs D1–D4 de w7
- PostgreSQL en marcha
- Postman instalado (para documentación)
- Node.js v18+

## Lo que vas a entregar

Una API REST completa con las siguientes características:

```shell
Autenticación
  POST /api/auth/registro
  POST /api/auth/login
  GET  /api/auth/perfil          ← Protegido

Películas (con Prisma)
  GET    /api/peliculas          ← Pública, con filtros y paginación
  GET    /api/peliculas/:id      ← Pública, con reseñas incluidas
  POST   /api/peliculas          ← Protegido (usuario autenticado)
  PUT    /api/peliculas/:id      ← Protegido (solo admin)
  DELETE /api/peliculas/:id      ← Protegido (solo admin)

Reseñas
  GET    /api/peliculas/:id/resenas
  POST   /api/peliculas/:id/resenas  ← Protegido

Favoritos
  GET    /api/favoritos          ← Protegido
  POST   /api/favoritos/:id      ← Protegido
  DELETE /api/favoritos/:id      ← Protegido

Estadísticas
  GET    /api/estadisticas/directores
  GET    /api/estadisticas/generos

Endpoint IA
  POST   /api/ia/recomendar      ← Devuelve recomendaciones en formato especial
```

## Parte 1: Checklist de integración

Antes de añadir las partes nuevas, verifica que todo lo anterior funciona.

### Paso 1: Smoke test de endpoints existentes

Ejecuta cada uno de los siguientes y confirma que responden correctamente:

```bash
# Auth
curl -X POST http://localhost:3000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Admin", "email": "admin@cine.com", "password": "admin123", "rol": "admin"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@cine.com", "password": "admin123"}'

# Guarda el token
TOKEN="<pega el token aquí>"

# Películas
curl http://localhost:3000/api/peliculas
curl http://localhost:3000/api/peliculas?genero=drama
curl http://localhost:3000/api/peliculas/1
```

### Paso 2: Verificar el schema de Prisma

```bash
npx prisma migrate status
```

Debe mostrar todas las migraciones como "Applied".

### Paso 3: Ejecutar los tests

```bash
NODE_ENV=test npm test
```

Todos los tests deben pasar en verde antes de continuar.

## Parte 2: Endpoint de recomendaciones para IA

Este endpoint devuelve los datos en un formato estructurado que puede consumir un LLM (Large Language Model) como Claude o ChatGPT para generar recomendaciones personalizadas.

### Paso 4: Schema de la petición y respuesta

El endpoint `POST /api/ia/recomendar` recibe:

```json
{
  "generos": ["ciencia-ficcion", "drama"],
  "nota_minima": 7.5,
  "excluir_ids": [1, 3],
  "limite": 5
}
```

Y devuelve:

```json
{
  "contexto": "Tienes 12 películas en tu sistema.",
  "peliculas": [
    {
      "id": 2,
      "titulo": "Arrival",
      "anio": 2016,
      "nota": 7.9,
      "director": "Denis Villeneuve",
      "genero": "ciencia-ficcion",
      "num_resenas": 3,
      "media_usuarios": 8.7
    }
  ],
  "metadata": {
    "total_encontradas": 5,
    "filtros_aplicados": {
      "generos": ["ciencia-ficcion", "drama"],
      "nota_minima": 7.5,
      "excluidas": 2
    }
  }
}
```

### Paso 5: Implementar el controlador de IA

Crea `src/controllers/iaController.js`:

```javascript
const prisma = require('../config/prisma')
const AppError = require('../utils/AppError')

// POST /api/ia/recomendar
const recomendar = async (req, res, next) => {
  try {
    const {
      generos = [],
      nota_minima = 0,
      excluir_ids = [],
      limite = 10
    } = req.body

    // Construir los filtros de Prisma
    const where = {
      nota: { gte: nota_minima },
      id: { notIn: excluir_ids.map(Number) }
    }

    if (generos.length > 0) {
      where.genero = {
        slug: { in: generos }
      }
    }

    const [peliculas, totalSistema] = await prisma.$transaction([
      prisma.pelicula.findMany({
        where,
        include: {
          director: { select: { nombre: true } },
          genero: { select: { nombre: true, slug: true } },
          resenas: {
            select: { puntuacion: true }
          }
        },
        orderBy: { nota: 'desc' },
        take: Number(limite)
      }),
      prisma.pelicula.count()
    ])

    // Calcular media de usuarios para cada película
    const peliculasFormateadas = peliculas.map(p => {
      const mediaUsuarios = p.resenas.length > 0
        ? p.resenas.reduce((acc, r) => acc + r.puntuacion, 0) / p.resenas.length
        : null

      return {
        id: p.id,
        titulo: p.titulo,
        anio: p.anio,
        nota: p.nota ? Number(p.nota) : null,
        director: p.director?.nombre || null,
        genero: p.genero?.slug || null,
        num_resenas: p.resenas.length,
        media_usuarios: mediaUsuarios ? Number(mediaUsuarios.toFixed(2)) : null
      }
    })

    res.json({
      contexto: `Tienes ${totalSistema} películas en tu sistema.`,
      peliculas: peliculasFormateadas,
      metadata: {
        total_encontradas: peliculasFormateadas.length,
        filtros_aplicados: {
          generos: generos.length > 0 ? generos : 'todos',
          nota_minima,
          excluidas: excluir_ids.length
        }
      }
    })

  } catch (err) {
    next(err)
  }
}

module.exports = { recomendar }
```

### Paso 6: Crear la ruta de IA

Crea `src/routes/ia.js`:

```javascript
const { Router } = require('express')
const router = Router()
const { recomendar } = require('../controllers/iaController')

// Endpoint público — sin autenticación para que una IA externa pueda consultarlo
router.post('/recomendar', recomendar)

module.exports = router
```

Monta en `index.js`:

```javascript
const iaRouter = require('./src/routes/ia')
app.use('/api/ia', iaRouter)
```

### Paso 7: Probar el endpoint de IA

```bash
curl -X POST http://localhost:3000/api/ia/recomendar \
  -H "Content-Type: application/json" \
  -d '{
    "generos": ["ciencia-ficcion"],
    "nota_minima": 7.5,
    "limite": 3
  }'
```

## Parte 3: Tests del endpoint de IA

### Paso 8: Escribir tests para el endpoint de IA

Crea `src/__tests__/ia.test.js`:

```javascript
const request = require('supertest')
const app = require('../../index')
const { crearPelicula } = require('./helpers')

describe('POST /api/ia/recomendar', () => {

  beforeEach(async () => {
    await crearPelicula({ titulo: 'Film A', nota: 8.5 })
    await crearPelicula({ titulo: 'Film B', nota: 6.0 })
    await crearPelicula({ titulo: 'Film C', nota: 9.0 })
  })

  it('debe devolver películas con la estructura correcta', async () => {
    const res = await request(app)
      .post('/api/ia/recomendar')
      .send({})

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('contexto')
    expect(res.body).toHaveProperty('peliculas')
    expect(res.body).toHaveProperty('metadata')
    expect(Array.isArray(res.body.peliculas)).toBe(true)
  })

  it('debe filtrar por nota mínima', async () => {
    const res = await request(app)
      .post('/api/ia/recomendar')
      .send({ nota_minima: 8.0 })

    expect(res.status).toBe(200)
    res.body.peliculas.forEach(p => {
      expect(Number(p.nota)).toBeGreaterThanOrEqual(8.0)
    })
  })

  it('debe respetar el campo excluir_ids', async () => {
    // Primero obtener IDs
    const lista = await request(app).get('/api/peliculas?limit=100')
    const primerID = lista.body.data[0]?.id

    if (primerID) {
      const res = await request(app)
        .post('/api/ia/recomendar')
        .send({ excluir_ids: [primerID] })

      const ids = res.body.peliculas.map(p => p.id)
      expect(ids).not.toContain(primerID)
    }
  })

  it('debe respetar el límite de resultados', async () => {
    const res = await request(app)
      .post('/api/ia/recomendar')
      .send({ limite: 1 })

    expect(res.body.peliculas.length).toBeLessThanOrEqual(1)
  })
})
```

## Parte 4: Documentación con Postman

### Paso 9: Crear la colección de Postman

1. Abre Postman y crea una nueva colección llamada `"API Películas — Semana 7"`
2. Añade una variable de colección `baseUrl` con valor `http://localhost:3000`
3. Añade una variable `token` (vacía por ahora)

Crea las siguientes carpetas dentro de la colección:

**Carpeta: Auth**
- `POST {{baseUrl}}/api/auth/registro` — con body de ejemplo
- `POST {{baseUrl}}/api/auth/login` — con un **Post-response script** que guarda el token:
  ```javascript
  const res = pm.response.json()
  if (res.token) {
    pm.collectionVariables.set('token', res.token)
  }
  ```
- `GET {{baseUrl}}/api/auth/perfil` — con header `Authorization: Bearer {{token}}`

**Carpeta: Películas**
- Todos los endpoints con ejemplos de request/response
- Añade descripciones en cada request

**Carpeta: IA**
- `POST {{baseUrl}}/api/ia/recomendar` con varios ejemplos de filtros

### Paso 10: Exportar la colección

Exporta la colección como `peliculas-api.postman_collection.json` y guárdala en la raíz del proyecto. Esta es parte de la entrega.

## Parte 5: Estructura final del proyecto

Tu proyecto debe tener esta estructura:

```shell
api-peliculas/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js                  ← (bonus)
├── src/
│   ├── config/
│   │   ├── db.js                ← Pool pg (para compatibilidad o eliminar)
│   │   └── prisma.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── peliculasPrismaController.js
│   │   ├── favoritosController.js
│   │   ├── iaController.js
│   │   └── estadisticasController.js
│   ├── middleware/
│   │   ├── verificarToken.js
│   │   ├── verificarRol.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── peliculas.js
│   │   ├── favoritos.js
│   │   ├── estadisticas.js
│   │   └── ia.js
│   ├── utils/
│   │   ├── AppError.js
│   │   └── verificarPelicula.js
│   └── __tests__/
│       ├── setup.js
│       ├── helpers.js
│       ├── auth.test.js
│       ├── peliculas.test.js
│       ├── favoritos.test.js
│       └── ia.test.js
├── .env
├── .gitignore
├── index.js
├── package.json
├── peliculas-api.postman_collection.json
└── NOTAS.md
```

## Parte 6: Reflexión final

Escribe en `NOTAS.md` una reflexión sobre la semana respondiendo:

1. **¿Qué parte del proyecto te resultó más difícil y por qué?**
2. **¿Qué cambiarías si tuvieras que hacer este proyecto de nuevo desde cero?**
3. **¿Cómo escalarías esta API si necesitase soportar 10.000 usuarios concurrentes?** (piensa en caché, índices, horizontal scaling, etc.)
4. **¿Qué ventaja real te ha dado TDD en este proyecto?** ¿Hubo algún caso donde el test te hizo detectar un bug antes de probarlo manualmente?

## Criterios de evaluación

- [ ] `npm test` pasa todos los tests en verde (sin tests vacíos o `.skip`)
- [ ] `POST /api/auth/registro` y `login` funcionan y devuelven JWT válido
- [ ] Rutas protegidas devuelven 401 sin token y 403 con rol insuficiente
- [ ] `GET /api/peliculas` devuelve paginación con `total`, `pagina`, `totalPaginas`
- [ ] `GET /api/peliculas/:id` incluye reseñas y conteo de favoritos
- [ ] `POST /api/peliculas` usa transacción Prisma para crear director si no existe
- [ ] `POST /api/favoritos/:id` devuelve 409 en duplicado
- [ ] `POST /api/ia/recomendar` devuelve la estructura `{ contexto, peliculas, metadata }`
- [ ] La colección de Postman está exportada y en el repositorio
- [ ] El schema de Prisma está correcto y las migraciones aplicadas
- [ ] `NOTAS.md` con las 4 preguntas de reflexión respondidas

## Bonus

1. **Rate limiting**: Instala `express-rate-limit` y aplícalo globalmente (100 req/15min) y de forma más estricta en los endpoints de auth (5 req/15min). Escribe un test que verifique el comportamiento tras superar el límite.
2. **Variables de entorno validadas**: Usa `zod` o un check manual al inicio de `index.js` que lance un error si faltan variables de entorno críticas (`JWT_SECRET`, `DATABASE_URL`). El servidor no debe arrancar si la configuración está incompleta.
3. **CI con GitHub Actions**: Crea `.github/workflows/tests.yml` que ejecute `npm test` en cada push a `main`. El workflow debe arrancar un servicio de PostgreSQL y ejecutar las migraciones antes de correr los tests.