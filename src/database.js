const Database = require("better-sqlite3");

import { app } from "electron";
import path from "path";

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "translations.db");

    dbInstance = new Database(dbPath);
    dbInstance.pragma("journal_mode = WAL");

    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS translations (
        translation_id INTEGER PRIMARY KEY,
        source_text TEXT NOT NULL,
        deepl_translated TEXT,
        manual_translated TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_favorite BOOLEAN DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS folders (
        folder_id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed DATETIME,
        is_favorite BOOLEAN DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS folder_translations (
        folder_id INTEGER REFERENCES folders(folder_id),
        translation_id INTEGER REFERENCES translations(translation_id),
        PRIMARY KEY (folder_id, translation_id)
      );
    `);
  }
  return dbInstance;
}
