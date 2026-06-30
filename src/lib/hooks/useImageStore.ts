//Libs
import { create } from "zustand"

//Types
export type CropCoordinates = {
  x: number
  y: number
  width: number
  height: number
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
    const filteredNew = newImages.filter((img) => !existingPaths.has(img.path))
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
    images: state.images.map((img) => img.path === path ? { ...img, metadata } : img)
  })),

  updateImageCrop: (path, crop, aspect) => set((state) => ({
    images: state.images.map((img) => img.path === path ? { ...img, crop, cropAspect: aspect } : img)
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
