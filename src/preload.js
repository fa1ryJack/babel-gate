import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("mainAPI", {
  newOverlay: () => ipcRenderer.invoke("new-overlay"),
  onCapturedText: (callback) =>
    ipcRenderer.on("captured-text", (_event, value) => callback(value)),
});
