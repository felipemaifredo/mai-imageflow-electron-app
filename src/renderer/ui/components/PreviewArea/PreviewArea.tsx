//Libs
import { useEffect, useState, useRef } from "react"
import { ZoomIn, ZoomOut, RotateCcw, Grid, Sun, Moon, Crop, Check } from "lucide-react"

//Imports
import { useImageStore } from "@renderer/Lib/hooks/useImageStore"
import CropOverlay from "../CropOverlay/CropOverlay"
import styles from "./PreviewArea.module.css"

//Main
const PreviewArea = () => {
  const {
    images,
    selectedImagePath,
    zoom,
    pan,
    bgPattern,
    cropAspect,
    isCropping,
    setZoom,
    setPan,
    setBgPattern,
    setCropAspect,
    setIsCropping,
    updateImageMetadata,
    updateImageCrop
  } = useImageStore()

  const currentImage = images.find((img) => img.path === selectedImagePath)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentPath = selectedImagePath
    if (!currentPath) return

    async function fetchMetadata(path: string) {
      try {
        const meta = await window.api.getImageMetadata(path)
        updateImageMetadata(path, meta)
      } catch (err) {
        console.error("Failed to load metadata:", err)
      }
    }

    fetchMetadata(currentPath)
  }, [selectedImagePath])

  function handleWheel(e: React.WheelEvent) {
    if (isCropping) return
    const scaleStep = 0.05
    const nextZoom = e.deltaY < 0
      ? Math.min(zoom + scaleStep, 5)
      : Math.max(zoom - scaleStep, 0.1)
    setZoom(nextZoom)
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (isCropping) return
    setIsPanning(true)
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isPanning || isCropping) return
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    })
  }

  function handleMouseUp() {
    setIsPanning(false)
  }

  function handleReset() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  function toggleCrop() {
    if (!currentImage) return
    const nextCropping = !isCropping
    setIsCropping(nextCropping)
    if (nextCropping && !currentImage.crop) {
      updateImageCrop(currentImage.path, { x: 10, y: 10, width: 80, height: 80 }, cropAspect)
    }
  }

  function formatBytes(bytes: number, decimals = 1) {
    if (!bytes) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  function getBgClass() {
    if (bgPattern === "checkered") return styles.bgCheckered
    if (bgPattern === "dark") return styles.bgDark
    return styles.bgLight
  }

  if (!selectedImagePath || !currentImage) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Nenhuma imagem selecionada</p>
          <p className={styles.emptySub}>Selecione uma imagem na lista lateral para começar</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.topControls}>
        <div className={styles.leftControls}>
          <button
            className={`${styles.controlButton} ${isCropping ? styles.activeButton : ""}`}
            onClick={toggleCrop}
            title={isCropping ? "Confirmar Recorte" : "Cortar Imagem"}
          >
            {isCropping ? <Check size={14} /> : <Crop size={14} />}
            <span>{isCropping ? "Concluído" : "Cortar"}</span>
          </button>
          
          {isCropping && (
            <select
              value={cropAspect}
              onChange={(e) => setCropAspect(e.target.value)}
              className={styles.controlSelect}
            >
              <option value="free">Livre</option>
              <option value="1:1">1:1</option>
              <option value="4:3">4:3</option>
              <option value="3:2">3:2</option>
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
              <option value="21:9">21:9</option>
            </select>
          )}
        </div>

        <div className={styles.rightControls}>
          <button className={styles.controlButton} onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} title="Zoom Out">
            <ZoomOut size={14} />
          </button>
          <span className={styles.zoomIndicator}>{Math.round(zoom * 100)}%</span>
          <button className={styles.controlButton} onClick={() => setZoom(Math.min(5, zoom + 0.1))} title="Zoom In">
            <ZoomIn size={14} />
          </button>
          <button className={styles.controlButton} onClick={handleReset} title="Resetar Visualização">
            <RotateCcw size={14} />
          </button>
          <div style={{ width: 1, height: 16, background: "rgba(255, 255, 255, 0.1)", margin: "0 4px" }} />
          <button
            className={`${styles.controlButton} ${bgPattern === "checkered" ? styles.activeButton : ""}`}
            onClick={() => setBgPattern("checkered")}
            title="Fundo Transparente Xadrez"
          >
            <Grid size={14} />
          </button>
          <button
            className={`${styles.controlButton} ${bgPattern === "dark" ? styles.activeButton : ""}`}
            onClick={() => setBgPattern("dark")}
            title="Fundo Escuro"
          >
            <Moon size={14} />
          </button>
          <button
            className={`${styles.controlButton} ${bgPattern === "light" ? styles.activeButton : ""}`}
            onClick={() => setBgPattern("light")}
            title="Fundo Claro"
          >
            <Sun size={14} />
          </button>
        </div>
      </div>

      <div
        className={`${styles.viewport} ${getBgClass()} ${isPanning ? styles.viewportPanning : ""}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className={styles.canvasWrapper}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center"
          }}
        >
          <img
            src={`imageflow-file://${currentImage.path}`}
            alt={currentImage.name}
            className={styles.previewImage}
            style={
              !isCropping && currentImage.crop
                ? {
                    clipPath: `inset(${currentImage.crop.y}% ${100 - (currentImage.crop.x + currentImage.crop.width)}% ${100 - (currentImage.crop.y + currentImage.crop.height)}% ${currentImage.crop.x}%)`
                  }
                : undefined
            }
          />
          {isCropping && <CropOverlay />}
        </div>
      </div>

      {currentImage.metadata && (
        <div className={styles.infoBar}>
          <div className={styles.infoItem}>
            <span>Dimensões:</span>
            <strong>{currentImage.metadata.width} x {currentImage.metadata.height} px</strong>
          </div>
          <div className={styles.infoItem}>
            <span>Formato:</span>
            <strong>{currentImage.metadata.format.toUpperCase()}</strong>
          </div>
          <div className={styles.infoItem}>
            <span>Tamanho:</span>
            <strong>{formatBytes(currentImage.size)}</strong>
          </div>
        </div>
      )}
    </div>
  )
}

export default PreviewArea
