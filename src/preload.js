import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("mainAPI", {
  newOverlay: (info) => ipcRenderer.invoke("new-overlay", info),
  onCapturedText: (callback) =>
    ipcRenderer.on("captured-text", (_event, original, translated) =>
      callback({ original, translated })
    ),
  writeToDB: (sql, params) => ipcRenderer.invoke("db-write", sql, params),
  readFromDB: (method, sql, params) =>
    ipcRenderer.invoke("db-read", method, sql, params),
  deeplTranslate: (sourceText, sourceLanguage, targetLanguage) =>
    ipcRenderer.invoke(
      "deepl-translate",
      sourceText,
      sourceLanguage,
      targetLanguage
    ),
});
