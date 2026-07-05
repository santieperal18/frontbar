import pg from "pg";

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

if (!connectionString) {
  console.error("Falta DATABASE_URL o DATABASE_PUBLIC_URL para cargar productos.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false }
});

const categorias = [
  { nombre: "Promos", tipo: "comida", descripcion: "Promociones vigentes del salon" },
  { nombre: "Desayuno", tipo: "desayuno", descripcion: "Desayunos, cafe y meriendas" },
  { nombre: "Bebidas", tipo: "bebida", descripcion: "Bebidas frias y calientes" },
  { nombre: "Menu", tipo: "comida", descripcion: "Platos principales y menu del dia" },
  { nombre: "Sandwichs", tipo: "comida", descripcion: "Sandwichs y opciones rapidas" },
  { nombre: "Pizzas", tipo: "comida", descripcion: "Pizzas de salon" }
];

const productos = [
  {
    categoria: "Promos",
    nombre: "2 Licuados + Tostado",
    precioSalon: 14000,
    descripcion: "Promo hoy"
  },
  {
    categoria: "Desayuno",
    nombre: "Desayuno Simple",
    precioSalon: 4300,
    descripcion: "Cafe, te o mate con 2 medialunas o 2 criollos"
  },
  {
    categoria: "Desayuno",
    nombre: "Desayuno Completo",
    precioSalon: 5000,
    descripcion: "Cafe, te o mate con 2 medialunas, 2 criollos, tostadas y untables"
  },
  {
    categoria: "Desayuno",
    nombre: "Desayuno Light",
    precioSalon: 5200,
    descripcion: "Cafe, te o mate con tostadas de pan integral, queso, mermeladas y jugo natural"
  },
  {
    categoria: "Desayuno",
    nombre: "Campestre",
    precioSalon: 7000,
    descripcion: "Cafe, te o mate con tostadas de pan de campo, jamon, queso, huevo, jugo natural y untables"
  },
  { categoria: "Desayuno", nombre: "Cafe", precioSalon: 3000, descripcion: "Cafe" },
  { categoria: "Desayuno", nombre: "Jarro", precioSalon: 2700, descripcion: "Cafe en jarro" },
  { categoria: "Desayuno", nombre: "Pocillo", precioSalon: 2600, descripcion: "Cafe en pocillo" },
  { categoria: "Desayuno", nombre: "Submarino", precioSalon: 3500, descripcion: "Submarino" },
  { categoria: "Desayuno", nombre: "Licuado", precioSalon: 5000, descripcion: "Licuado" },
  { categoria: "Desayuno", nombre: "Cafe + Tostado", precioSalon: 7000, descripcion: "Cafe con tostado" },
  { categoria: "Bebidas", nombre: "Gaseosa 500 ml", precioSalon: 3500, descripcion: "Gaseosa 500 ml" },
  { categoria: "Bebidas", nombre: "Gaseosa 1 L", precioSalon: 6600, descripcion: "Gaseosa 1 litro" },
  { categoria: "Bebidas", nombre: "Agua 500 ml", precioSalon: 2000, descripcion: "Agua 500 ml" },
  { categoria: "Bebidas", nombre: "Agua Saborizada 500 ml", precioSalon: 2500, descripcion: "Agua saborizada 500 ml" },
  { categoria: "Bebidas", nombre: "Agua Saborizada 1 1/2 L", precioSalon: 5500, descripcion: "Agua saborizada 1 1/2 L" },
  {
    categoria: "Menu",
    nombre: "Milanesa c/n Guarnicion",
    precioSalon: 8000,
    descripcion: "Con papas fritas, fideos, arroz, pure mixto o ensaladas"
  },
  {
    categoria: "Menu",
    nombre: "Napolitana c/n Guarnicion",
    precioSalon: 8500,
    descripcion: "Con papas fritas, fideos, arroz, pure mixto o ensaladas"
  },
  {
    categoria: "Menu",
    nombre: "Costeleta c/n Guarnicion",
    precioSalon: 8000,
    descripcion: "Con papas fritas, fideos, arroz, pure mixto o ensaladas"
  },
  {
    categoria: "Menu",
    nombre: "Ravioles o Fideos",
    precioSalon: 7500,
    descripcion: "Con salsa bolognesa o salsa blanca"
  },
  {
    categoria: "Menu",
    nombre: "Tartas c/n Guarnicion",
    precioSalon: 7500,
    descripcion: "Con papas fritas, fideos, arroz, pure mixto o ensaladas"
  },
  { categoria: "Menu", nombre: "Menu del Dia", precioSalon: 7800, descripcion: "Menu del dia" },
  { categoria: "Sandwichs", nombre: "Sandwich de Milanesa", precioSalon: 7800, descripcion: "Con papas fritas" },
  { categoria: "Sandwichs", nombre: "Lomito", precioSalon: 9000, descripcion: "Con papas fritas" },
  { categoria: "Sandwichs", nombre: "Tostado", precioSalon: 5000, descripcion: "Con papas fritas" },
  { categoria: "Sandwichs", nombre: "Hamburguesa", precioSalon: 8000, descripcion: "Hamburguesa" },
  { categoria: "Pizzas", nombre: "Pizza Muzza", precioSalon: 10500, descripcion: "Pizza muzzarella" },
  { categoria: "Pizzas", nombre: "Pizza Especial", precioSalon: 12500, descripcion: "Pizza especial" }
];

async function getRestauranteId() {
  const slug = process.env.DEFAULT_RESTAURANT_SLUG || "la-esquina";
  const existing = await client.query("SELECT id FROM restaurante WHERE slug = $1 LIMIT 1", [slug]);
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const created = await client.query(
    "INSERT INTO restaurante (nombre, slug, activo) VALUES ($1, $2, true) RETURNING id",
    [process.env.DEFAULT_RESTAURANT_NAME || "La Esquina", slug]
  );
  return created.rows[0].id;
}

async function upsertCategoria(restauranteId, categoria) {
  const existing = await client.query(
    "SELECT id FROM categoria WHERE restaurante_id = $1 AND LOWER(nombre) = LOWER($2) LIMIT 1",
    [restauranteId, categoria.nombre]
  );

  if (existing.rows[0]) {
    await client.query(
      "UPDATE categoria SET tipo = $1, descripcion = $2 WHERE id = $3",
      [categoria.tipo, categoria.descripcion, existing.rows[0].id]
    );
    return existing.rows[0].id;
  }

  const created = await client.query(
    "INSERT INTO categoria (nombre, tipo, descripcion, restaurante_id) VALUES ($1, $2, $3, $4) RETURNING id",
    [categoria.nombre, categoria.tipo, categoria.descripcion, restauranteId]
  );
  return created.rows[0].id;
}

async function upsertProducto(restauranteId, producto, idCategoria) {
  const precio = Number(producto.precioSalon);
  const existing = await client.query(
    "SELECT id FROM producto WHERE restaurante_id = $1 AND LOWER(nombre) = LOWER($2) LIMIT 1",
    [restauranteId, producto.nombre]
  );

  const values = [
    producto.nombre,
    producto.descripcion,
    precio,
    precio,
    precio,
    0,
    idCategoria,
    true,
    false,
    0,
    restauranteId
  ];

  if (existing.rows[0]) {
    await client.query(
      `UPDATE producto
       SET nombre = $1,
           descripcion = $2,
           precio = $3,
           precio_salon = $4,
           precio_mostrador = $5,
           costo = $6,
           id_categoria = $7,
           disponible = $8,
           controla_stock = $9,
           stock_actual = $10
       WHERE id = $11 AND restaurante_id = $12`,
      [...values.slice(0, 10), existing.rows[0].id, restauranteId]
    );
    return { action: "updated", nombre: producto.nombre };
  }

  await client.query(
    `INSERT INTO producto (
      nombre, descripcion, precio, precio_salon, precio_mostrador, costo,
      id_categoria, disponible, controla_stock, stock_actual, restaurante_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    values
  );
  return { action: "created", nombre: producto.nombre };
}

try {
  await client.connect();
  await client.query("BEGIN");

  const restauranteId = await getRestauranteId();
  const categoriaIds = new Map();

  for (const categoria of categorias) {
    const id = await upsertCategoria(restauranteId, categoria);
    categoriaIds.set(categoria.nombre, id);
  }

  const result = { created: 0, updated: 0, productos: [] };
  for (const producto of productos) {
    const output = await upsertProducto(restauranteId, producto, categoriaIds.get(producto.categoria));
    result[output.action] += 1;
    result.productos.push(output);
  }

  await client.query("COMMIT");
  console.log(JSON.stringify({ restauranteId, ...result }, null, 2));
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Error cargando productos:", error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
