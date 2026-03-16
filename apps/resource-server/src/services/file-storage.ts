import fs from 'fs-extra'
import path from 'path'
import { FileItem } from '../types/file'
import { caculeMissingChunks } from '../utils'
import { randomUUID } from 'crypto'

export class FileStorageService {
    constructor(private metaDir: string, private chunkDir: string, private fileDir: string) {
        fs.ensureDirSync(metaDir)
        fs.ensureDirSync(chunkDir)
        fs.ensureDirSync(fileDir)
    }

    getOptions() {
        return {
            metaDir: this.metaDir,
            chunkDir: this.chunkDir,
            fileDir: this.fileDir,
        }
    }

    /* ========= meta ========= */

    getMeta(hash: string): FileItem | null {
        const metaPath = path.resolve(this.metaDir, `${hash}.json`)
        if (!fs.existsSync(metaPath)) return null
        return fs.readJsonSync(metaPath)
    }

    saveMeta(meta: FileItem) {
        const metaPath = path.resolve(this.metaDir, `${meta.hash}.json`)
        fs.writeJsonSync(metaPath, meta, { spaces: 2 })
    }

    /* ========= chunk ========= */

    getChunkPath(hash: string, index: number) {
        return path.resolve(this.chunkDir, `${hash}-${index}`)
    }

    async saveChunk(hash: string, index: number, tempPath: string) {
        const chunkPath = this.getChunkPath(hash, index)
        await fs.move(tempPath, chunkPath, { overwrite: true })
    }

    /* ========= upload ========= */

    async handleChunkUpload(file: any, body: any) {
        const {
            name,
            hash,
            size,
            path = './',
            chunkCount,
            chunkIndex,
            chunkHash,
            modifiedTime,
        } = body

        await this.saveChunk(hash, chunkIndex, file.filepath)

        let meta = this.getMeta(hash)

        if (!meta) {
            meta = {
                type: 'file',
                hash,
                name,
                path,
                role: 'public',
                size,
                chunkCount,
                chunks: [{ index: chunkIndex, hash: chunkHash }],
                modifiedTime,
            }
        } else if (!meta.chunks.some(c => c.index === chunkIndex)) {
            meta.chunks.push({ index: chunkIndex, hash: chunkHash })
            meta.modifiedTime = modifiedTime
        }

        this.saveMeta(meta)

        return {
            chunkIndex,
            chunkHash,
        }
    }

    /* ========= init upload ========= */

    checkUploadStatus(hash: string) {
        const meta = this.getMeta(hash)
        if (!meta) {
            return { status: 'not-exist', missing: 'all' }
        }

        if (+meta.chunkCount !== meta.chunks.length) {
            return {
                status: 'missing',
                missing: caculeMissingChunks(meta.chunks, meta.chunkCount),
            }
        }

        return { status: 'complete', missing: [] }
    }

    /* ========= merge ========= */

    async mergeFile(hash: string) {
        const meta = this.getMeta(hash)
        if (!meta) throw new Error('META_NOT_FOUND')

        if (+meta.chunkCount !== meta.chunks.length) {
            throw new Error('CHUNK_INCOMPLETE')
        }

        const filePath = path.resolve(this.fileDir, meta.path, meta.name)
        if (fs.existsSync(filePath)) return 'EXIST'
        if (!fs.existsSync(path.resolve(this.fileDir, meta.path))) fs.mkdirSync(path.resolve(this.fileDir, meta.path), { recursive: true })
        const chunks = meta.chunks.sort((a, b) => a.index - b.index)

        const writeStream = fs.createWriteStream(filePath)

        for (const chunk of chunks) {
            const chunkPath = this.getChunkPath(hash, chunk.index)
            if (!fs.existsSync(chunkPath)) {
                throw new Error(`MISSING_CHUNK_${chunk.index}`)
            }

            await new Promise<void>((resolve, reject) => {
                const rs = fs.createReadStream(chunkPath)
                rs.on('end', resolve)
                rs.on('error', reject)
                rs.pipe(writeStream, { end: false })
            })
        }

        writeStream.end()

        // 清理 chunk
        for (const chunk of chunks) {
            await fs.remove(this.getChunkPath(hash, chunk.index))
        }

        return 'MERGED'
    }

    /* ========= read ========= */

    getReadStream(hash: string, key?: string) {
        const meta = this.getMeta(hash)
        if (!meta) throw new Error('NOT_FOUND')

        // 当权限为密钥的时候
        if (meta.role === 'key' && meta.key !== key) {
            throw new Error('FORBIDDEN')
        }

        // if (meta.role === 'private' && !isLogin) {
        //     throw new Error('FORBIDDEN')
        // }

        const filePath = path.resolve(this.fileDir, meta.path, meta.name)
        if (!fs.existsSync(filePath)) {
            throw new Error('FILE_NOT_READY')
        }

        return {
            meta,
            stream: fs.createReadStream(filePath),
        }
    }

    listFiles() {
        let result = []
        const dir = this.metaDir
        if (!fs.existsSync(dir)) return []
        const files = fs.readdirSync(dir)
        for (const file of files) {
            if (!file.endsWith('.json')) continue
            const filepath = path.join(dir, file)
            try {
                const meta = fs.readJSONSync(filepath)
                result.push(meta)
            } catch (e) {
                console.error(`Error reading meta file ${filepath}:`, e)
            }
        }
        return result
    }

    queryFiles(params: { page: number; pageSize: number; keyword?: string; filter?: 'all' | 'document' | 'image' | 'video' }) {
        const page = Number.isFinite(params.page) ? Math.max(1, Math.floor(params.page)) : 1
        const pageSize = Number.isFinite(params.pageSize) ? Math.max(1, Math.floor(params.pageSize)) : 10
        const keyword = (params.keyword || '').trim().toLowerCase()
        const filter = params.filter || 'all'

        const allFiles = this.listFiles() as FileItem[]

        const filtered = keyword
            ? allFiles.filter((item) => {
                const haystacks = [
                    item.hash,
                    item.name,
                    item.path,
                    item.type,
                    item.role,
                ]
                    .filter((v) => typeof v === 'string' && v.length > 0)
                    .map((v) => v.toLowerCase())

                return haystacks.some((v) => v.includes(keyword))
            })
            : allFiles

        const getExt = (filename: string) => {
            const base = filename.split('/').pop() || filename
            const idx = base.lastIndexOf('.')
            if (idx === -1) return ''
            return base.slice(idx + 1).toLowerCase()
        }

        const isImageExt = (ext: string) => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'].includes(ext)
        const isVideoExt = (ext: string) => ['mp4', 'webm', 'mov', 'mkv', 'avi', 'flv', 'm4v'].includes(ext)
        const isAudioExt = (ext: string) => ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext)

        const typeFiltered = filter === 'all'
            ? filtered
            : filtered.filter((item) => {
                const ext = getExt(item.name)
                if (filter === 'image') return isImageExt(ext)
                if (filter === 'video') return isVideoExt(ext)
                if (filter === 'document') return !isImageExt(ext) && !isVideoExt(ext) && !isAudioExt(ext)
                return true
            })

        const sorted = typeFiltered.sort((a, b) => {
            const aTime = Number.isFinite(Date.parse(a.modifiedTime)) ? Date.parse(a.modifiedTime) : 0
            const bTime = Number.isFinite(Date.parse(b.modifiedTime)) ? Date.parse(b.modifiedTime) : 0
            return bTime - aTime
        })

        const total = sorted.length
        const start = (page - 1) * pageSize
        const end = start + pageSize

        return {
            items: sorted.slice(start, end),
            total,
            page,
            pageSize,
        }
    }

    updateFilePermission(hash: string, role: 'public' | 'key') {
        const meta = this.getMeta(hash)
        if (!meta) throw new Error('NOT_FOUND')

        meta.role = role
        this.saveMeta(meta)

        return 'UPDATED'
    }

    generateKey(hash: string) {
        const meta = this.getMeta(hash)
        if (!meta) throw new Error('NOT_FOUND')

        if (meta.role !== 'key') throw new Error('NOT_KEY_FILE')

        meta.key = randomUUID()
        this.saveMeta(meta)

        return meta.key
    }

    async deleteFile(hash: string) {
        const meta = this.getMeta(hash)
        if (!meta) throw new Error('NOT_FOUND')

        // 清理 chunk
        for (const chunk of meta.chunks) {
            await fs.remove(this.getChunkPath(hash, chunk.index))
        }

        // 清理 meta
        await fs.remove(path.resolve(this.metaDir, `${hash}.json`))

        // 清理文件
        await fs.remove(path.resolve(this.fileDir, meta.path, meta.name))
        return 'DELETED'
    }
}
