//Libs
import { Settings, Play, Image } from "lucide-react"

//Imports
import { useImageStore } from "../../../lib/hooks/useImageStore"
import styles from "./Pipeline.module.css"

//Main
const Pipeline = () => {
  const { images, selectedImagePath, isCropping } = useImageStore()
  const currentImage = images.find((img) => img.path === selectedImagePath)

  return (
    <div className={styles.container}>
      <span className={styles.title}>Pipeline de Processamento</span>

      {currentImage ? (
        <>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <Image size={14} />
              <span>Imagem Ativa</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", wordBreak: "break-all" }}>
              {currentImage.name}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <Settings size={14} />
              <span>Etapas do Pipeline</span>
            </div>

            <div className={styles.pipelineList}>
              {/* Step 1: Import */}
              <div className={styles.step}>
                <div className={`${styles.stepDot} ${styles.stepDotCompleted}`}>1</div>
                <div className={styles.stepContent}>
                  <span className={styles.stepTitle}>Importação</span>
                  <span className={styles.stepDesc}>Arquivo carregado no Workspace</span>
                </div>
              </div>

              {/* Step 2: Crop */}
              <div className={styles.step}>
                <div
                  className={`${styles.stepDot} ${
                    isCropping
                      ? styles.stepDotActive
                      : currentImage.crop
                      ? styles.stepDotCompleted
                      : ""
                  }`}
                >
                  2
                </div>
                <div className={styles.stepContent}>
                  <span className={styles.stepTitle}>Recorte (Crop)</span>
                  <span className={styles.stepDesc}>
                    {isCropping
                      ? "Ajustando área de corte..."
                      : currentImage.crop
                      ? "Área de corte definida"
                      : "Sem corte (imagem inteira)"}
                  </span>

                  {currentImage.crop && (
                    <div className={styles.coordinatesGrid}>
                      <div className={styles.coordItem}>
                        <span className={styles.coordLabel}>X (Início)</span>
                        <span className={styles.coordValue}>{Math.round(currentImage.crop.x)}%</span>
                      </div>
                      <div className={styles.coordItem}>
                        <span className={styles.coordLabel}>Y (Início)</span>
                        <span className={styles.coordValue}>{Math.round(currentImage.crop.y)}%</span>
                      </div>
                      <div className={styles.coordItem}>
                        <span className={styles.coordLabel}>Largura</span>
                        <span className={styles.coordValue}>{Math.round(currentImage.crop.width)}%</span>
                      </div>
                      <div className={styles.coordItem}>
                        <span className={styles.coordLabel}>Altura</span>
                        <span className={styles.coordValue}>{Math.round(currentImage.crop.height)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Resize */}
              <div className={styles.step}>
                <div className={styles.stepDot}>3</div>
                <div className={styles.stepContent}>
                  <span className={styles.stepTitle}>Redimensionamento</span>
                  <span className={styles.stepDesc}>Original (Manter 100%)</span>
                </div>
              </div>

              {/* Step 4: Convert */}
              <div className={styles.step}>
                <div className={styles.stepDot}>4</div>
                <div className={styles.stepContent}>
                  <span className={styles.stepTitle}>Conversão de Formato</span>
                  <span className={styles.stepDesc}>Original (Manter formato)</span>
                </div>
              </div>
            </div>
          </div>

          <button className={`${styles.exportButton} ${styles.exportButtonDisabled}`} disabled>
            <Play size={12} />
            Exportar (Indisponível no MVP 2)
          </button>
        </>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "11px", textAlign: "center", padding: "16px" }}>
          Nenhuma imagem importada para visualizar o pipeline.
        </div>
      )}
    </div>
  )
}

export default Pipeline
