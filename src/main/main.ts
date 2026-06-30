//Libs
import { app, BrowserWindow, ipcMain, dialog, protocol, net } from "electron"
import path from "path"
import fs from "fs"
import sharp from "sharp"
// @ts-ignore
import pngToIco from "png-to-ico"
// @ts-ignore
import icongen from "icon-gen"

// @ts-ignore
const pngToIcoFn = typeof pngToIco === "function" ? pngToIco : (pngToIco as any).default
// @ts-ignore
const icongenFn = typeof icongen === "function" ? icongen : (icongen as any).default

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
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"))
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

  ipcMain.handle("select-destination-directory", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  ipcMain.handle("export-image", async (_, options: any) => {
    try {
      const { filePath, crop, outputs, destDir } = options
      
      const meta = await sharp(filePath).metadata()
      const origW = meta.width || 1
      const origH = meta.height || 1
      
      const baseName = path.basename(filePath, path.extname(filePath))
      
      const hasMultipleOutputs = outputs.length > 1
      const hasIconAllSizes = outputs.some((out: any) => out.conversion && out.conversion.enabled && out.conversion.generateAllSizes)
      const useSubfolders = hasMultipleOutputs || hasIconAllSizes

      let outputFolder = destDir
      if (useSubfolders) {
        outputFolder = path.join(destDir, baseName)
        if (!fs.existsSync(outputFolder)) {
          fs.mkdirSync(outputFolder, { recursive: true })
        }
      }

      for (const output of outputs) {
        // Calculate base scale width and height for current crop settings
        let baseW = origW
        let baseH = origH
        if (crop) {
          baseW = Math.max(1, Math.round((crop.width / 100) * origW))
          baseH = Math.max(1, Math.round((crop.height / 100) * origH))
        }

        let targetW = baseW
        let targetH = baseH
        if (output.resize && output.resize.enabled) {
          if (output.resize.mode === "pixels") {
            targetW = output.resize.width
            targetH = output.resize.height
          } else {
            const scale = output.resize.percentage / 100
            targetW = Math.round(baseW * scale)
            targetH = Math.round(baseH * scale)
          }
        }

        let sharpInstance = sharp(filePath)

        // 1. Crop (Global for the image)
        if (crop) {
          const left = Math.max(0, Math.min(origW - 1, Math.round((crop.x / 100) * origW)))
          const top = Math.max(0, Math.min(origH - 1, Math.round((crop.y / 100) * origH)))
          const width = Math.max(1, Math.min(origW - left, Math.round((crop.width / 100) * origW)))
          const height = Math.max(1, Math.min(origH - top, Math.round((crop.height / 100) * origH)))
          sharpInstance = sharpInstance.extract({ left, top, width, height })
        }

        // 2. Format & Save Setup
        const outputFormat = (output.conversion && output.conversion.enabled) ? output.conversion.format : (meta.format || "png")
        
        let formatFolder = outputFolder
        if (useSubfolders) {
          formatFolder = path.join(outputFolder, outputFormat)
          if (!fs.existsSync(formatFolder)) {
            fs.mkdirSync(formatFolder, { recursive: true })
          }
        }

        const cleanName = output.name.replace(/[^a-zA-Z0-9_\-]/g, "_")
        const outFileName = !useSubfolders
          ? `${baseName}_edited.${outputFormat}`
          : `${baseName}_${cleanName}.${outputFormat}`
        const outputPath = path.join(formatFolder, outFileName)

        const generateAll = output.conversion && output.conversion.enabled && output.conversion.generateAllSizes

        if (generateAll) {
          const iconSizes = [16, 32, 48, 256, 512, 1024]
          
          // Generate individual sizes in the target format (ico or icns)
          for (const s of iconSizes) {
            const sizePath = path.join(formatFolder, `${baseName}_${cleanName}_${s}.${outputFormat}`)
            
            if (outputFormat === "ico") {
              const pngBuffer = await sharpInstance.clone().resize(s, s).png().toBuffer()
              const icoBuffer = await pngToIcoFn(pngBuffer)
              fs.writeFileSync(sizePath, icoBuffer)
            } else if (outputFormat === "icns") {
              const tmpDir = path.join(app.getPath("temp"), `imageflow_icns_tmp_size_${s}_${Date.now()}`)
              fs.mkdirSync(tmpDir, { recursive: true })
              
              const tmpPngPath = path.join(tmpDir, "icon.png")
              await sharpInstance.clone().resize(s, s).png().toFile(tmpPngPath)
              await icongenFn(tmpPngPath, tmpDir, { report: false })
              
              const generatedPath = path.join(tmpDir, "app.icns")
              if (fs.existsSync(generatedPath)) {
                fs.copyFileSync(generatedPath, sizePath)
              }
              try {
                fs.rmSync(tmpDir, { recursive: true, force: true })
              } catch (e) {
                // ignore
              }
            }
          }

          // Generate custom size in the target format if enabled
          if (output.resize.enabled) {
            const isStandardIconSize = targetW === targetH && iconSizes.includes(targetW)
            if (!isStandardIconSize) {
              const customPath = path.join(formatFolder, `${baseName}_${cleanName}_custom_${targetW}x${targetH}.${outputFormat}`)
              
              if (outputFormat === "ico") {
                const pngBuffer = await sharpInstance.clone().resize({
                  width: targetW,
                  height: targetH,
                  fit: output.resize.keepAspectRatio ? "contain" : "fill"
                }).png().toBuffer()
                const icoBuffer = await pngToIcoFn(pngBuffer)
                fs.writeFileSync(customPath, icoBuffer)
              } else if (outputFormat === "icns") {
                const tmpDir = path.join(app.getPath("temp"), `imageflow_icns_tmp_custom_${Date.now()}`)
                fs.mkdirSync(tmpDir, { recursive: true })
                
                const tmpPngPath = path.join(tmpDir, "icon.png")
                await sharpInstance.clone().resize({
                  width: targetW,
                  height: targetH,
                  fit: output.resize.keepAspectRatio ? "contain" : "fill"
                }).png().toFile(tmpPngPath)
                await icongenFn(tmpPngPath, tmpDir, { report: false })
                
                const generatedPath = path.join(tmpDir, "app.icns")
                if (fs.existsSync(generatedPath)) {
                  fs.copyFileSync(generatedPath, customPath)
                }
                try {
                  fs.rmSync(tmpDir, { recursive: true, force: true })
                } catch (e) {
                  // ignore
                }
              }
            }
          }

          // Generate main multi-resolution icon container file
          if (outputFormat === "ico") {
            const icoSizes = [16, 32, 48, 256]
            const pngBuffers = await Promise.all(
              icoSizes.map((size) => sharpInstance.clone().resize(size, size).png().toBuffer())
            )
            const icoBuffer = await pngToIcoFn(pngBuffers)
            fs.writeFileSync(outputPath, icoBuffer)
          } else if (outputFormat === "icns") {
            const tmpDir = path.join(app.getPath("temp"), `imageflow_icns_tmp_${Date.now()}`)
            fs.mkdirSync(tmpDir, { recursive: true })
            
            const tmpPngPath = path.join(tmpDir, "icon.png")
            await sharpInstance.clone().resize(512, 512).png().toFile(tmpPngPath)
            await icongenFn(tmpPngPath, tmpDir, { report: false })
            
            const generatedPath = path.join(tmpDir, "app.icns")
            if (fs.existsSync(generatedPath)) {
              fs.copyFileSync(generatedPath, outputPath)
            }
            try {
              fs.rmSync(tmpDir, { recursive: true, force: true })
            } catch (e) {
              // ignore
            }
          }
          continue
        }

        // Standard Single Icon Export (generateAllSizes === false)
        if (outputFormat === "ico") {
          const w = output.resize.enabled ? targetW : 256
          const h = output.resize.enabled ? targetH : 256
          const pngBuffer = await sharpInstance.resize({
            width: w,
            height: h,
            fit: output.resize.keepAspectRatio ? "contain" : "fill"
          }).png().toBuffer()
          const icoBuffer = await pngToIcoFn(pngBuffer)
          fs.writeFileSync(outputPath, icoBuffer)
          continue
        }

        if (outputFormat === "icns") {
          const w = output.resize.enabled ? targetW : 512
          const h = output.resize.enabled ? targetH : 512
          const tmpDir = path.join(app.getPath("temp"), `imageflow_icns_tmp_${Date.now()}`)
          fs.mkdirSync(tmpDir, { recursive: true })
          
          const tmpPngPath = path.join(tmpDir, "icon.png")
          await sharpInstance.resize({
            width: w,
            height: h,
            fit: output.resize.keepAspectRatio ? "contain" : "fill"
          }).png().toFile(tmpPngPath)
          await icongenFn(tmpPngPath, tmpDir, { report: false })
          
          const generatedPath = path.join(tmpDir, "app.icns")
          if (fs.existsSync(generatedPath)) {
            fs.copyFileSync(generatedPath, outputPath)
          }
          
          try {
            fs.rmSync(tmpDir, { recursive: true, force: true })
          } catch (e) {
            // ignore
          }
          continue
        }

        // Standard Images Export (PNG, JPG, WebP)
        let formatInstance = sharpInstance
        if (output.resize && output.resize.enabled) {
          formatInstance = formatInstance.resize({
            width: targetW,
            height: targetH,
            fit: output.resize.keepAspectRatio ? "contain" : "fill"
          })
        }

        if (outputFormat === "jpg" || outputFormat === "jpeg") {
          formatInstance = formatInstance.jpeg({ quality: output.conversion?.quality || 80 })
        } else if (outputFormat === "webp") {
          formatInstance = formatInstance.webp({ quality: output.conversion?.quality || 80 })
        } else if (outputFormat === "png") {
          formatInstance = formatInstance.png()
        }

        await formatInstance.toFile(outputPath)
      }

      return { success: true }
    } catch (error: any) {
      console.error("Export failed:", error)
      return { success: false, error: error.message || String(error) }
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
