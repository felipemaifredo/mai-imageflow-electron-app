//Libs
import { useRef, useEffect } from "react"

//Imports
import { useImageStore } from "@renderer/Lib/hooks/useImageStore"
import styles from "./CropOverlay.module.css"

//Types
import type { CropCoordinates } from "@renderer/Lib/hooks/useImageStore"

//Funcs
function getAspectValue(aspect: string): number | null {
  if (aspect === "free") return null
  const parts = aspect.split(":")
  if (parts.length === 2) {
    const w = parseFloat(parts[0])
    const h = parseFloat(parts[1])
    if (!isNaN(w) && !isNaN(h)) {
      return w / h
    }
  }
  return null
}

//Main
const CropOverlay = () => {
  const { images, selectedImagePath, cropAspect, updateImageCrop } = useImageStore()
  const imageFile = images.find((img) => img.path === selectedImagePath)
  const containerRef = useRef<HTMLDivElement>(null)
  
  if (!imageFile) return null
  const filePath = imageFile.path
  
  const crop = imageFile.crop || { x: 10, y: 10, width: 80, height: 80 }
  const aspect = cropAspect
  const ratio = getAspectValue(aspect)

  useEffect(() => {
    if (ratio) {
      let newW = crop.width
      let newH = crop.width / ratio
      if (newH > 100 - crop.y) {
        newH = 100 - crop.y
        newW = newH * ratio
      }
      if (newW > 100 - crop.x) {
        newW = 100 - crop.x
        newH = newW / ratio
      }
      updateImageCrop(filePath, {
        x: crop.x,
        y: crop.y,
        width: newW,
        height: newH
      }, aspect)
    }
  }, [aspect])

  const dragInfo = useRef<{
    type: string
    startX: number
    startY: number
    startCrop: CropCoordinates
  } | null>(null)

  function handleMouseDown(e: React.MouseEvent, type: string) {
    e.stopPropagation()
    e.preventDefault()
    dragInfo.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop }
    }
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  function handleMouseMove(e: MouseEvent) {
    if (!dragInfo.current || !containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragInfo.current.startX) / containerRect.width) * 100
    const dy = ((e.clientY - dragInfo.current.startY) / containerRect.height) * 100
    const start = dragInfo.current.startCrop
    const type = dragInfo.current.type

    const nextCrop = { ...start }

    if (type === "move") {
      nextCrop.x = Math.max(0, Math.min(100 - start.width, start.x + dx))
      nextCrop.y = Math.max(0, Math.min(100 - start.height, start.y + dy))
    } else {
      if (type === "br") {
        nextCrop.width = Math.max(5, Math.min(100 - start.x, start.width + dx))
        if (ratio) {
          nextCrop.height = nextCrop.width / ratio
          if (nextCrop.y + nextCrop.height > 100) {
            nextCrop.height = 100 - nextCrop.y
            nextCrop.width = nextCrop.height * ratio
          }
        } else {
          nextCrop.height = Math.max(5, Math.min(100 - start.y, start.height + dy))
        }
      } else if (type === "bl") {
        const proposedWidth = start.width - dx
        const proposedX = start.x + dx
        if (proposedX >= 0 && proposedWidth >= 5) {
          nextCrop.x = proposedX
          nextCrop.width = proposedWidth
        }
        if (ratio) {
          nextCrop.height = nextCrop.width / ratio
          if (nextCrop.y + nextCrop.height > 100) {
            nextCrop.height = 100 - nextCrop.y
            nextCrop.width = nextCrop.height * ratio
            nextCrop.x = start.x + (start.width - nextCrop.width)
          }
        } else {
          nextCrop.height = Math.max(5, Math.min(100 - start.y, start.height + dy))
        }
      } else if (type === "tr") {
        nextCrop.width = Math.max(5, Math.min(100 - start.x, start.width + dx))
        const proposedHeight = start.height - dy
        const proposedY = start.y + dy
        if (proposedY >= 0 && proposedHeight >= 5) {
          nextCrop.y = proposedY
          nextCrop.height = proposedHeight
        }
        if (ratio) {
          nextCrop.width = nextCrop.height * ratio
          if (nextCrop.x + nextCrop.width > 100) {
            nextCrop.width = 100 - nextCrop.x
            nextCrop.height = nextCrop.width / ratio
            nextCrop.y = start.y + (start.height - nextCrop.height)
          }
        }
      } else if (type === "tl") {
        const proposedWidth = start.width - dx
        const proposedX = start.x + dx
        const proposedHeight = start.height - dy
        const proposedY = start.y + dy

        if (proposedX >= 0 && proposedWidth >= 5 && proposedY >= 0 && proposedHeight >= 5) {
          nextCrop.x = proposedX
          nextCrop.width = proposedWidth
          nextCrop.y = proposedY
          nextCrop.height = proposedHeight
        }
        if (ratio) {
          if (nextCrop.width / nextCrop.height > ratio) {
            nextCrop.width = nextCrop.height * ratio
            nextCrop.x = start.x + (start.width - nextCrop.width)
          } else {
            nextCrop.height = nextCrop.width / ratio
            nextCrop.y = start.y + (start.height - nextCrop.height)
          }
        }
      }
    }

    updateImageCrop(filePath, nextCrop, aspect)
  }

  function handleMouseUp() {
    dragInfo.current = null
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }

  return (
    <div ref={containerRef} className={styles.overlayContainer}>
      <div
        className={styles.cropBox}
        style={{
          left: `${crop.x}%`,
          top: `${crop.y}%`,
          width: `${crop.width}%`,
          height: `${crop.height}%`
        }}
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        <div className={styles.gridLineH1}></div>
        <div className={styles.gridLineH2}></div>
        <div className={styles.gridLineV1}></div>
        <div className={styles.gridLineV2}></div>

        <div className={`${styles.handle} ${styles.handleTL}`} onMouseDown={(e) => handleMouseDown(e, "tl")}></div>
        <div className={`${styles.handle} ${styles.handleTR}`} onMouseDown={(e) => handleMouseDown(e, "tr")}></div>
        <div className={`${styles.handle} ${styles.handleBL}`} onMouseDown={(e) => handleMouseDown(e, "bl")}></div>
        <div className={`${styles.handle} ${styles.handleBR}`} onMouseDown={(e) => handleMouseDown(e, "br")}></div>
      </div>
    </div>
  )
}

export default CropOverlay
