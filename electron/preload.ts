//Libs
import { contextBridge, ipcRenderer } from "electron"

//Main
contextBridge.exposeInMainWorld("api", {
  selectImages: () => ipcRenderer.invoke("select-images"),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  getImageMetadata: (filePath: string) => ipcRenderer.invoke("get-image-metadata", filePath)
})
