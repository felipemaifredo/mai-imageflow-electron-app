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
      let { filePath, crop, outputs, destDir } = options
      let exportedFiles: string[] = []
      
      console.log(`[EXPORT] Starting export-image handler. filePath: "${filePath}", destDir: "${destDir}"`)
      console.log(`[EXPORT] Outputs configurados:`, JSON.stringify(outputs, null, 2))

      const meta = await sharp(filePath).metadata()
      const origW = meta.width || 1
      const origH = meta.height || 1
      
      const baseName = path.basename(filePath, path.extname(filePath))
      
      let hasMultipleOutputs = outputs.length > 1
      const hasIconAllSizes = outputs.some((out: any) => 
        out.conversion && 
        out.conversion.enabled && 
        out.conversion.generateAllSizes &&
        ["ico", "icns"].includes(out.conversion.format)
      )
      const useSubfolders = hasMultipleOutputs || hasIconAllSizes

      let outputFolder = destDir
      if (useSubfolders) {
        outputFolder = path.join(destDir, baseName)
        if (!fs.existsSync(outputFolder)) {
          fs.mkdirSync(outputFolder, { recursive: true })
          console.log(`[EXPORT] Created base subfolder: ${outputFolder}`)
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
          console.log(`[EXPORT] Extracting crop bounds - left: ${left}, top: ${top}, w: ${width}, h: ${height}`)
          sharpInstance = sharpInstance.extract({ left, top, width, height })
        }

        // 2. Format & Save Setup
        const outputFormat = (output.conversion && output.conversion.enabled) ? output.conversion.format : (meta.format || "png")
        
        let formatFolder = outputFolder
        if (useSubfolders) {
          formatFolder = path.join(outputFolder, outputFormat)
          if (!fs.existsSync(formatFolder)) {
            fs.mkdirSync(formatFolder, { recursive: true })
            console.log(`[EXPORT] Created format subfolder: ${formatFolder}`)
          }
        }

        const cleanName = output.name.replace(/[^a-zA-Z0-9_\-]/g, "_")
        const outFileName = !useSubfolders
          ? `${baseName}_edited.${outputFormat}`
          : `${baseName}_${cleanName}.${outputFormat}`
        const outputPath = path.join(formatFolder, outFileName)

        console.log(`[EXPORT] Target format: ${outputFormat}, Target output path: ${outputPath}`)

        const generateAll = output.conversion && 
                            output.conversion.enabled && 
                            output.conversion.generateAllSizes &&
                            ["ico", "icns"].includes(outputFormat)

        if (generateAll) {
          let iconSizes = [16, 32, 48, 256, 512, 1024]
          console.log(`[EXPORT] Generating ALL sizes for format ${outputFormat}...`)
          
          for (let s of iconSizes) {
            // ICO only supports sizes up to 256px
            if (outputFormat === "ico" && s > 256) {
              continue
            }
            // ICNS does not support 48px size
            if (outputFormat === "icns" && s === 48) {
              continue
            }

            let sizePath = path.join(formatFolder, `${baseName}_${cleanName}_${s}.${outputFormat}`)
            
            if (outputFormat === "ico") {
              try {
                let pngBuffer = await sharpInstance.clone().resize(s, s).png().toBuffer()
                let icoBuffer = await pngToIcoFn(pngBuffer)
                fs.writeFileSync(sizePath, icoBuffer)
                console.log(`[EXPORT] Wrote individual ICO size ${s}: ${sizePath}`)
                exportedFiles.push(sizePath)
              } catch (e) {
                console.error(`[EXPORT] Failed to generate individual ICO size ${s}:`, (e as any).message)
              }
            } else if (outputFormat === "icns") {
              try {
                let tmpDir = path.join(app.getPath("temp"), `imageflow_icns_tmp_size_${s}_${Date.now()}`)
                fs.mkdirSync(tmpDir, { recursive: true })
                
                let tmpPngPath = path.join(tmpDir, "icon.png")
                await sharpInstance.clone().resize(s, s).png().toFile(tmpPngPath)
                await icongenFn(tmpPngPath, tmpDir, { 
                  report: false,
                  ico: { name: "app", sizes: [] },
                  icns: { name: "app", sizes: [s] }
                })
                
                let generatedPath = path.join(tmpDir, "app.icns")
                if (fs.existsSync(generatedPath)) {
                  fs.copyFileSync(generatedPath, sizePath)
                  console.log(`[EXPORT] Wrote individual ICNS size ${s}: ${sizePath}`)
                  exportedFiles.push(sizePath)
                } else {
                  console.warn(`[EXPORT] Individual ICNS not found at: ${generatedPath}`)
                }
                try {
                  fs.rmSync(tmpDir, { recursive: true, force: true })
                } catch (e) {
                  // ignore
                }
              } catch (e) {
                console.error(`[EXPORT] Failed to generate individual ICNS size ${s}:`, (e as any).message)
              }
            }
          }

          // Generate custom size if enabled
          if (output.resize.enabled) {
            let isStandardIconSize = targetW === targetH && iconSizes.includes(targetW)
            if (!isStandardIconSize) {
              let isIcoValidSize = outputFormat === "ico" && targetW <= 256 && targetH <= 256
              let isIcnsValidSize = outputFormat === "icns"

              if (isIcoValidSize || isIcnsValidSize) {
                let customPath = path.join(formatFolder, `${baseName}_${cleanName}_custom_${targetW}x${targetH}.${outputFormat}`)
                
                if (outputFormat === "ico") {
                  try {
                    let pngBuffer = await sharpInstance.clone().resize({
                      width: targetW,
                      height: targetH,
                      fit: output.resize.keepAspectRatio ? "contain" : "fill"
                    }).png().toBuffer()
                    let icoBuffer = await pngToIcoFn(pngBuffer)
                    fs.writeFileSync(customPath, icoBuffer)
                    console.log(`[EXPORT] Wrote custom ICO ${targetW}x${targetH}: ${customPath}`)
                    exportedFiles.push(customPath)
                  } catch (e) {
                    console.error("[EXPORT] Failed to generate custom ICO:", (e as any).message)
                  }
                } else if (outputFormat === "icns") {
                  try {
                    let tmpDir = path.join(app.getPath("temp"), `imageflow_icns_tmp_custom_${Date.now()}`)
                    fs.mkdirSync(tmpDir, { recursive: true })
                    
                    let tmpPngPath = path.join(tmpDir, "icon.png")
                    await sharpInstance.clone().resize({
                      width: targetW,
                      height: targetH,
                      fit: output.resize.keepAspectRatio ? "contain" : "fill"
                    }).png().toFile(tmpPngPath)
                    await icongenFn(tmpPngPath, tmpDir, { 
                      report: false,
                      ico: { name: "app", sizes: [] },
                      icns: { name: "app", sizes: [16, 32, 64, 128, 256, 512, 1024] }
                    })
                    
                    let generatedPath = path.join(tmpDir, "app.icns")
                    if (fs.existsSync(generatedPath)) {
                      fs.copyFileSync(generatedPath, customPath)
                      console.log(`[EXPORT] Wrote custom ICNS ${targetW}x${targetH}: ${customPath}`)
                      exportedFiles.push(customPath)
                    }
                    try {
                      fs.rmSync(tmpDir, { recursive: true, force: true })
                    } catch (e) {
                      // ignore
                    }
                  } catch (e) {
                    console.error("[EXPORT] Failed to generate custom ICNS:", (e as any).message)
                  }
                }
              }
            }
          }

          // Generate main multi-resolution icon container file
          if (outputFormat === "ico") {
            let icoSizes = [16, 32, 48, 256]
            let pngBuffers = await Promise.all(
              icoSizes.map((size) => sharpInstance.clone().resize(size, size).png().toBuffer())
            )
            let icoBuffer = await pngToIcoFn(pngBuffers)
            fs.writeFileSync(outputPath, icoBuffer)
            console.log(`[EXPORT] Wrote main ICO container to: ${outputPath}`)
            exportedFiles.push(outputPath)
          } else if (outputFormat === "icns") {
            let tmpDir = path.join(app.getPath("temp"), `imageflow_icns_tmp_${Date.now()}`)
            fs.mkdirSync(tmpDir, { recursive: true })
            
            let tmpPngPath = path.join(tmpDir, "icon.png")
            await sharpInstance.clone().resize(512, 512).png().toFile(tmpPngPath)
            await icongenFn(tmpPngPath, tmpDir, { 
              report: false,
              ico: { name: "app", sizes: [] },
              icns: { name: "app", sizes: [16, 32, 64, 128, 256, 512, 1024] }
            })
            
            let generatedPath = path.join(tmpDir, "app.icns")
            if (fs.existsSync(generatedPath)) {
              fs.copyFileSync(generatedPath, outputPath)
              console.log(`[EXPORT] Wrote main ICNS container to: ${outputPath}`)
              exportedFiles.push(outputPath)
            } else {
              throw new Error("icon-gen failed to produce main app.icns container file")
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
          let w = output.resize.enabled ? targetW : 256
          let h = output.resize.enabled ? targetH : 256
          let pngBuffer = await sharpInstance.resize({
            width: w,
            height: h,
            fit: output.resize.keepAspectRatio ? "contain" : "fill"
          }).png().toBuffer()
          let icoBuffer = await pngToIcoFn(pngBuffer)
          fs.writeFileSync(outputPath, icoBuffer)
          console.log(`[EXPORT] Wrote standard single ICO: ${outputPath}`)
          exportedFiles.push(outputPath)
          continue
        }

        if (outputFormat === "icns") {
          let w = output.resize.enabled ? targetW : 512
          let h = output.resize.enabled ? targetH : 512
          let tmpDir = path.join(app.getPath("temp"), `imageflow_icns_tmp_${Date.now()}`)
          fs.mkdirSync(tmpDir, { recursive: true })
          
          let tmpPngPath = path.join(tmpDir, "icon.png")
          await sharpInstance.resize({
            width: w,
            height: h,
            fit: output.resize.keepAspectRatio ? "contain" : "fill"
          }).png().toFile(tmpPngPath)
          await icongenFn(tmpPngPath, tmpDir, { 
            report: false,
            ico: { name: "app", sizes: [] },
            icns: { name: "app", sizes: [16, 32, 64, 128, 256, 512, 1024] }
          })
          
          let generatedPath = path.join(tmpDir, "app.icns")
          if (fs.existsSync(generatedPath)) {
            fs.copyFileSync(generatedPath, outputPath)
            console.log(`[EXPORT] Wrote standard single ICNS: ${outputPath}`)
            exportedFiles.push(outputPath)
          } else {
            throw new Error("icon-gen failed to produce standard single app.icns file")
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

        console.log(`[EXPORT] Writing standard image: ${outputPath}`)
        await formatInstance.toFile(outputPath)
        console.log(`[EXPORT] Standard image written successfully. Exists: ${fs.existsSync(outputPath)}. Size: ${fs.statSync(outputPath).size} bytes`)
        exportedFiles.push(outputPath)
      }

      console.log(`[EXPORT] Finished export successfully. Total files written: ${exportedFiles.length}`)
      return { success: true, files: exportedFiles, outputFolder }
    } catch (error: any) {
      console.error("[EXPORT] Export failed with error:", error)
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
