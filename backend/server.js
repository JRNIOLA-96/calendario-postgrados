const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/init-db", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recursos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100),
        tipo VARCHAR(50)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservas (
        id SERIAL PRIMARY KEY,
        aula_id INTEGER,
        equipo_id INTEGER,
        evento VARCHAR(200),
        inicio TIMESTAMP,
        fin TIMESTAMP,
        tipo VARCHAR(50),
        detalles TEXT
      );
    `);

    res.send("DB creada");
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.get("/seed", async (req, res) => {
  try {
    await pool.query(`
      INSERT INTO recursos (nombre, tipo) VALUES
      ('Aula 101', 'aula'),
      ('Aula 102', 'aula'),
      ('Sala de reuniones', 'aula'),
      ('Proyector', 'equipo'),
      ('Laptop', 'equipo'),
      ('Kit multimedia', 'equipo');
    `);

    res.send("Datos insertados correctamente");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al insertar datos");
  }
});

// endpoint recursos
app.get("/recursos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM recursos");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en el servidor");
  }
});

//recibe datos y verifica si hay cruce de horarios
app.post("/reservas", async (req, res) => {
  try {
    const { aula_id, equipo_id, inicio, fin, evento, tipo, detalles } = req.body;

    const result = await pool.query(
      `INSERT INTO reservas 
      (aula_id, equipo_id, inicio, fin, evento, tipo, detalles)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [aula_id, equipo_id, inicio, fin, evento, tipo, detalles]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: "Error al crear reserva" });
  }
});

app.post("/reservas", async (req, res) => {
  try {
    const { aula_id, equipo_id, inicio, fin, tipo, evento, detalles } = req.body;

    console.log("DATOS RECIBIDOS:", req.body); // 🔥 DEBUG

    // tu insert aquí

    res.json({ message: "Reserva creada" });

  } catch (error) {
    console.error("ERROR BACKEND:", error); // 🔥 CLAVE

    res.status(500).json({
      error: "Error al crear reserva",
      detalle: error.message
    });
  }
});

// ✅ MOVER AQUÍ
app.get("/reservas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id,
        r.evento,
        r.inicio,
        r.fin,
        r.tipo,
        r.detalles,
        a.nombre AS aula,
        e.nombre AS equipo
      FROM reservas r
      LEFT JOIN recursos a ON r.aula_id = a.id AND a.tipo = 'aula'
      LEFT JOIN recursos e ON r.equipo_id = e.id AND e.tipo = 'equipo'
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en el servidor");
  }
});

app.get("/recursos", async (req, res) => {
  const result = await pool.query("SELECT * FROM recursos");
  res.json(result.rows);
});

// 👇 SIEMPRE AL FINAL
app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});

console.log("ESTOY USANDO ESTE SERVER");  

