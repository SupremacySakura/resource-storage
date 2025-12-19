import fs from 'fs-extra'
import Router from '@koa/router'
import path from 'path'
import jwt from 'jsonwebtoken'
import { authMiddleware } from '../middleware/checkLogin'

const router = new Router({
    prefix: '/auth' // 所有 auth 路由都会带上这个前缀
})

interface LoginRequest {
    username: string
    password: string
}

// 登录
router.post('/login', async (ctx) => {
    // 从请求体中获取用户名和密码
    const { username, password } = ctx.request.body as LoginRequest
    // 读取配置文件
    const configPath = path.resolve(__dirname, '../config/user.json')
    const config = fs.readJsonSync(configPath) as LoginRequest
    // 判断用户名
    if (config.username !== username) {
        ctx.body = {
            success: false,
            message: '用户名错误',
            code: 400
        }
        return
    }
    // 判断密码
    if (config.password !== password) {
        ctx.body = {
            success: false,
            message: '密码错误',
            code: 400
        }
        return
    }
    const token = jwt.sign({
        username
    }, process.env.SECRET || 'resource-storage-secret', {
        expiresIn: '2h'
    })
    ctx.body = {
        success: true,
        message: '登录成功',
        data: token,
        code: 200
    }
})

// 验证登录
router.get('/verify', authMiddleware(), async (ctx) => {
    ctx.body = {
        success: true,
        message: '登录有效',
        code: 200
    }
})
export default router