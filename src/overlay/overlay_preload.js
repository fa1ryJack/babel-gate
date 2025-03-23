import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("overlayAPI", {
  takeShot: (captureArea) => ipcRenderer.invoke("take-shot", captureArea),
  closeOverlay: () => ipcRenderer.invoke("close-overlay"),
});
