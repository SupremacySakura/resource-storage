// 类型定义

export interface ChunkItem {
    index: number
    hash: string
}

// 文件类型
export interface FileItem {
    hash: string
    name: string
    role: 'public' | 'private' | 'key'
    key?: string
    type: 'file'
    size: number
    chunkCount: number
    chunks: ChunkItem[]
    modifiedTime: string
}
