import Router from '@koa/router'
import fileRoutes from './file'
import authRoutes from './auth'

const router = new Router({
    prefix: '/api'
})

router.get('/', (ctx) => {
    ctx.body = '🚀 欢迎来到 Koa 根路径'
})

// 合并其他模块路由
router.use(fileRoutes.routes(), fileRoutes.allowedMethods())
router.use(authRoutes.routes(), authRoutes.allowedMethods())

export default router
