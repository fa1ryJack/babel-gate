import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("mainAPI", {
  takeShot: (captureArea) => ipcRenderer.invoke("take-shot", captureArea),
  newOverlay: () => ipcRenderer.invoke("new-overlay"),
});
