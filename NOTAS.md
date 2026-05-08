## 1. ¿Qué ventajas concretas ofrece Prisma frente a escribir SQL en crudo en este proyecto? Da al menos dos ejemplos específicos.

Te daré 3 razones (2 de ellos, no sé si me estaré expresando bien, tienen que ver con el sistema CRUD). Una de ellas es la comodidad, evito escribir select con tantos join.
Prisma hace que trabajar con la base de datos sea más cómodo y menos propenso a errores. Me evito escribir sql manualmente/en crudo, para crear/actualizar los datos, con prisma es mucho más claro, p.e.: `prisma.usuario.create()`.
La tercera razón es algo más visual. Estoy acostumbrada a trabajar con Access, WYSIWYG, y personalmente, postgre es más complejo y tedioso de manejar que Prisma, con una interfaz más ordenada y fácil de entender las tablas, los datos y sus relaciones.

## 2. ¿Qué hace prisma.$transaction([query1, query2])? ¿En qué se diferencia de prisma.$transaction(async (tx) => { ... })?

`prisma transaction query` ejecuta varias operaciones juntas, en este caso, si todas salen bien, se guardan. Pero si una falla, se cancela todo.
`prisma transaction async` es más flexible, p.e., para buscar un director, decidir si crearlo y luego crear una película usando el resultado anterior.

## 3. ¿Qué archivo NO deberías commitear nunca al repositorio de tu schema de Prisma? ¿Y cuáles sí deben estar en el repositorio?

Como siempre, el archivo `.env`, porque ahí van datos privados como la contraseña de la base de datos, claves secretas (JWT), datos de conexión, y otras variables. Es decir, información sensible y susceptible en cuanto a la seguridad del proyecto.
Sí debería subir schema.prisma, config.ts, las carpetas de migraciones y el código donde uso Prisma, ya que eso le permite a otro desarrollador, p.e. que entienda y reconstruya la estructura del proyecto.
