import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("mainAPI", {
  newOverlay: () => ipcRenderer.invoke("new-overlay"),
});
