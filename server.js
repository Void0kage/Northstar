const express = require('express');
const { Pool } = require('pg');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./openapi.json');
const cors = require('cors');

const app = express();
app.use(cors()); // Allows your phone, PC, or AI to connect from anywhere
app.use(express.json());
// ---------- CUSTOM SWAGGER UI THEME (v2 - Ultra Modern) ----------
const customCss = `
  /* Import a clean modern font */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  body, .swagger-ui {
    font-family: 'Inter', sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
    background-color: #0b0f19;
    color: #e2e8f0;
  }

  /* Custom Scrollbar */
  .swagger-ui ::-webkit-scrollbar { width: 8px; height: 8px; }
  .swagger-ui ::-webkit-scrollbar-track { background: #0b0f19; }
  .swagger-ui ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
  .swagger-ui ::-webkit-scrollbar-thumb:hover { background: #334155; }

  /* Topbar Styling */
  .swagger-ui .topbar { 
    background-color: #0f172a; 
    border-bottom: 1px solid #1e293b;
    padding: 10px 0;
  }
  .swagger-ui .topbar .download-url-wrapper { display: none; }
  .swagger-ui .topbar a span { visibility: hidden; }
  .swagger-ui .topbar a span:before { 
    content: "🚀 Northstar API"; 
    visibility: visible; 
    color: #38bdf8; 
    font-weight: 700; 
    font-size: 1.25rem; 
    letter-spacing: -0.025em;
  }

  /* Info Section */
  .swagger-ui .info { margin: 30px 0; }
  .swagger-ui .info .title { color: #f8fafc; font-weight: 700; letter-spacing: -0.025em; }
  .swagger-ui .info p, .swagger-ui .info table, .swagger-ui .info li { color: #94a3b8; }
  .swagger-ui .info a { color: #38bdf8; text-decoration: none; }
  .swagger-ui .info a:hover { text-decoration: underline; }

  /* Section Headings */
  .swagger-ui .scheme-container { background: #0f172a; box-shadow: none; border-bottom: 1px solid #1e293b; padding: 15px 0; }
  .swagger-ui h2, .swagger-ui h3 { color: #f8fafc; }

  /* Endpoint Blocks */
  .swagger-ui .opblock { 
    background-color: #0f172a; 
    border-radius: 10px; 
    border: 1px solid #1e293b; 
    margin-bottom: 12px; 
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }
  .swagger-ui .opblock:hover {
    border-color: #334155;
  }
  .swagger-ui .opblock .opblock-summary { padding: 12px 16px; }
  .swagger-ui .opblock-summary-method { 
    border-radius: 6px; 
    font-weight: 700; 
    font-size: 0.8rem;
    text-shadow: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  /* Method Colors (Subtle & Sleek) */
  .swagger-ui .opblock.opblock-get { background-color: rgba(6, 78, 59, 0.2); border-color: rgba(16, 185, 129, 0.3); }
  .swagger-ui .opblock.opblock-get .opblock-summary-method { background-color: #059669; }

  .swagger-ui .opblock.opblock-post { background-color: rgba(30, 58, 138, 0.2); border-color: rgba(59, 130, 246, 0.3); }
  .swagger-ui .opblock.opblock-post .opblock-summary-method { background-color: #2563eb; }

  .swagger-ui .opblock.opblock-patch { background-color: rgba(120, 53, 15, 0.2); border-color: rgba(245, 158, 11, 0.3); }
  .swagger-ui .opblock.opblock-patch .opblock-summary-method { background-color: #d97706; }

  .swagger-ui .opblock.opblock-delete { background-color: rgba(127, 29, 29, 0.2); border-color: rgba(239, 68, 68, 0.3); }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method { background-color: #dc2626; }

  /* Paths & Text inside blocks */
  .swagger-ui .opblock .opblock-summary-path { color: #f1f5f9; font-weight: 600; font-family: monospace; }
  .swagger-ui .opblock .opblock-summary-description { color: #94a3b8; }
  .swagger-ui .opblock-section-header { background-color: #0b0f19; border-bottom: 1px solid #1e293b; box-shadow: none; }
  .swagger-ui .opblock-section-header h4 { color: #cbd5e1; }

  /* Tables & Parameters */
  .swagger-ui table tbody tr td, .swagger-ui table tbody tr th { border-bottom: 1px solid #1e293b; color: #cbd5e1; }
  .swagger-ui .parameter__name { color: #f1f5f9; font-weight: 600; }
  .swagger-ui .parameter__type { color: #38bdf8; }
  .swagger-ui .parameter__in { color: #94a3b8; }

  /* Inputs, Textareas & Selects */
  .swagger-ui input[type=text], .swagger-ui select, .swagger-ui textarea {
    background-color: #0b0f19;
    border: 1px solid #334155;
    color: #f8fafc;
    border-radius: 6px;
    padding: 8px 12px;
  }
  .swagger-ui input[type=text]:focus, .swagger-ui select:focus {
    border-color: #38bdf8;
    outline: none;
  }

  /* Buttons */
  .swagger-ui .btn {
    border-radius: 6px;
    font-weight: 600;
    box-shadow: none;
    transition: background 0.15s ease;
  }
  .swagger-ui .btn.execute { background-color: #2563eb; color: #fff; border: none; }
  .swagger-ui .btn.execute:hover { background-color: #1d4ed8; }
  .swagger-ui .btn.authorize { background-color: transparent; border-color: #38bdf8; color: #38bdf8; }
  .swagger-ui .btn.authorize:hover { background-color: rgba(56, 189, 248, 0.1); }

  /* Response Body / Code Blocks */
  .swagger-ui .highlight-code, .swagger-ui .microlight {
    background-color: #0b0f19 !important;
    border-radius: 8px;
    border: 1px solid #1e293b;
  }
  .swagger-ui .responses-inner h5, .swagger-ui .responses-inner h4 { color: #f8fafc; }
  .swagger-ui .model-box { background-color: #0b0f19; border-radius: 6px; }
  .swagger-ui model { color: #38bdf8; }
  .swagger-ui .prop-type { color: #38bdf8; }
  .swagger-ui .prop-format { color: #94a3b8; }
`;

const swaggerOptions = {
  customCss: customCss,
  customSiteTitle: "Northstar API Docs",
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, swaggerOptions));
// ----------------------------------------------------

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