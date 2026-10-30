const express = require('express');
const { Pool } = require('pg');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./openapi.json');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ---------- CUSTOM SWAGGER UI THEME (v3 - Ultimate DevEx) ----------
const customCss = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

  /* Global Resets */
  body, .swagger-ui {
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    background-color: #07090e !important;
    color: #cbd5e1 !important;
  }

  /* Custom Scrollbar */
  .swagger-ui ::-webkit-scrollbar { width: 6px; height: 6px; }
  .swagger-ui ::-webkit-scrollbar-track { background: #07090e; }
  .swagger-ui ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
  .swagger-ui ::-webkit-scrollbar-thumb:hover { background: #334155; }

  /* Topbar */
  .swagger-ui .topbar { 
    background: linear-gradient(135deg, #0f172a 0%, #090d16 100%) !important;
    border-bottom: 1px solid #1e293b !important;
    padding: 14px 0 !important;
    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.5) !important;
  }
  .swagger-ui .topbar .download-url-wrapper { display: none !important; }
  .swagger-ui .topbar a span { visibility: hidden !important; }
  .swagger-ui .topbar a span:before { 
    content: "⚡ Northstar API Studio" !important; 
    visibility: visible !important; 
    color: #38bdf8 !important; 
    font-weight: 700 !important; 
    font-size: 1.3rem !important; 
    letter-spacing: -0.03em;
  }

  /* Info Container */
  .swagger-ui .info { margin: 40px 0 !important; }
  .swagger-ui .info .title { 
    color: #f8fafc !important; 
    font-weight: 700 !important; 
    font-size: 2.5rem !important;
    letter-spacing: -0.03em;
  }
  .swagger-ui .info p, .swagger-ui .info table, .swagger-ui .info li { color: #94a3b8 !important; }
  .swagger-ui .info a { color: #38bdf8 !important; }

  /* Scheme Container / Auth */
  .swagger-ui .scheme-container { 
    background: #0b0f19 !important; 
    border: 1px solid #1e293b !important;
    border-radius: 12px !important;
    box-shadow: none !important;
    padding: 20px !important;
    margin-bottom: 30px !important;
  }

  /* Endpoint Blocks (The Magic Upgrade) */
  .swagger-ui .opblock { 
    background-color: #0b0f19 !important; 
    border-radius: 12px !important; 
    border: 1px solid #1e293b !important; 
    margin-bottom: 16px !important; 
    box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.3) !important;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  .swagger-ui .opblock:hover {
    border-color: #334155 !important;
    box-shadow: 0 6px 25px -4px rgba(56, 189, 248, 0.1) !important;
  }
  
  .swagger-ui .opblock .opblock-summary { padding: 14px 18px !important; }
  .swagger-ui .opblock-summary-method { 
    border-radius: 8px !important; 
    font-weight: 700 !important; 
    font-size: 0.85rem !important;
    min-width: 80px !important;
    text-align: center !important;
  }

  /* Sleek Method Accents */
  .swagger-ui .opblock.opblock-get { background: rgba(6, 78, 59, 0.15) !important; border-color: rgba(16, 185, 129, 0.25) !important; }
  .swagger-ui .opblock.opblock-get .opblock-summary-method { background-color: #059669 !important; color: #fff !important; }

  .swagger-ui .opblock.opblock-post { background: rgba(30, 58, 138, 0.15) !important; border-color: rgba(59, 130, 246, 0.25) !important; }
  .swagger-ui .opblock.opblock-post .opblock-summary-method { background-color: #2563eb !important; color: #fff !important; }

  .swagger-ui .opblock.opblock-patch { background: rgba(120, 53, 15, 0.15) !important; border-color: rgba(245, 158, 11, 0.25) !important; }
  .swagger-ui .opblock.opblock-patch .opblock-summary-method { background-color: #d97706 !important; color: #fff !important; }

  .swagger-ui .opblock.opblock-delete { background: rgba(127, 29, 29, 0.15) !important; border-color: rgba(239, 68, 68, 0.25) !important; }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method { background-color: #dc2626 !important; color: #fff !important; }

  /* Paths and Typography */
  .swagger-ui .opblock .opblock-summary-path { 
    color: #f1f5f9 !important; 
    font-weight: 600 !important; 
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.95rem !important;
  }
  .swagger-ui .opblock .opblock-summary-description { color: #64748b !important; }

  /* Headers inside blocks */
  .swagger-ui .opblock-section-header { 
    background-color: #07090e !important; 
    border-bottom: 1px solid #1e293b !important; 
    box-shadow: none !important;
  }
  .swagger-ui .opblock-section-header h4 { color: #e2e8f0 !important; }

  /* Tables & Parameters */
  .swagger-ui table tbody tr td, .swagger-ui table tbody tr th { border-bottom: 1px solid #1e293b !important; }
  .swagger-ui .parameter__name { color: #f1f5f9 !important; font-weight: 600 !important; }
  .swagger-ui .parameter__type { color: #38bdf8 !important; font-family: 'JetBrains Mono', monospace !important; }

  /* Inputs & Selects */
  .swagger-ui input[type=text], .swagger-ui select, .swagger-ui textarea {
    background-color: #07090e !important;
    border: 1px solid #334155 !important;
    color: #f8fafc !important;
    border-radius: 8px !important;
    padding: 10px 14px !important;
  }
  .swagger-ui input[type=text]:focus, .swagger-ui select:focus, .swagger-ui textarea:focus {
    border-color: #38bdf8 !important;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2) !important;
    outline: none !important;
  }

  /* Action Buttons */
  .swagger-ui .btn {
    border-radius: 8px !important;
    font-weight: 600 !important;
    box-shadow: none !important;
    padding: 8px 18px !important;
    transition: all 0.2s ease !important;
  }
  .swagger-ui .btn.execute { background-color: #2563eb !important; color: #fff !important; border: none !important; }
  .swagger-ui .btn.execute:hover { background-color: #1d4ed8 !important; transform: translateY(-1px); }
  .swagger-ui .btn.authorize { background-color: transparent !important; border-color: #38bdf8 !important; color: #38bdf8 !important; }

  /* Code Response Blocks */
  .swagger-ui .highlight-code, .swagger-ui .microlight {
    background-color: #05070a !important;
    border-radius: 8px !important;
    border: 1px solid #1e293b !important;
    font-family: 'JetBrains Mono', monospace !important;
  }
  .swagger-ui .responses-inner h5, .swagger-ui .responses-inner h4 { color: #f8fafc !important; }
  .swagger-ui .model-box { background-color: #07090e !important; border-radius: 8px !important; }
  .swagger-ui .model { color: #38bdf8 !important; font-family: 'JetBrains Mono', monospace !important; }
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
  ssl: { rejectUnauthorized: false }
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
  console.log(`🚀 Northstar API running smoothly on port ${PORT}`);
});

module.exports = app;