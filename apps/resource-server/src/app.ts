import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import cors from 'koa2-cors'
import router  from './routes'
import { requestLogger,responseLogger } from './middleware/logger'

const app = new Koa()

// Middleware
app.use(cors({
  origin: '*', // 允许所有来源，也可以设置为特定域名如 'http://localhost:5173'
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposeHeaders: ['Authorization'] // 关键：暴露 Authorization 响应头
}))

app.use(bodyParser())
app.use(requestLogger)
app.use(responseLogger)
app.use(router.routes()).use(router.allowedMethods())

export default app
