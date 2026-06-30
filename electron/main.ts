//Libs
import { app, BrowserWindow, ipcMain, dialog, protocol, net } from "electron"
import path from "path"
import fs from "fs"
import sharp from "sharp"

//Funcs
function getImagesInFolder(dirPath: string, list: { path: string; name: string; size: number }[] = []): { path: string; name: string; size: number }[] {
  const files = fs.readdirSync(dirPath)
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file)
    try {
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        getImagesInFolder(fullPath, list)
      } else if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase()
        if ([".png", ".jpg", ".jpeg", ".webp", ".tiff", ".bmp", ".gif"].includes(ext)) {
          list.push({
            path: fullPath,
            name: file,
            size: stat.size
          })
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return list
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"))
  }
}

//Main
protocol.registerSchemesAsPrivileged([
  {
    scheme: "imageflow-file",
    privileges: {
      bypassCSP: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
])

app.whenReady().then(() => {
  protocol.handle("imageflow-file", (request) => {
    const filePath = decodeURIComponent(request.url.slice("imageflow-file://".length))
    return net.fetch("file://" + filePath)
  })

  ipcMain.handle("select-images", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Imagens", extensions: ["png", "jpg", "jpeg", "webp", "tiff", "bmp", "gif"] }
      ]
    })
    
    if (result.canceled) {
      return []
    }
    
    return result.filePaths.map(filePath => {
      const stat = fs.statSync(filePath)
      return {
        path: filePath,
        name: path.basename(filePath),
        size: stat.size
      }
    })
  })

  ipcMain.handle("select-folder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    })
    
    if (result.canceled || result.filePaths.length === 0) {
      return []
    }
    
    return getImagesInFolder(result.filePaths[0])
  })

  ipcMain.handle("get-image-metadata", async (_, filePath: string) => {
    try {
      const meta = await sharp(filePath).metadata()
      return {
        width: meta.width,
        height: meta.height,
        format: meta.format,
        space: meta.space
      }
    } catch (error) {
      console.error("Failed to read image metadata:", error)
      return null
    }
  })

  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
