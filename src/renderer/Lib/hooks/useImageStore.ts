//Libs
import { create } from "zustand"

//Types
export type CropCoordinates = {
  x: number
  y: number
  width: number
  height: number
}

export type ResizeSettings = {
  enabled: boolean
  mode: "pixels" | "percentage"
  width: number
  height: number
  percentage: number
  keepAspectRatio: boolean
}

export type ConversionSettings = {
  enabled: boolean
  format: "png" | "jpg" | "webp" | "ico" | "icns"
  quality: number
  generateAllSizes?: boolean
}

export type OutputSettings = {
  id: string
  name: string
  resize: ResizeSettings
  conversion: ConversionSettings
}

export type ImageFile = {
  path: string
  name: string
  size: number
  metadata?: {
    width: number
    height: number
    format: string
  } | null
  crop?: CropCoordinates | null
  cropAspect?: string
  outputs: OutputSettings[]
}

type ImageStoreState = {
  images: ImageFile[]
  selectedImagePath: string | null
  zoom: number
  pan: { x: number; y: number }
  bgPattern: "checkered" | "dark" | "light"
  cropAspect: string
  isCropping: boolean
  
  addImages: (newImages: ImageFile[]) => void
  removeImage: (path: string) => void
  setSelectedImagePath: (path: string | null) => void
  updateImageMetadata: (path: string, metadata: { width: number; height: number; format: string } | null) => void
  updateImageCrop: (path: string, crop: CropCoordinates | null, aspect: string) => void
  addOutput: (path: string) => void
  removeOutput: (path: string, outputId: string) => void
  updateOutput: (path: string, outputId: string, updates: Partial<OutputSettings>) => void
  updateOutputResize: (path: string, outputId: string, resize: Partial<ResizeSettings>) => void
  updateOutputConversion: (path: string, outputId: string, conversion: Partial<ConversionSettings>) => void
  setZoom: (zoom: number) => void
  setPan: (pan: { x: number; y: number }) => void
  setBgPattern: (pattern: "checkered" | "dark" | "light") => void
  setCropAspect: (aspect: string) => void
  setIsCropping: (isCropping: boolean) => void
  clearImages: () => void
}

//Main
export const useImageStore = create<ImageStoreState>((set) => ({
  images: [],
  selectedImagePath: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  bgPattern: "checkered",
  cropAspect: "free",
  isCropping: false,

  addImages: (newImages) => set((state) => {
    const existingPaths = new Set(state.images.map((img) => img.path))
    const filteredNew = newImages.map((img) => ({
      ...img,
      outputs: img.outputs || [
        {
          id: `original-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: "Original",
          resize: {
            enabled: false,
            mode: "pixels" as const,
            width: img.metadata?.width || 800,
            height: img.metadata?.height || 600,
            percentage: 100,
            keepAspectRatio: true
          },
          conversion: {
            enabled: false,
            format: "png" as const,
            quality: 80,
            generateAllSizes: false
          }
        }
      ]
    })).filter((img) => !existingPaths.has(img.path))
    const combined = [...state.images, ...filteredNew]
    return {
      images: combined,
      selectedImagePath: state.selectedImagePath || (combined[0] ? combined[0].path : null)
    }
  }),

  removeImage: (path) => set((state) => {
    const remaining = state.images.filter((img) => img.path !== path)
    let nextSelected = state.selectedImagePath
    if (state.selectedImagePath === path) {
      nextSelected = remaining[0] ? remaining[0].path : null
    }
    return {
      images: remaining,
      selectedImagePath: nextSelected
    }
  }),

  setSelectedImagePath: (path) => set({
    selectedImagePath: path,
    zoom: 1,
    pan: { x: 0, y: 0 }
  }),

  updateImageMetadata: (path, metadata) => set((state) => ({
    images: state.images.map((img) => {
      if (img.path === path) {
        const nextOutputs = img.outputs.map((out) => {
          if (!out.resize.enabled && metadata) {
            return {
              ...out,
              resize: {
                ...out.resize,
                width: metadata.width,
                height: metadata.height
              }
            }
          }
          return out
        })
        return {
          ...img,
          metadata,
          outputs: nextOutputs
        }
      }
      return img
    })
  })),

  updateImageCrop: (path, crop, aspect) => set((state) => ({
    images: state.images.map((img) => img.path === path ? { ...img, crop, cropAspect: aspect } : img)
  })),

  addOutput: (path) => set((state) => ({
    images: state.images.map((img) => {
      if (img.path === path) {
        return {
          ...img,
          outputs: [
            ...img.outputs,
            {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: `Saída ${img.outputs.length + 1}`,
              resize: {
                enabled: false,
                mode: "pixels" as const,
                width: img.metadata?.width || 800,
                height: img.metadata?.height || 600,
                percentage: 100,
                keepAspectRatio: true
              },
              conversion: {
                enabled: false,
                format: "png" as const,
                quality: 80,
                generateAllSizes: false
              }
            }
          ]
        }
      }
      return img
    })
  })),

  removeOutput: (path, outputId) => set((state) => ({
    images: state.images.map((img) => {
      if (img.path === path) {
        if (img.outputs.length <= 1) return img
        return {
          ...img,
          outputs: img.outputs.filter((out) => out.id !== outputId)
        }
      }
      return img
    })
  })),

  updateOutput: (path, outputId, updates) => set((state) => ({
    images: state.images.map((img) => {
      if (img.path === path) {
        return {
          ...img,
          outputs: img.outputs.map((out) => out.id === outputId ? { ...out, ...updates } : out)
        }
      }
      return img
    })
  })),

  updateOutputResize: (path, outputId, resize) => set((state) => ({
    images: state.images.map((img) => {
      if (img.path === path) {
        return {
          ...img,
          outputs: img.outputs.map((out) =>
            out.id === outputId
              ? { ...out, resize: { ...out.resize, ...resize } as ResizeSettings }
              : out
          )
        }
      }
      return img
    })
  })),

  updateOutputConversion: (path, outputId, conversion) => set((state) => ({
    images: state.images.map((img) => {
      if (img.path === path) {
        return {
          ...img,
          outputs: img.outputs.map((out) =>
            out.id === outputId
              ? { ...out, conversion: { ...out.conversion, ...conversion } as ConversionSettings }
              : out
          )
        }
      }
      return img
    })
  })),

  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),
  setBgPattern: (bgPattern) => set({ bgPattern }),
  setCropAspect: (cropAspect) => set({ cropAspect }),
  setIsCropping: (isCropping) => set({ isCropping }),
  
  clearImages: () => set({
    images: [],
    selectedImagePath: null,
    zoom: 1,
    pan: { x: 0, y: 0 },
    isCropping: false
  })
}))
