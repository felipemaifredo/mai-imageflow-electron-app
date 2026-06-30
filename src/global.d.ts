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

export interface IElectronAPI {
  selectImages: () => Promise<FileInfo[]>
  selectFolder: () => Promise<FileInfo[]>
  getImageMetadata: (filePath: string) => Promise<ImageMetadata | null>
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

