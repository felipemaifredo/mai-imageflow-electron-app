//Libs
import { useState } from "react"
import { Play, Image, Crop, Sliders, RefreshCw, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"

//Imports
import { useImageStore } from "@renderer/Lib/hooks/useImageStore"
import { useToastStore } from "@renderer/Lib/hooks/useToastStore"
import styles from "./Pipeline.module.css"

//Types
import type { ResizeSettings, ConversionSettings } from "@renderer/Lib/hooks/useImageStore"

//Main
const Pipeline = () => {
  const {
    images,
    selectedImagePath,
    isCropping,
    addOutput,
    removeOutput,
    updateOutput,
    updateOutputResize,
    updateOutputConversion
  } = useImageStore()

  let { addToast } = useToastStore()

  const currentImage = images.find((img) => img.path === selectedImagePath)
  const [expandedOutputs, setExpandedOutputs] = useState<Record<string, boolean>>({})

  async function handleExport() {
    if (!currentImage) return
    try {
      const destDir = await window.api.selectDestinationDirectory()
      if (!destDir) return

      const result = await window.api.exportImage({
        filePath: currentImage.path,
        crop: currentImage.crop || null,
        outputs: currentImage.outputs,
        destDir
      })

      if (result && result.success) {
        let message = "Imagens exportadas com sucesso!"
        if (result.files && result.files.length === 1) {
          message += `\nSalva em: ${result.files[0]}`
        } else if (result.outputFolder && result.outputFolder !== destDir) {
          message += `\nSalvas na pasta criada em: ${result.outputFolder}`
        } else {
          message += `\nSalvas em: ${destDir}`
        }
        addToast(message, "success")
      } else {
        addToast("Erro ao processar e exportar as imagens:\n" + (result?.error || "Erro desconhecido"), "error")
      }
    } catch (error) {
      console.error("Export error:", error)
      addToast("Erro na exportação: " + error, "error")
    }
  }

  function handleWidthChange(outputId: string, val: number) {
    if (!currentImage) return
    let output = currentImage.outputs.find((out) => out.id === outputId)
    if (!output) return
    let updates: Partial<ResizeSettings> = { width: val }
    if (output.resize?.keepAspectRatio && currentImage.metadata) {
      let ratio = currentImage.metadata.width / currentImage.metadata.height
      if (currentImage.crop) {
        let cropW = (currentImage.crop.width / 100) * currentImage.metadata.width
        let cropH = (currentImage.crop.height / 100) * currentImage.metadata.height
        ratio = cropW / cropH
      }
      updates.height = Math.round(val / ratio)
    }
    updateOutputResize(currentImage.path, outputId, updates)
  }

  function handleHeightChange(outputId: string, val: number) {
    if (!currentImage) return
    let output = currentImage.outputs.find((out) => out.id === outputId)
    if (!output) return
    let updates: Partial<ResizeSettings> = { height: val }
    if (output.resize?.keepAspectRatio && currentImage.metadata) {
      let ratio = currentImage.metadata.width / currentImage.metadata.height
      if (currentImage.crop) {
        let cropW = (currentImage.crop.width / 100) * currentImage.metadata.width
        let cropH = (currentImage.crop.height / 100) * currentImage.metadata.height
        ratio = cropW / cropH
      }
      updates.width = Math.round(val * ratio)
    }
    updateOutputResize(currentImage.path, outputId, updates)
  }

  function toggleExpand(id: string) {
    setExpandedOutputs((prev) => ({
      ...prev,
      [id]: prev[id] === false ? true : false
    }))
  }

  return (
    <div className={styles.container}>
      <span className={styles.title}>Opções de Saída</span>

      {currentImage ? (
        <>
          {/* Active File Card */}
          <div className={styles.activeImageCard}>
            <div className={styles.cardTitle}>
              <Image size={12} />
              <span>Imagem Selecionada</span>
            </div>
            <span className={styles.imageName}>{currentImage.name}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Versões de Saída ({currentImage.outputs.length})
            </span>
            <button className={styles.addOutputButton} onClick={() => addOutput(currentImage.path)}>
              <Plus size={12} />
              Adicionar Versão
            </button>
          </div>

          <div className={styles.section}>
            {/* Option: Crop (Global for the image) */}
            <div className={`${styles.optionCard} ${isCropping ? styles.optionCardActive : ""}`}>
              <div className={styles.optionHeader}>
                <div className={styles.optionLabel}>
                  <Crop size={14} />
                  <span>Recorte Global (Crop)</span>
                </div>
                <span
                  className={`${styles.badge} ${
                    isCropping
                      ? styles.badgeActive
                      : currentImage.crop
                      ? styles.badgeConfigured
                      : ""
                  }`}
                >
                  {isCropping ? "Ajustando" : currentImage.crop ? "Ativo" : "Original"}
                </span>
              </div>
              
              {currentImage.crop && !isCropping && (
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

            {/* List of outputs (Multiple configurations) */}
            {currentImage.outputs.map((output) => {
              const isExpanded = expandedOutputs[output.id] !== false
              return (
                <div key={output.id} className={styles.optionCard} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className={styles.optionHeader} style={{ cursor: "pointer" }} onClick={() => toggleExpand(output.id)}>
                    <div className={styles.optionLabel} style={{ gap: 6 }}>
                      <input
                        type="text"
                        className={styles.headerInput}
                        value={output.name}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateOutput(currentImage.path, output.id, { name: e.target.value })}
                        placeholder="Nome da Saída"
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className={styles.removeButton}
                        disabled={currentImage.outputs.length <= 1}
                        onClick={() => removeOutput(currentImage.path, output.id)}
                        title="Excluir Versão"
                      >
                        <Trash2 size={12} />
                      </button>
                      <button className={styles.removeButton} onClick={() => toggleExpand(output.id)}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={styles.optionContent} style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: 10, gap: 12 }}>
                      {/* Resize Settings inside this Output */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div className={styles.optionHeader}>
                          <div className={styles.optionLabel} style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            <Sliders size={12} />
                            <span>Redimensionar</span>
                          </div>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={output.resize.enabled}
                              onChange={(e) => {
                                let enabled = e.target.checked
                                let updates: any = { enabled }
                                if (enabled && currentImage.metadata) {
                                  let w = currentImage.metadata.width
                                  let h = currentImage.metadata.height
                                  if (currentImage.crop) {
                                    w = Math.round((currentImage.crop.width / 100) * currentImage.metadata.width)
                                    h = Math.round((currentImage.crop.height / 100) * currentImage.metadata.height)
                                  }
                                  updates.width = w
                                  updates.height = h
                                }
                                updateOutputResize(currentImage.path, output.id, updates)
                              }}
                            />
                            <span>Ativar</span>
                          </label>
                        </div>

                        {output.resize.enabled && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 4 }}>
                            <div className={styles.formGroup}>
                              <label>Modo</label>
                              <select
                                className={styles.select}
                                value={output.resize.mode}
                                onChange={(e) => updateOutputResize(currentImage.path, output.id, { mode: e.target.value as "pixels" | "percentage" })}
                              >
                                <option value="pixels">Pixels (Fixo)</option>
                                <option value="percentage">Porcentagem (%)</option>
                              </select>
                            </div>

                            {output.resize.mode === "pixels" ? (
                              <>
                                <div className={styles.inputGrid}>
                                  <div className={styles.formGroup}>
                                    <label>Largura (px)</label>
                                    <input
                                      type="number"
                                      className={styles.input}
                                      value={output.resize.width}
                                      onChange={(e) => handleWidthChange(output.id, Number(e.target.value))}
                                    />
                                  </div>
                                  <div className={styles.formGroup}>
                                    <label>Altura (px)</label>
                                    <input
                                      type="number"
                                      className={styles.input}
                                      value={output.resize.height}
                                      onChange={(e) => handleHeightChange(output.id, Number(e.target.value))}
                                    />
                                  </div>
                                </div>
                                <label className={styles.checkboxRow}>
                                  <input
                                    type="checkbox"
                                    checked={output.resize.keepAspectRatio}
                                    onChange={(e) => updateOutputResize(currentImage.path, output.id, { keepAspectRatio: e.target.checked })}
                                  />
                                  <span>Manter Proporção Original</span>
                                </label>
                              </>
                            ) : (
                              <div className={styles.formGroup}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <label>Escala</label>
                                  <span style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                                    {output.resize.percentage}%
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  className={styles.slider}
                                  min="10"
                                  max="200"
                                  value={output.resize.percentage}
                                  onChange={(e) => updateOutputResize(currentImage.path, output.id, { percentage: Number(e.target.value) })}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Conversion Settings inside this Output */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid rgba(255, 255, 255, 0.03)", paddingTop: 10 }}>
                        <div className={styles.optionHeader}>
                          <div className={styles.optionLabel} style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            <RefreshCw size={12} />
                            <span>Formato & Conversão</span>
                          </div>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={output.conversion.enabled}
                              onChange={(e) => updateOutputConversion(currentImage.path, output.id, { enabled: e.target.checked })}
                            />
                            <span>Ativar</span>
                          </label>
                        </div>

                        {output.conversion.enabled && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 4 }}>
                            <div className={styles.formGroup}>
                              <label>Formato de Saída</label>
                              <select
                                className={styles.select}
                                value={output.conversion.format}
                                onChange={(e) => {
                                  let newFormat = e.target.value as "png" | "jpg" | "webp" | "ico" | "icns"
                                  let updates: Partial<ConversionSettings> = { format: newFormat }
                                  if (!["ico", "icns"].includes(newFormat)) {
                                    updates.generateAllSizes = false
                                  }
                                  updateOutputConversion(currentImage.path, output.id, updates)
                                }}
                              >
                                <option value="png">PNG (.png)</option>
                                <option value="jpg">JPG (.jpg)</option>
                                <option value="webp">WebP (.webp)</option>
                                <option value="ico">Windows Icon (.ico)</option>
                                <option value="icns">macOS Icon (.icns)</option>
                              </select>
                            </div>

                            {["ico", "icns"].includes(output.conversion.format) && (
                              <label className={styles.checkboxRow} style={{ marginTop: 2 }}>
                                <input
                                  type="checkbox"
                                  checked={output.conversion.generateAllSizes || false}
                                  onChange={(e) => updateOutputConversion(currentImage.path, output.id, { generateAllSizes: e.target.checked })}
                                />
                                <span>Gerar todos os tamanhos de ícone de app</span>
                              </label>
                            )}

                            {["jpg", "webp"].includes(output.conversion.format) && (
                              <div className={styles.sliderGroup}>
                                <div className={styles.sliderHeader}>
                                  <span>Qualidade</span>
                                  <span style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>
                                    {output.conversion.quality}%
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  className={styles.slider}
                                  min="10"
                                  max="100"
                                  value={output.conversion.quality}
                                  onChange={(e) => updateOutputConversion(currentImage.path, output.id, { quality: Number(e.target.value) })}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button className={styles.exportButton} onClick={handleExport} style={{ marginTop: 12 }}>
            <Play size={12} />
            Exportar Imagem
          </button>
        </>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "11px", textAlign: "center", padding: "16px" }}>
          Nenhuma imagem importada para ajustar as opções.
        </div>
      )}
    </div>
  )
}

export default Pipeline
