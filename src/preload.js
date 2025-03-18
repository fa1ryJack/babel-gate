import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  takeShot: () => ipcRenderer.invoke("take-shot"),
});
