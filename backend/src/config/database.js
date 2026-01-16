import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'trafic_db.sqlite');

let db = null;

// Initialize database schema
export const initDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Enable foreign keys and WAL mode for better performance
    await db.exec('PRAGMA journal_mode = WAL');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS clicks_mapping (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT UNIQUE NOT NULL,
        sub_id_2 TEXT NOT NULL,
        country_flag TEXT NOT NULL,
        datetime TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_source ON clicks_mapping(source);
      CREATE INDEX IF NOT EXISTS idx_datetime ON clicks_mapping(datetime);
    `;

    await db.exec(createTableQuery);
    console.log('Database schema initialized successfully');
    console.log(`Database file: ${dbPath}`);
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export default getDb;
