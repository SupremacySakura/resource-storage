# Resource Storage Monorepo

这是一个基于 Monorepo 架构的资源管理系统，提供静态资源的分片上传、断点续传、在线预览及权限管理功能。项目包含服务端（Koa）和 Web 管理端（Vue3）。

## 功能特性

- **大文件上传**：支持文件分片上传，提高上传稳定性。
- **断点续传**：支持上传中断后继续上传，避免重复工作。
- **权限控制**：
  - **Public**：公开访问。
  - **Key**：通过生成的密钥访问。
- **Web 管理界面**：提供可视化的文件列表、上传、权限设置和删除功能。
- **RESTful API**：提供完整的 API 接口，支持第三方集成。

## 目录结构

- **apps/**
  - **resource-server**: 基于 Koa 的后端服务，处理文件存储与 API 请求。
  - **resource-website**: 基于 Vue3 + Vite 的前端管理界面。
- **packages/**: 共享库与工具。

## 快速开始 (Getting Started)

### 1. 环境准备

确保你的环境已安装：
- Node.js (推荐 v16+)
- pnpm

### 2. 安装依赖

在项目根目录下运行：

```bash
pnpm install
```

### 3. 配置项目

#### 服务端配置 (Resource Server)

进入 `apps/resource-server` 目录，复制 `.env.example` 为 `.env` 并按需修改：

```bash
cp apps/resource-server/.env.example apps/resource-server/.env
```

配置项说明：
- `PORT`: 服务端口 (默认 3001)
- `RESOURCE_META_DIR`: 资源元数据存储目录
- `RESOURCE_CHUNK_DIR`: 资源分片存储目录
- `RESOURCE_FILE_DIR`: 资源文件最终存储目录
- `SECRET`: JWT 签名密钥

#### Web 端配置 (Resource Website)

进入 `apps/resource-website` 目录，复制 `.env.example` 为 `.env`：

```bash
cp apps/resource-website/.env.example apps/resource-website/.env
```

配置项说明：
- `VITE_SERVER_URL`: 后端服务地址 (例如 `http://localhost:3001`)

### 4. 启动项目

在根目录下运行以下命令同时启动服务端和 Web 端：

```bash
pnpm dev
```

- 服务端默认运行在: `http://localhost:3001`
- Web 端默认运行在: `http://localhost:5173`

## 默认账号

- **用户名**: `admin`
- **密码**: `123456`

> 可以在 `apps/resource-server/src/config/user.json` 中修改默认账号密码。

## API 文档

如果你不使用 Web 界面，可以通过 API 进行文件操作。

**Base URL**: `http://localhost:3001`

### 1. 认证

#### 登录
获取访问 Token，后续操作需在 Header 中携带 `Authorization: Bearer <token>`。

- **URL**: `/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "admin",
    "password": "123456"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "登录成功",
    "data": "eyJh..." // Token
  }
  ```

### 2. 文件上传流程

文件上传分为三个步骤：**初始化上传 -> 分片上传 -> 合并文件**。

#### Step 1: 初始化上传 (检查状态)
检查文件是否已存在或部分上传。

- **URL**: `/file/init-upload`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "fileHash": "文件MD5值",
    "path": "文件路径"
  }
  ```
- **Response**:
  - `status: 'not-exist'` (未上传，需上传所有分片)
  - `status: 'missing'` (部分上传，返回缺失的分片索引列表)
  - `status: 'exist'` (已存在，实现秒传)

#### Step 2: 分片上传
循环上传文件的每一个切片。

- **URL**: `/file/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: (Binary) 切片文件数据
  - `name`: 文件名
  - `hash`: 文件整体 Hash
  - `size`: 文件总大小
  - `chunkCount`: 切片总数量
  - `chunkIndex`: 当前切片索引
  - `chunkHash`: 当前切片 Hash
  - `modifiedTime`: 文件修改时间

#### Step 3: 合并文件
所有分片上传完成后，调用此接口合并文件。

- **URL**: `/file/merge`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "fileHash": "文件MD5值"
  }
  ```

### 3. 文件管理

#### 获取文件列表
- **URL**: `/file/all`
- **Method**: `GET`

#### 获取文件内容 (下载/预览)
- **URL**: `/file/read`
- **Method**: `GET`
- **Query**:
  - `hash`: 文件 Hash
  - `key`: (可选) 访问密钥，当文件权限为 `key` 时需要

#### 修改文件权限
- **URL**: `/file/update-permission`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "fileHash": "文件MD5值",
    "role": "public" // 或 "key"
  }
  ```

#### 生成访问密钥
当权限为 `key` 时使用。

- **URL**: `/file/generate-key`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "fileHash": "文件MD5值"
  }
  ```

#### 删除文件
- **URL**: `/file/delete`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "fileHash": "文件MD5值"
  }
  ```
