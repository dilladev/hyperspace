import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function initializeDatabase() {
  try {

    
    const groupsResults = await pool.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL
      );
    `);

    
    const linksResults = await pool.query(`
      CREATE TABLE IF NOT EXISTS links (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES groups(id),
        title VARCHAR(255) NOT NULL,
        link VARCHAR(255) NOT NULL,
        imageurl VARCHAR(255)
      );
    `);
   
    
    const configurationsResults = await pool.query(`
      CREATE TABLE IF NOT EXISTS configurations (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,       
        datavalue VARCHAR(255)
      );
    `);
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

export { pool, initializeDatabase };
