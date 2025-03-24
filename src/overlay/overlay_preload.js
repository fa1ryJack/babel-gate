import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("overlayAPI", {
  takeShot: (captureArea) => ipcRenderer.invoke("take-shot", captureArea),
  closeOverlay: () => ipcRenderer.invoke("close-overlay"),
  updateMenuBounds: (bounds) => ipcRenderer.send("update-menu-bounds", bounds),
  updateSelectionBounds: (bounds) =>
    ipcRenderer.send("update-selection-bounds", bounds),
});
