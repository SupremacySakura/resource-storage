import { ChunkItem } from "../types/file"

// 计算缺失哪些分片
const caculeMissingChunks = (chunks: ChunkItem[], chunkCount: number) => {
    const missingChunks: number[] = []
    for (let i = 0; i < chunkCount; i++) {
        const chunk = chunks.find((item) => item.index === i)
        if (!chunk) {
            missingChunks.push(i)
        }
    }
    return missingChunks
}

export {
    caculeMissingChunks
}