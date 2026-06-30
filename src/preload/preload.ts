//Libs
import { contextBridge, ipcRenderer } from "electron"

//Types
import type { ExportOptions } from "../renderer/env"

//Main
contextBridge.exposeInMainWorld("api", {
  selectImages: () => ipcRenderer.invoke("select-images"),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  getImageMetadata: (filePath: string) => ipcRenderer.invoke("get-image-metadata", filePath),
  selectDestinationDirectory: () => ipcRenderer.invoke("select-destination-directory"),
  exportImage: (options: ExportOptions) => ipcRenderer.invoke("export-image", options)
})
