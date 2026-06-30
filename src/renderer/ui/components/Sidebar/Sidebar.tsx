//Libs
import { Plus, FolderPlus, FileImage, Trash2, X } from "lucide-react"

//Imports
import { useImageStore } from "@renderer/Lib/hooks/useImageStore"
import styles from "./Sidebar.module.css"

//Types
import type { ImageFile } from "@renderer/Lib/hooks/useImageStore"

//Main
const Sidebar = () => {
  const { images, selectedImagePath, addImages, removeImage, setSelectedImagePath, clearImages } = useImageStore()

  async function handleSelectFiles() {
    try {
      const selected = await window.api.selectImages()
      if (selected && selected.length > 0) {
        addImages(selected as ImageFile[])
      }
    } catch (error) {
      console.error("Error selecting files:", error)
    }
  }

  async function handleSelectFolder() {
    try {
      const selected = await window.api.selectFolder()
      if (selected && selected.length > 0) {
        addImages(selected as ImageFile[])
      }
    } catch (error) {
      console.error("Error selecting folder:", error)
    }
  }

  function formatBytes(bytes: number, decimals = 2) {
    if (!bytes) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  return (
    <div className={styles.container}>
      <div className={styles.titleSection}>
        <span className={styles.title}>Arquivos</span>
        <div className={styles.buttonGroup}>
          <button className={styles.importButton} onClick={handleSelectFiles} title="Adicionar Arquivos">
            <Plus size={12} />
            Add
          </button>
          <button className={styles.importButton} onClick={handleSelectFolder} title="Adicionar Pasta">
            <FolderPlus size={12} />
            Pasta
          </button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className={styles.emptyState}>
          <FileImage size={28} className={styles.emptyIcon} />
          <p className={styles.emptyText}>
            Arraste imagens ou clique em Add para importar arquivos
          </p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {images.map((img) => {
              const isActive = img.path === selectedImagePath
              return (
                <div
                  key={img.path}
                  className={`${styles.item} ${isActive ? styles.activeItem : ""}`}
                  onClick={() => setSelectedImagePath(img.path)}
                >
                  <div className={styles.thumbnailWrapper}>
                    <img
                      src={`imageflow-file://${img.path}`}
                      alt={img.name}
                      className={styles.thumbnail}
                    />
                  </div>
                  <div className={styles.details}>
                    <span className={styles.name}>{img.name}</span>
                    <span className={styles.meta}>{formatBytes(img.size)}</span>
                  </div>
                  <button
                    className={styles.removeButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage(img.path)
                    }}
                    title="Remover"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )
            })}
          </div>
          <button className={styles.clearButton} onClick={clearImages}>
            <X size={11} />
            Limpar Lista
          </button>
        </>
      )}
    </div>
  )
}

export default Sidebar
