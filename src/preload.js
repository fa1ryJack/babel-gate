import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("mainAPI", {
  takeShot: () => ipcRenderer.invoke("take-shot"),
  newOverlay: () => ipcRenderer.invoke("new-overlay"),
});
