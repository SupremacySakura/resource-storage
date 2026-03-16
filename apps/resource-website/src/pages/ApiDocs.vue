<script setup lang="ts">
import { computed, ref } from 'vue'

type HttpMethod = 'GET' | 'POST'

type Endpoint = {
    method: HttpMethod
    path: string
    title: string
    auth: 'none' | 'bearer'
    requestExample: string
    responseExample: string
}

type Section = {
    title: string
    description: string
    endpoints: Endpoint[]
}

const getApiBase = () => {
    let baseUrl = import.meta.env.VITE_SERVER_URL || ''
    if (!baseUrl || baseUrl.startsWith('/')) {
        baseUrl = window.location.origin + baseUrl
    }
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1)
    }
    return `${baseUrl}/api`
}

const apiBase = computed(() => getApiBase())

const sections = computed<Section[]>(() => [
    {
        title: '认证',
        description: '获取 Token，并用于后续需要鉴权的接口。',
        endpoints: [
            {
                method: 'POST',
                path: '/auth/login',
                title: '登录',
                auth: 'none',
                requestExample: `POST ${apiBase.value}/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}`,
                responseExample: `{
  "success": true,
  "message": "登录成功",
  "data": "<token>",
  "code": 200
}`,
            },
            {
                method: 'GET',
                path: '/auth/verify',
                title: '验证登录',
                auth: 'bearer',
                requestExample: `GET ${apiBase.value}/auth/verify
Authorization: Bearer <token>`,
                responseExample: `{
  "success": true,
  "message": "登录有效",
  "code": 200
}`,
            },
        ],
    },
    {
        title: '上传流程',
        description: '上传分为：初始化 -> 分片上传 -> 合并文件。',
        endpoints: [
            {
                method: 'POST',
                path: '/file/init-upload',
                title: '初始化上传（检查状态）',
                auth: 'bearer',
                requestExample: `POST ${apiBase.value}/file/init-upload
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileHash": "<sha256>",
  "path": "./"
}`,
                responseExample: `{
  "success": true,
  "message": "not-exist | missing | complete",
  "data": "all | number[]"
}`,
            },
            {
                method: 'POST',
                path: '/file/upload',
                title: '分片上传',
                auth: 'bearer',
                requestExample: `POST ${apiBase.value}/file/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

form-data:
  name: <文件名>
  hash: <文件整体 sha256>
  size: <文件大小 bytes>
  path: ./ (可选，默认 ./)
  chunkCount: <分片总数>
  chunkIndex: <当前分片索引，从 0 开始>
  chunkHash: <当前分片 sha256>
  modifiedTime: <时间戳或字符串>
  file: <分片二进制>`,
                responseExample: `{
  "success": true,
  "message": "分片上传成功",
  "data": {
    "chunkIndex": 0,
    "chunkHash": "<sha256>"
  }
}`,
            },
            {
                method: 'POST',
                path: '/file/merge',
                title: '合并文件',
                auth: 'bearer',
                requestExample: `POST ${apiBase.value}/file/merge
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileHash": "<sha256>"
}`,
                responseExample: `{
  "success": true,
  "message": "MERGED | EXIST"
}`,
            },
        ],
    },
    {
        title: '文件管理',
        description: '文件列表、预览/下载、权限设置、生成密钥与删除。',
        endpoints: [
            {
                method: 'GET',
                path: '/file/all',
                title: '获取文件列表',
                auth: 'bearer',
                requestExample: `GET ${apiBase.value}/file/all
Authorization: Bearer <token>`,
                responseExample: `{
  "success": true,
  "message": "获取文件列表成功",
  "data": [
    {
      "hash": "<sha256>",
      "name": "example.png",
      "path": "./",
      "role": "public | key",
      "key": "<uuid?>",
      "type": "file",
      "size": 123,
      "chunkCount": 1,
      "chunks": [{ "index": 0, "hash": "<sha256>" }],
      "modifiedTime": "..."
    }
  ]
}`,
            },
            {
                method: 'GET',
                path: '/file/read',
                title: '读取文件内容（预览/下载）',
                auth: 'none',
                requestExample: `GET ${apiBase.value}/file/read?hash=<sha256>
GET ${apiBase.value}/file/read?hash=<sha256>&key=<访问密钥>`,
                responseExample: `成功：直接返回文件流（Content-Disposition: inline）
失败：403
{
  "success": false,
  "message": "NOT_FOUND | FORBIDDEN | FILE_NOT_READY"
}`,
            },
            {
                method: 'POST',
                path: '/file/update-permission',
                title: '修改文件权限',
                auth: 'bearer',
                requestExample: `POST ${apiBase.value}/file/update-permission
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileHash": "<sha256>",
  "role": "public | key"
}`,
                responseExample: `{
  "success": true,
  "message": "UPDATED"
}`,
            },
            {
                method: 'POST',
                path: '/file/generate-key',
                title: '生成访问密钥（role=key 时）',
                auth: 'bearer',
                requestExample: `POST ${apiBase.value}/file/generate-key
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileHash": "<sha256>"
}`,
                responseExample: `{
  "success": true,
  "message": "密钥生成成功",
  "data": "<uuid>"
}`,
            },
            {
                method: 'POST',
                path: '/file/delete',
                title: '删除文件',
                auth: 'bearer',
                requestExample: `POST ${apiBase.value}/file/delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileHash": "<sha256>"
}`,
                responseExample: `{
  "success": true,
  "message": "DELETED"
}`,
            },
        ],
    },
])

const activeSection = ref<string | null>(sections.value[0]?.title || null)

const toggleSection = (title: string) => {
    activeSection.value = activeSection.value === title ? null : title
}
</script>

<template>
    <div class="docs-container">
        <div class="docs-header">
            <div class="title-row">
                <h2 class="title">API 文档</h2>
                <span class="pill base-pill">{{ apiBase }}</span>
            </div>
            <div class="subtitle">
                基础地址为 <span class="mono">{{ apiBase }}</span>，需要登录的接口请在请求头携带
                <span class="mono">Authorization: Bearer &lt;token&gt;</span>。
            </div>
        </div>

        <div class="sections">
            <details v-for="section in sections" :key="section.title" class="section glass-card"
                :open="activeSection === section.title">
                <summary class="section-summary" @click.prevent="toggleSection(section.title)">
                    <div class="section-title">
                        <span class="section-title-text">{{ section.title }}</span>
                        <span class="section-title-desc">{{ section.description }}</span>
                    </div>
                    <span class="chevron" :class="{ open: activeSection === section.title }">›</span>
                </summary>

                <div class="endpoint-list">
                    <div v-for="endpoint in section.endpoints" :key="endpoint.method + endpoint.path"
                        class="endpoint-card">
                        <div class="endpoint-head">
                            <div class="endpoint-left">
                                <span class="pill method-pill" :class="endpoint.method.toLowerCase()">
                                    {{ endpoint.method }}
                                </span>
                                <div class="endpoint-path">
                                    <div class="endpoint-title">{{ endpoint.title }}</div>
                                    <div class="endpoint-url">
                                        <span class="mono">{{ apiBase }}{{ endpoint.path }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="endpoint-right">
                                <span class="pill auth-pill" :class="endpoint.auth">
                                    {{ endpoint.auth === 'bearer' ? '需要登录' : '无需登录' }}
                                </span>
                            </div>
                        </div>

                        <div class="io-grid">
                            <div class="io-block">
                                <div class="io-title">请求示例</div>
                                <pre class="code"><code>{{ endpoint.requestExample }}</code></pre>
                            </div>
                            <div class="io-block">
                                <div class="io-title">响应示例</div>
                                <pre class="code"><code>{{ endpoint.responseExample }}</code></pre>
                            </div>
                        </div>
                    </div>
                </div>
            </details>
        </div>
    </div>
</template>

<style scoped lang="scss">
.docs-container {
    height: 100%;
    padding: 20px;
    padding-bottom: 60px;
    overflow-y: auto;
}

.docs-header {
    margin-bottom: 16px;
}

.title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary);
}

.subtitle {
    margin-top: 10px;
    color: var(--color-text-secondary);
    font-size: 13px;
    line-height: 1.6;
}

.mono {
    font-family: var(--font-family-mono);
    color: var(--color-text-primary);
}

.pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: var(--color-bg-base);
    color: var(--color-text-primary);
    font-size: 12px;
    font-weight: 600;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.base-pill {
    color: var(--color-text-secondary);
    font-weight: 600;
}

.method-pill.get {
    background: rgba(16, 185, 129, 0.12);
    border-color: rgba(16, 185, 129, 0.25);
    color: var(--color-success);
}

.method-pill.post {
    background: rgba(245, 158, 11, 0.12);
    border-color: rgba(245, 158, 11, 0.25);
    color: var(--color-warning);
}

.auth-pill.bearer {
    background: rgba(6, 182, 212, 0.12);
    border-color: rgba(6, 182, 212, 0.25);
    color: var(--color-primary);
}

.auth-pill.none {
    background: rgba(59, 130, 246, 0.10);
    border-color: rgba(59, 130, 246, 0.20);
    color: var(--color-info);
}

.sections {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.section {
    border-radius: 14px;
    overflow: hidden;
    background: var(--color-bg-secondary);
    border: 1px solid var(--border-color);
}

.section-summary {
    list-style: none;
    cursor: pointer;
    padding: 14px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--border-color);
    background: var(--color-bg-secondary);
}

.section-summary::-webkit-details-marker {
    display: none;
}

.section-title {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.section-title-text {
    font-weight: 700;
    color: var(--color-text-primary);
}

.section-title-desc {
    font-size: 12px;
    color: var(--color-text-tertiary);
}

.chevron {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    color: var(--color-text-secondary);
    background: var(--color-bg-base);
    border: 1px solid var(--border-color);
    transform: rotate(0deg);
    transition: transform 0.2s ease, color 0.2s ease, background-color 0.2s ease;
    flex-shrink: 0;
}

.chevron.open {
    transform: rotate(90deg);
    color: var(--color-text-primary);
    background: var(--color-bg-base);
}

.endpoint-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 14px 14px;
    background: var(--color-bg-base);
}

.endpoint-card {
    padding: 14px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    background: var(--color-bg-secondary);
}

.endpoint-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-color);
}

.endpoint-left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
}

.method-tag {
    flex-shrink: 0;
}

.endpoint-path {
    min-width: 0;
}

.endpoint-title {
    font-weight: 600;
    color: var(--color-text-primary);
    line-height: 1.4;
}

.endpoint-url {
    margin-top: 2px;
    font-size: 12px;
    color: var(--color-text-secondary);
    word-break: break-all;
}

.io-grid {
    margin-top: 12px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.io-title {
    font-size: 12px;
    color: var(--color-text-secondary);
    font-weight: 600;
    margin-bottom: 8px;
}

.code {
    margin: 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--color-bg-base);
    border: 1px solid var(--border-color);
    color: var(--color-text-primary);
    overflow: auto;
    max-height: 260px;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: var(--font-family-mono);
    font-size: 12px;
    line-height: 1.5;
}

@media (max-width: 900px) {
    .io-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 600px) {
    .docs-container {
        padding: 12px;
        padding-bottom: 40px;
    }

    .endpoint-card {
        padding: 12px;
    }

    .section-summary {
        padding: 12px;
    }

    .endpoint-list {
        padding: 10px 12px 12px;
    }
}
</style>
