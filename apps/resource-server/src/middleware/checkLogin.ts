import Koa from 'koa'
import jwt from 'jsonwebtoken'

export const authMiddleware = (block: boolean = true) => {
    return async (ctx: Koa.Context, next: Koa.Next) => {
        try {
            // 从请求头 Authorization 里拿 token，格式: Bearer <token>
            const authHeader = ctx.headers['authorization'] || ''
            const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

            if (!token) {
                ctx.status = 401
                ctx.body = { message: '缺少登录凭证' }
                return
            }
            const payload = jwt.verify(token, process.env.SECRET || 'resource-storage-secret')
            ctx.state.token = token
            await next()
        } catch (error) {
            if (!block) {
                await next()
            }
            console.error('认证中间件错误:', error)
            ctx.status = 401
            ctx.body = { message: '认证失败，登录凭证错误或过期' }
        }
    }
}
