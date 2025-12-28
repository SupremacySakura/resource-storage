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
        if(!fs.existsSync(path.resolve(this.fileDir, meta.path))) fs.mkdirSync(path.resolve(this.fileDir, meta.path),{ recursive: true })
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
