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
    dbInstance.pragma("foreign_keys = ON");

    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS folders (
        folder_id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed DATETIME,
        is_favorite BOOLEAN DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS translations (
        translation_id INTEGER PRIMARY KEY,
        folder_id INTEGER NOT NULL,
        source_text TEXT NOT NULL,
        deepl_translated TEXT,
        manual_translated TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (folder_id) REFERENCES folders(folder_id) ON DELETE CASCADE
      );

      CREATE TRIGGER IF NOT EXISTS update_folder_timestamp
      AFTER UPDATE ON folders
      FOR EACH ROW
      BEGIN
        UPDATE folders
        SET updated_at = CURRENT_TIMESTAMP
        WHERE folder_id = OLD.folder_id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_translation_timestamp
      AFTER UPDATE ON translations
      FOR EACH ROW
      BEGIN
        UPDATE translations
        SET updated_at = CURRENT_TIMESTAMP
        WHERE translation_id = OLD.translation_id;
      END;
    `);
  }
  return dbInstance;
}
