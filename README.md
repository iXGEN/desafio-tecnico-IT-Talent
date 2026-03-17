# Product Stock API

API REST simplificada para consultar productos y descontar stock de forma segura ante escenarios de concurrencia, con limitación de peticiones sobre el endpoint de descuento.

## Stack

- `Node.js`
- `NestJS`
- `PostgreSQL`
- `Prisma`
- `Jest`
- `Supertest`

## Endpoints

- `GET /api/v1`
- `GET /api/v1/products/:id`
- `POST /api/v1/products/:id/decrease`

Ejemplo de cuerpo de la solicitud para descuento:

```json
{
  "amount": 2
}
```

## Prerrequisitos

- `Node.js` 20 o superior
- `npm`
- `Docker Desktop` instalado y en ejecución si se desea levantar PostgreSQL con `docker compose`
- Alternativamente, una instancia local de `PostgreSQL` disponible y accesible desde `DATABASE_URL`

Para validar Docker:

```bash
docker info
```

Si ese comando falla con un error del daemon, es necesario iniciar Docker Desktop antes de ejecutar `docker compose up -d`.

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto con:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stock_db?schema=public"
PORT=3000
```

`PORT` es opcional. Si no se define, la API se iniciará en `3000`.

## Levantar el entorno

1. Instalar dependencias:

```bash
npm install
```

2. Levantar PostgreSQL:

```bash
docker compose up -d
```

Si necesita reiniciar la base de datos desde cero, utilice:

```bash
docker compose down -v
docker compose up -d
```

El comando `docker compose down` detiene los contenedores, pero conserva los datos. La opción `-v` elimina también el volumen persistente de PostgreSQL.

3. Aplicar migraciones:

```bash
npx prisma migrate deploy
```

4. Crear un producto de prueba:

Si utiliza PostgreSQL levantado con `docker compose`, puede insertar un registro con el siguiente comando:

```bash
docker exec -i stock-api-db psql -U postgres -d stock_db -c "INSERT INTO products (name, stock, \"createdAt\", \"updatedAt\") VALUES ('Keyboard', 10, NOW(), NOW());"
```

Si utiliza una instancia local de PostgreSQL fuera de Docker, inserte un producto equivalente con el cliente SQL de su preferencia.

5. Levantar la API:

```bash
npm run start:dev
```

La aplicación queda disponible en `http://localhost:3000/api/v1`.

La ruta base `GET /api/v1` devuelve un resumen simple de la API y los endpoints disponibles.

## Probar los endpoints

Preparar un producto de prueba:

```bash
docker exec -i stock-api-db psql -U postgres -d stock_db -c "INSERT INTO products (name, stock, \"createdAt\", \"updatedAt\") VALUES ('Keyboard', 10, NOW(), NOW());"
```

Si el producto ya existe y solo desea ajustar el stock antes de una prueba, puede utilizar alguno de los siguientes comandos.

Consultar un producto:

```bash
curl http://localhost:3000/api/v1/products/1
```

Nota: si no se ha cargado previamente un producto, la API responderá `404 Product with id 1 not found`.

Descontar stock:

```bash
curl -X POST http://localhost:3000/api/v1/products/1/decrease \
  -H "Content-Type: application/json" \
  -d '{"amount": 1}'
```

Probar concurrencia sobre el mismo recurso:

Preparar `stock = 1`:

```bash
docker exec -i stock-api-db psql -U postgres -d stock_db -c "UPDATE products SET stock = 1, \"updatedAt\" = NOW() WHERE id = 1;"
```

Ejecutar la prueba:

```bash
(
  curl -s -X POST http://localhost:3000/api/v1/products/1/decrease -H "Content-Type: application/json" -d '{"amount": 1}' &
  curl -s -X POST http://localhost:3000/api/v1/products/1/decrease -H "Content-Type: application/json" -d '{"amount": 1}' &
  wait
)
```

Probar la limitación de solicitudes por minuto:

Preparar `stock = 20`:

```bash
docker exec -i stock-api-db psql -U postgres -d stock_db -c "UPDATE products SET stock = 20, \"updatedAt\" = NOW() WHERE id = 1;"
```

Ejecutar la prueba:

```bash
for i in {1..11}; do
  curl -s -o /dev/null -w "Solicitud $i -> %{http_code}\n" \
    -X POST http://localhost:3000/api/v1/products/1/decrease \
    -H "Content-Type: application/json" \
    -d '{"amount": 1}';
done
```

## Decisiones técnicas

- La arquitectura está separada en capas: `controller`, `service` y `repository`.
- La integridad del stock se protege en base de datos con un `UPDATE ... WHERE stock >= amount`, evitando stock negativo ante requests simultáneas.
- El endpoint `POST /products/:id/decrease` tiene una limitación de `10` solicitudes por minuto.

## Tests

Ejecutar todos los tests unitarios:

```bash
npm test
```

Ejecutar los tests unitarios del flujo crítico incorporado:

```bash
npm test -- products.service.spec.ts decrease-stock.dto.spec.ts
```

Ejecutar todos los tests end-to-end:

```bash
npm run test:e2e
```

Ejecutar los tests end-to-end del flujo crítico incorporado:

```bash
npm run test:e2e -- products.e2e-spec.ts
```

Cobertura de los tests incorporados:

- `src/products/products.service.spec.ts`: descuento exitoso, producto inexistente y stock insuficiente.
- `src/products/dto/decrease-stock.dto.spec.ts`: validación de `amount` como entero positivo.
- `test/products.e2e-spec.ts`: concurrencia sobre el mismo producto y límite de `10` requests por minuto.
