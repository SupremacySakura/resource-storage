/**
 * 计算文件的 SHA-256 哈希值
 * @param file 文件对象或 Blob 对象
 * @returns 文件的 SHA-256 哈希值
 */
export const calculateHash = async (file: File | Blob): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
}
