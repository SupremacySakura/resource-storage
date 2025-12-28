import { Picture, Service, VideoCamera } from "@element-plus/icons-vue"

/**
 * 格式化文件大小
 * @param bytes 文件大小（字节）
 * @returns 格式化后的文件大小字符串
 */
export const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 文件扩展名（小写）
 */
export const getExt = (filename: string) => filename.split('.').pop()?.toLowerCase() || ''

/**
 * 获取文件图标组件
 * @param filename 文件名
 * @returns 文件图标组件
 */
export const getFileIcon = (filename: string) => {
    const ext = getExt(filename)
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return Picture
    if (['mp4', 'webm', 'ogg'].includes(ext || '')) return VideoCamera
    if (['mp3', 'wav'].includes(ext || '')) return Service
    return Document
}

/**
 * 判断文件是否为图片格式
 * @param filename 文件名
 * @returns 是否为图片格式
 */
export const isImageExt = (filename: string) => {
    const ext = getExt(filename)
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
}

/**
 * 判断文件是否为视频格式
 * @param filename 文件名
 * @returns 是否为视频格式
 */
export const isVideoExt = (filename: string) => {
    const ext = getExt(filename)
    return ['mp4', 'webm', 'ogg'].includes(ext || '')
}

/**
 * 判断文件是否为音频格式
 * @param filename 文件名
 * @returns 是否为音频格式
 */
export const isAudioExt = (filename: string) => {
    const ext = getExt(filename)
    return ['mp3', 'wav'].includes(ext || '')
}

/**
 * 判断文件是否为文本格式
 * @param filename 文件名
 * @returns 是否为文本格式
 */
export const isTextExt = (filename: string) => {
    const ext = getExt(filename) || ''
    const textExts = [
        'txt', 'md', 'markdown', 'json', 'xml', 'html', 'htm', 'css', 'scss', 'sass', 'less',
        'js', 'ts', 'jsx', 'tsx', 'vue', 'svelte',
        'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs', 'php', 'rb', 'lua', 'pl', 'swift', 'kt',
        'sh', 'bash', 'zsh', 'bat', 'cmd', 'ps1',
        'yaml', 'yml', 'toml', 'ini', 'conf', 'properties', 'env',
        'log', 'sql', 'graphql'
    ]
    return textExts.includes(ext)
}
/**
 * 获取文件图标颜色
 * @param filename 文件名
 * @returns 文件图标颜色
 */
export const getIconColor = (filename: string) => {
    if (isImageExt(filename)) return '#409eff'
    if (isVideoExt(filename)) return '#f56c6c'
    if (isAudioExt(filename)) return '#e6a23c'
    if (isTextExt(filename)) return '#409eff'
    return '#909399'
}