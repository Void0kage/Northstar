const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./openapi.json');

const app = express();
app.use(express.json());

// ---------- DOCUMENTATION ----------
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

// ---------- DATABASE ----------
// Uses DB_PATH environment variable (for tests), otherwise defaults to data.db
const db = new DatabaseSync(process.env.DB_PATH || 'data.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT    NOT NULL,
    done  INTEGER NOT NULL DEFAULT 0
  )
`);

function rowToTask(row) {
  return {
    id: row.id,
    title: row.title,
    done: Boolean(row.done),
  };
}

// ---------- AUTHENTICATION ----------
const API_SECRET = 'super-secret-token-123';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // We expect the header to look exactly like: "Bearer super-secret-token-123"
  if (authHeader === `Bearer ${API_SECRET}`) {
    next(); // Token is good! Let them through to the route.
  } else {
    res.status(401).json({ error: 'Unauthorized: missing or invalid token' });
  }
}

// ---------- ROUTES ----------
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/tasks', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks ORDER BY id').all();
  res.json(rows.map(rowToTask));
});

app.post('/tasks', requireAuth, (req, res) => {
  const title = req.body.title;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title is required' });
  }

  const result = db.prepare('INSERT INTO tasks (title) VALUES (?)').run(title);
  const row = db
    .prepare('SELECT * FROM tasks WHERE id = ?')
    .get(result.lastInsertRowid);

  res.status(201).json(rowToTask(row));
});

app.patch('/tasks/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Task ' + id + ' not found' });
  }

  const done = req.body.done;
  if (typeof done !== 'boolean') {
    return res.status(400).json({ error: 'done must be true or false' });
  }

  db.prepare('UPDATE tasks SET done = ? WHERE id = ?').run(done ? 1 : 0, id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(rowToTask(updated));
});

app.delete('/tasks/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Task ' + id + ' not found' });
  }
  res.status(204).end();
});

// ---------- ERROR HANDLING ----------

// 404: any request that matched no route above
app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

// central error handler — the 4 arguments are how Express recognizes it
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }

  const status = err.status ?? 500;
  if (status >= 500) console.error(err); // log real bugs, hide them from clients
  res.status(status).json({ error: err.message ?? 'Internal server error' });
});

// ---------- START ----------
const PORT = 3000;

// Only start the server if this file is run directly (not imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
  });
}

// Export the app for automated tests
module.exports = app;