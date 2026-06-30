/// <reference types="vite/client" />

export type FileInfo = {
  path: string
  name: string
  size: number
}

export type ImageMetadata = {
  width: number
  height: number
  format: string
  space: string
}

export type OutputSettings = {
  id: string
  name: string
  resize: {
    enabled: boolean
    mode: "pixels" | "percentage"
    width: number
    height: number
    percentage: number
    keepAspectRatio: boolean
  }
  conversion: {
    enabled: boolean
    format: "png" | "jpg" | "webp" | "ico" | "icns"
    quality: number
    generateAllSizes?: boolean
  }
}

export type ExportOptions = {
  filePath: string
  crop: { x: number; y: number; width: number; height: number } | null
  outputs: OutputSettings[]
  destDir: string
}

export interface IElectronAPI {
  selectImages: () => Promise<FileInfo[]>
  selectFolder: () => Promise<FileInfo[]>
  getImageMetadata: (filePath: string) => Promise<ImageMetadata | null>
  selectDestinationDirectory: () => Promise<string | null>
  exportImage: (options: ExportOptions) => Promise<any>
}

declare global {
  interface Window {
    api: IElectronAPI
  }
}

declare module "*.module.css" {
  const classes: { [key: string]: string }
  export default classes
}
