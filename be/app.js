import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { pool, initializeDatabase } from './db.js';
import fs from 'fs';
import multer from 'multer'
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const port = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Function to run database migrations
async function runMigrations() {
  try {
    const migrationNotes = fs.readFileSync('migrations/add_notes_column.sql', 'utf8');
    await pool.query(migrationNotes);
    const migrationOrder = fs.readFileSync('migrations/add_order_columns.sql', 'utf8');
    await pool.query(migrationOrder);
    console.log('Database migrations completed.');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err; // Re-throw the error to be caught by the startServer function
  }
}

// Initialize database tables and run migrations
async function startServer() {
  try {
    await initializeDatabase();
    await runMigrations();

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

// API endpoints for groups
app.get('/groups', async (req, res) => {
  try {
    // Fetch all groups
    const groupsResult = await pool.query('SELECT * FROM groups');
    const groups = groupsResult.rows;
    
    // Fetch all links
    const linksResult = await pool.query('SELECT * FROM links');
    const links = linksResult.rows;

    // Attach links to their respective groups
    const groupsWithLinks = groups.map(group => ({
      ...group,
      links: links.filter(link => link.group_id === group.id), // Attach matching links
    }));

    res.json(groupsWithLinks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve groups with links' });
  }
});


app.post('/groups', async (req, res) => {
  const { title, orderby } = req.body;
  try {
    const result = await pool.query('INSERT INTO groups (title,orderby) VALUES ($1, $2) RETURNING *', [title, orderby]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

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

app.put('/groups/:id', async (req, res) => {
  const { id } = req.params;
  const { title, orderby } = req.body;
  try {
    const result = await pool.query('UPDATE groups SET title = $1, orderby = $2 WHERE id = $3 RETURNING *', [title, orderby, id,]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

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

// API endpoints for links
app.get('/configurations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM configurations');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve configurations' });
  }
});

app.post('/configurations', async (req, res) => {
  const { title, datavalue } = req.body;
  try {
    const result = await pool.query('INSERT INTO configurations (title, datavalue) VALUES ($1, $2 RETURNING *', [title, datavalue]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create configuration' });
  }
});

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

app.put('/configuration/:id', async (req, res) => {
  const { id } = req.params;
  const { title, datavalue } = req.body;
  try {
    const result = await pool.query('UPDATE configurations SET title = $1, datavalue = $2 WHERE id = $3 RETURNING *', [title, datavalue, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// API endpoints for links
app.get('/links', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM links ORDER BY orderby');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve links' });
  }
});

app.post('/links', async (req, res) => {
  const { group_id, title, link, imageurl, notes, orderby } = req.body;
  try {
    const result = await pool.query('INSERT INTO links (group_id, title, link, imageurl, notes, orderby) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [group_id, title, link, imageurl, notes, orderby]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create link' });
  }
});

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

app.put('/links/:id', async (req, res) => {
  const { id } = req.params;
  const { group_id, title, link, imageurl, notes, orderby } = req.body;
  try {
    const result = await pool.query('UPDATE links SET group_id = $1, title = $2, link = $3, imageurl = $4, notes = $5, orderby = $6 WHERE id = $7 RETURNING *', [group_id, title, link, imageurl, notes, orderby, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update link' });
  }
});

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
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // save to /uploads
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ message: 'File uploaded successfully', file: req.file });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Start the server
startServer();
