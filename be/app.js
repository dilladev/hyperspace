// Import necessary modules
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { pool, initializeDatabase } from './db.js';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Resolve __dirname and __filename in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an Express application
const app = express();
const port = process.env.PORT || 3003;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse incoming JSON requests

// Function to run SQL migration scripts
async function runMigrations() {
  try {
    // Run migration to add "notes" column
    const migrationNotes = fs.readFileSync('migrations/add_notes_column.sql', 'utf8');
    await pool.query(migrationNotes);

    // Run migration to add "orderby" columns
    const migrationOrder = fs.readFileSync('migrations/add_order_columns.sql', 'utf8');
    await pool.query(migrationOrder);

    console.log('Database migrations completed.');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  }
}

// Function to initialize DB and start server
async function startServer() {
  try {
    await initializeDatabase(); // Create tables if they don't exist
    await runMigrations();      // Run any pending migrations

    // Start listening on specified port
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

/* ===========================
   GROUPS API ENDPOINTS
   =========================== */

// Get all groups and their associated links
app.get('/groups', async (req, res) => {
  try {
    const groupsResult = await pool.query('SELECT * FROM groups ORDER BY orderby');
    const groups = groupsResult.rows;

    const linksResult = await pool.query('SELECT * FROM links ORDER BY'); // Note: incomplete ORDER BY
    const links = linksResult.rows;

    // Attach links to their corresponding groups
    const groupsWithLinks = groups.map(group => ({
      ...group,
      links: links.filter(link => link.group_id === group.id),
    }));

    res.json(groupsWithLinks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve groups with links' });
  }
});

// Create a new group
app.post('/groups', async (req, res) => {
  const { title, orderby } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO groups (title,orderby) VALUES ($1, $2) RETURNING *',
      [title, orderby]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get a single group by ID
app.get('/groups/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM groups WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve group' });
  }
});

// Update a group by ID
app.put('/groups/:id', async (req, res) => {
  const { id } = req.params;
  const { title, orderby } = req.body;
  try {
    const result = await pool.query(
      'UPDATE groups SET title = $1, orderby = $2 WHERE id = $3 RETURNING *',
      [title, orderby, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Delete a group by ID
app.delete('/groups/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM groups WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

/* ===========================
   CONFIGURATIONS API ENDPOINTS
   =========================== */

// Get all configurations
app.get('/configurations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM configurations');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve configurations' });
  }
});

// Create a new configuration
app.post('/configurations', async (req, res) => {
  const { title, datavalue } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO configurations (title, datavalue) VALUES ($1, $2 RETURNING *',
      [title, datavalue]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create configuration' });
  }
});

// Get a single configuration by ID
app.get('/configurations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM configurations WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve configuration' });
  }
});

// Update a configuration by ID
app.put('/configuration/:id', async (req, res) => {
  const { id } = req.params;
  const { title, datavalue } = req.body;
  try {
    const result = await pool.query(
      'UPDATE configurations SET title = $1, datavalue = $2 WHERE id = $3 RETURNING *',
      [title, datavalue, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

/* ===========================
   LINKS API ENDPOINTS
   =========================== */

// Get all links
app.get('/links', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM links ORDER BY orderby');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve links' });
  }
});

// Create a new link
app.post('/links', async (req, res) => {
  const { group_id, title, link, imageurl, notes, orderby } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO links (group_id, title, link, imageurl, notes, orderby) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [group_id, title, link, imageurl, notes, orderby]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create link' });
  }
});

// Get a specific link by ID
app.get('/links/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM links WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve link' });
  }
});

// Update a link by ID
app.put('/links/:id', async (req, res) => {
  const { id } = req.params;
  const { group_id, title, link, imageurl, notes, orderby } = req.body;
  try {
    const result = await pool.query(
      'UPDATE links SET group_id = $1, title = $2, link = $3, imageurl = $4, notes = $5, orderby = $6 WHERE id = $7 RETURNING *',
      [group_id, title, link, imageurl, notes, orderby, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update link' });
  }
});

// Delete a link by ID
app.delete('/links/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM links WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.json({ message: 'Link deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

/* ===========================
   FILE UPLOAD HANDLER
   =========================== */

// Configure file upload storage using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save uploaded files to /uploads
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`); // Preserve original file name
  },
});

const upload = multer({ storage });

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ message: 'File uploaded successfully', file: req.file });
});

// Serve static files from /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start the server
startServer();
