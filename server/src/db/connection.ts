import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'brand_sentinel.db');

export const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize schema
export function initDatabase() {
  const possiblePaths = [
    path.resolve(process.cwd(), 'src', 'db', 'schema.sql'),
    path.resolve(process.cwd(), 'server', 'src', 'db', 'schema.sql'),
    path.resolve(process.cwd(), 'dist', 'db', 'schema.sql'),
    path.resolve(process.cwd(), 'schema.sql')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const schemaSql = fs.readFileSync(p, 'utf8');
      db.exec(schemaSql);
      break;
    }
  }
}

initDatabase();

export default db;
