// Import PostgreSQL client and dotenv to manage environment variables
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file into process.env
dotenv.config();

// Destructure Pool from pg module
const { Pool } = pg;

// Create a new connection pool using environment variables
const pool = new Pool({
  user: process.env.DB_USER,       // Database username
  host: process.env.DB_HOST,       // Database host (e.g. localhost)
  database: process.env.DB_NAME,   // Database name
  password: process.env.DB_PASSWORD, // User's password
  port: process.env.DB_PORT,       // Port number (usually 5432 for PostgreSQL)
});

// Function to initialize required database tables if they don't already exist
async function initializeDatabase() {
  try {
    // Create the 'groups' table to store group records
    const groupsResults = await pool.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL
      );
    `);

    // Create the 'links' table with a foreign key reference to 'groups'
    const linksResults = await pool.query(`
      CREATE TABLE IF NOT EXISTS links (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES groups(id),
        title VARCHAR(255) NOT NULL,
        link VARCHAR(255) NOT NULL,
        imageurl VARCHAR(255)
      );
    `);

    // Create the 'configurations' table for storing app configuration key-value pairs
    const configurationsResults = await pool.query(`
      CREATE TABLE IF NOT EXISTS configurations (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,       
        datavalue VARCHAR(255)
      );
    `);

    // Log success message after all tables are initialized
    console.log('Database initialized successfully.');
  } catch (err) {
    // Log any error that occurs during initialization
    console.error('Error initializing database:', err);
  }
}

// Export the connection pool and the initialization function
export { pool, initializeDatabase };
