const express = require('express');
const { Pool } = require('pg');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./openapi.json');
const cors = require('cors');

const app = express();
app.use(cors()); // Allows your phone, PC, or AI to connect from anywhere
app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

// Connect to Neon (Postgres)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for cloud databases
});

function rowToTask(row) {
  return {
    id: row.id,
    title: row.title,
    done: Boolean(row.done),
  };
}

// ---------- ROUTES ----------
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/tasks', async (req, res) => {
  const result = await pool.query('SELECT * FROM tasks ORDER BY id');
  res.json(result.rows.map(rowToTask));
});

app.post('/tasks', async (req, res) => {
  const title = req.body.title;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title is required' });
  }

  const result = await pool.query(
    'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
    [title]
  );
  res.status(201).json(rowToTask(result.rows[0]));
});

app.patch('/tasks/:id', async (req, res) => {
  const id = Number(req.params.id);
  
  const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'Task ' + id + ' not found' });
  }

  const done = req.body.done;
  if (typeof done !== 'boolean') {
    return res.status(400).json({ error: 'done must be true or false' });
  }

  const updated = await pool.query(
    'UPDATE tasks SET done = $1 WHERE id = $2 RETURNING *',
    [done, id]
  );
  res.json(rowToTask(updated.rows[0]));
});

app.delete('/tasks/:id', async (req, res) => {
  const id = Number(req.params.id);
  const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  
  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Task ' + id + ' not found' });
  }
  res.status(204).end();
});

// Create table on startup
pool.query(`
  CREATE TABLE IF NOT EXISTS tasks (
    id    SERIAL PRIMARY KEY,
    title TEXT    NOT NULL,
    done  BOOLEAN NOT NULL DEFAULT false
  )
`).catch(console.error);

// ---------- ERROR HANDLING ----------
app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message ?? 'Internal server error' });
});

// ---------- START ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

module.exports = app;