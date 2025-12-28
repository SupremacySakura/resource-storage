// 类型定义

/**
 * 分块项
 */
export interface ChunkItem {
    index: number
    hash: string
}

/**
 * 文件类型
 */
export interface FileItem {
    hash: string
    name: string
    path: string  // 路径，用于存储文件在目录结构中的路径
    role: 'public' | 'key'
    key?: string
    type: 'file'
    size: number
    chunkCount: number
    chunks: ChunkItem[]
    modifiedTime: string
}

/**
 * 上传文件项
 */
export interface UploadFileItem {
    id: number
    file: File
    name: string
    size: number
    status: 'pending' | 'uploading' | 'success' | 'error'
    progress: number
    message?: string
}