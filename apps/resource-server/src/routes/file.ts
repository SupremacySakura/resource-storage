import Router from '@koa/router'
import path from 'path'
import koaBody from 'koa-body'
import { authMiddleware } from '../middleware/checkLogin'
import { FileStorageService } from '../services/file-storage'

// 兜底地址
const defaultMetaDir = path.join(__dirname, '../public/meta')
const defaultChunkDir = path.join(__dirname, '../public/chunk')
const defaultFileDir = path.join(__dirname, '../public/files')

// 创建服务
const storage = new FileStorageService(
    process.env.RESOURCE_META_DIR || defaultMetaDir,
    process.env.RESOURCE_CHUNK_DIR || defaultChunkDir,
    process.env.RESOURCE_FILE_DIR || defaultFileDir
)

// 创建路由
const router = new Router({
    prefix: '/file' // 所有 user 路由都会带上这个前缀
})

// 获取文件内容
router.get('/read', async (ctx) => {
    // 验证是否登录
    try {
        const { hash, key } = ctx.query as any
        const { meta, stream } = storage.getReadStream(hash, key)
        ctx.type = path.extname(meta.name)
        ctx.set(
            'Content-Disposition',
            `inline; filename*=UTF-8''${encodeURIComponent(meta.name)}`
        )
        ctx.body = stream
    } catch (e: any) {
        ctx.status = 403
        ctx.body = { success: false, message: e.message }
    }
})

// 分片上传
router.post('/upload', authMiddleware(), koaBody({
    multipart: true,
    formidable: {
        uploadDir: storage.getOptions().chunkDir,
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024,
    },
}),
    async (ctx) => {
        const fileField = ctx.request.files?.file
        if (!fileField) {
            ctx.body = { success: false, message: '没有上传文件' }
            return
        }

        const file = Array.isArray(fileField) ? fileField[0] : fileField

        const data = await storage.handleChunkUpload(file, ctx.request.body)

        ctx.body = { success: true, message: '分片上传成功', data }
    }
)

// 初始化上传
router.post('/init-upload', authMiddleware(), async (ctx) => {
    const { fileHash, path } = ctx.request.body as { fileHash: string, path: string }
    const result = storage.checkUploadStatus(fileHash)

    ctx.body = {
        success: true,
        message: result.status,
        data: result.missing,
    }
})

// 合并文件
router.post('/merge', authMiddleware(), async (ctx) => {
    try {
        const { fileHash } = ctx.request.body as { fileHash: string }
        const result = await storage.mergeFile(fileHash)

        ctx.body = { success: true, message: result }
    } catch (e: any) {
        ctx.body = { success: false, message: e.message }
    }

})

// 获取所有文件，文件列表
router.get('/all', authMiddleware(), async (ctx) => {
    try {
        const files = storage.listFiles()
        ctx.body = { success: true, message: '获取文件列表成功', data: files }
    } catch (e: any) {
        ctx.body = { success: false, message: e.message }
    }
})

// 修改文件权限
router.post('/update-permission', authMiddleware(), async (ctx) => {
    try {
        const { fileHash, role } = ctx.request.body as { fileHash: string, role: 'public' | 'key' }
        const result = storage.updateFilePermission(fileHash, role)

        ctx.body = { success: true, message: result }
    } catch (e: any) {
        ctx.body = { success: false, message: e.message }
    }
})

// 当文件权限为 key 时 生成一个密钥用于访问
router.post('/generate-key', authMiddleware(), async (ctx) => {
    try {
        const { fileHash } = ctx.request.body as { fileHash: string }
        const key = storage.generateKey(fileHash)

        ctx.body = { success: true, message: '密钥生成成功', data: key }
    } catch (e: any) {
        ctx.body = { success: false, message: e.message }
    }
})

// 删除文件及元信息
router.post('/delete', authMiddleware(), async (ctx) => {
    try {
        const { fileHash } = ctx.request.body as { fileHash: string }
        const result = storage.deleteFile(fileHash)

        ctx.body = { success: true, message: result }
    } catch (e: any) {
        ctx.body = { success: false, message: e.message }
    }
})

export default router
