<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, View, Lock, Key, Warning, CopyDocument, Close, Delete, Folder, CaretRight } from '@element-plus/icons-vue'
import { getFileList, updateFilePermission, generateKey, deleteFile } from '../services/apis/files'
import { useUserStore } from '../stores/user'
import { formatSize, getFileIcon, isImageExt, isVideoExt, isTextExt, getIconColor } from '../utils/file'
import { formatDate } from '../utils/common'
import type { FileItem } from '../types/file'


const userStore = useUserStore()
const fileList = ref<FileItem[]>([])
const selectedFile = ref<FileItem | null>(null)
const loading = ref(false)
const operationVisible = ref(false)
const operationTab = ref<'permission' | 'key' | 'delete'>('permission')
const selectedRole = ref<'public' | 'key'>('public')
const updating = ref(false)
const generating = ref(false)
const deleting = ref(false)
const generatedKey = ref<string>('')
const infoVisible = ref(false)

const expandedDirs = ref<Set<string>>(new Set())

const toggleDir = (dirPath: string) => {
    if (expandedDirs.value.has(dirPath)) {
        expandedDirs.value.delete(dirPath)
    } else {
        expandedDirs.value.add(dirPath)
    }
}

const displayItems = computed(() => {
    const root: any = { children: {} }

    fileList.value.forEach(file => {
        let p = file.path || './'
        if (p.startsWith('./')) p = p.slice(2)
        if (p === '.') p = ''
        if (p.endsWith('/')) p = p.slice(0, -1)

        const parts = p ? p.split('/') : []

        let current = root
        let currentPath = ''

        parts.forEach(part => {
            if (!part) return
            if (!current.children[part]) {
                const newPath = currentPath ? `${currentPath}/${part}` : part
                current.children[part] = {
                    name: part,
                    isDir: true,
                    children: {},
                    fullPath: newPath
                }
            }
            current = current.children[part]
            currentPath = current.fullPath
        })

        current.children[file.name] = {
            name: file.name,
            isDir: false,
            file: file
        }
    })

    const result: any[] = []
    const flatten = (node: any, level: number) => {
        const children = Object.values(node.children || {}).sort((a: any, b: any) => {
            if (a.isDir && !b.isDir) return -1
            if (!a.isDir && b.isDir) return 1
            return a.name.localeCompare(b.name)
        })

        children.forEach((child: any) => {
            result.push({
                ...child,
                level,
                key: child.isDir ? `dir-${child.fullPath}` : `file-${child.file.hash}`
            })

            if (child.isDir && expandedDirs.value.has(child.fullPath)) {
                flatten(child, level + 1)
            }
        })
    }

    flatten(root, 0)
    return result
})

const handleItemClick = (item: any) => {
    if (item.isDir) {
        toggleDir(item.fullPath)
    } else {
        handleSelect(item.file)
    }
}

const fetchFiles = async () => {
    loading.value = true
    try {
        const res = await getFileList(userStore.token)
        if (res.success) {
            fileList.value = res.data
        } else {
            ElMessage.error(res.message || 'Failed to fetch file list')
        }
    } catch (error) {
        console.error(error)
        ElMessage.error('Error fetching file list')
    } finally {
        loading.value = false
    }
}

const handleSelect = (file: FileItem) => {
    selectedFile.value = file
    selectedRole.value = file.role
    generatedKey.value = file.key || ''
}

const previewUrl = computed(() => {
    if (!selectedFile.value) return ''
    const { hash, key } = selectedFile.value
    // Assuming the server address is localhost:3001, in production should be env variable
    const API_BASE = import.meta.env.VITE_SERVER_URL + '/api'
    if (key) {
        return `${API_BASE}/file/read?hash=${hash}&key=${key}`
    }
    return `${API_BASE}/file/read?hash=${hash}`
})

const isImage = computed(() => {
    if (!selectedFile.value) return false
    return isImageExt(selectedFile.value.name)
})

const isVideo = computed(() => {
    if (!selectedFile.value) return false
    return isVideoExt(selectedFile.value.name)
})

const isText = computed(() => {
    if (!selectedFile.value) return false
    return isTextExt(selectedFile.value.name)
})
       
const textContent = ref('')
const loadingText = ref(false)

watch(selectedFile, async (newFile) => {
    if (newFile && isText.value) {
        loadingText.value = true
        textContent.value = ''
        try {
            const { hash, key } = newFile
            const API_BASE = import.meta.env.VITE_SERVER_URL + '/api'
            let url = `${API_BASE}/file/read?hash=${hash}`
            if (key) url += `&key=${key}`

            const res = await fetch(url)
            if (res.ok) {
                textContent.value = await res.text()
            } else {
                textContent.value = 'Failed to load file content: ' + res.statusText
            }
        } catch (e) {
            textContent.value = 'Error loading file content.'
        } finally {
            loadingText.value = false
        }
    }
})

const openOperation = () => {
    if (!selectedFile.value) {
        ElMessage.warning('请先选择文件')
        return
    }
    selectedRole.value = selectedFile.value.role
    generatedKey.value = selectedFile.value.key || ''
    operationTab.value = 'permission'
    operationVisible.value = true
}

const openInfo = () => {
    if (!selectedFile.value) {
        ElMessage.warning('请先选择文件')
        return
    }
    infoVisible.value = true
}

const doUpdatePermission = async () => {
    if (!selectedFile.value) return
    updating.value = true
    try {
        const res = await updateFilePermission(selectedFile.value.hash, selectedRole.value, userStore.token)
        if (res.success) {
            selectedFile.value.role = selectedRole.value
            ElMessage.success('文件权限已更新')
        } else {
            ElMessage.error(res.message || '更新权限失败')
        }
    } catch (e) {
        ElMessage.error('更新权限出错')
    } finally {
        updating.value = false
    }
}

const doGenerateKey = async () => {
    if (!selectedFile.value) return
    if (selectedFile.value.role !== 'key') {
        ElMessage.warning('请先将权限设置为 key')
        operationTab.value = 'permission'
        return
    }
    generating.value = true
    try {
        const res = await generateKey(selectedFile.value.hash, userStore.token)
        if (res.success) {
            const key = res.data || ''
            generatedKey.value = key
            selectedFile.value.key = key
            ElMessage.success('Key 已生成')
        } else {
            ElMessage.error(res.message || '生成 Key 失败')
        }
    } catch (e) {
        ElMessage.error('生成 Key 出错')
    } finally {
        generating.value = false
    }
}

const doDeleteFile = async () => {
    if (!selectedFile.value) return
    try {
        await ElMessageBox.confirm(
            '确定要删除此文件吗？此操作无法撤销。',
            '删除确认',
            {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        deleting.value = true
        const res = await deleteFile(selectedFile.value.hash, userStore.token)
        if (res.success) {
            ElMessage.success('文件已删除')
            operationVisible.value = false
            selectedFile.value = null
            await fetchFiles()
        } else {
            ElMessage.error(res.message || '删除失败')
        }
    } catch (e) {
        if (e !== 'cancel') {
            ElMessage.error('删除操作失败')
        }
    } finally {
        deleting.value = false
    }
}

const copyKey = async () => {
    if (!generatedKey.value) return
    try {
        await navigator.clipboard.writeText(generatedKey.value)
        ElMessage.success('已复制到剪贴板')
    } catch {
        ElMessage.error('复制失败')
    }
}

onMounted(() => {
    fetchFiles()
})

</script>

<template>
    <div class="list-container" v-loading="loading">
        <el-row :gutter="0" class="full-height">
            <!-- Left: File List -->
            <el-col :span="6" class="col-list">
                <el-card class="box-card full-height"
                    :body-style="{ padding: '0px', height: '100%', overflow: 'auto' }">
                    <template #header>
                        <div class="card-header">
                            <span>文件列表</span>
                            <el-button link type="primary" @click="fetchFiles">刷新</el-button>
                        </div>
                    </template>
                    <div v-if="fileList.length === 0" class="empty-list">
                        No files found.
                    </div>
                    <ul v-else class="file-list-ul">
                        <li v-for="item in displayItems" :key="item.key"
                            :class="{ active: !item.isDir && selectedFile?.hash === item.file.hash }"
                            @click="handleItemClick(item)" :style="{ paddingLeft: (12 + item.level * 20) + 'px' }">
                            <span class="caret-wrapper">
                                <el-icon v-if="item.isDir" class="caret-icon"
                                    :class="{ expanded: expandedDirs.has(item.fullPath) }">
                                    <CaretRight />
                                </el-icon>
                            </span>
                            <el-icon class="file-icon" :style="{ color: getIconColor(item.name) }">
                                <component :is="item.isDir ? Folder : getFileIcon(item.name)" />
                            </el-icon>
                            <span class="file-name" :title="item.name">{{ item.name }}</span>
                        </li>
                    </ul>
                </el-card>
            </el-col>

            <!-- Right: Preview & Metadata -->
            <el-col :span="18" class="col-preview">
                <el-card class="box-card full-height"
                    :body-style="{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' }">
                    <template #header>
                        <div class="card-header">
                            <span>文件详情</span>
                            <div class="header-actions">
                                <el-button type="primary" @click="openOperation">操作</el-button>
                                <el-button @click="openInfo">信息</el-button>
                            </div>
                        </div>
                    </template>
                    <div v-if="!selectedFile" class="empty-preview">
                        Select a file to view details and preview
                    </div>
                    <div v-else class="file-detail-container">

                        <!-- Preview Section -->
                        <div class="preview-section">
                            <div class="preview-header">预览</div>
                            <div class="preview-content">
                                <img v-if="isImage" :src="previewUrl" class="preview-media" />
                                <video v-else-if="isVideo" :src="previewUrl" controls class="preview-media"></video>
                                <div v-else-if="isText" class="text-preview" v-loading="loadingText">
                                    <pre><code>{{ textContent }}</code></pre>
                                </div>
                                <div v-else class="no-preview">
                                    <el-icon :size="64">
                                        <Document />
                                    </el-icon>
                                    <p>Preview not available for this file type.</p>
                                    <a :href="previewUrl" target="_blank" class="download-link">
                                        <el-button type="primary" link>Download / Open in new tab</el-button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-dialog v-model="operationVisible" width="700px" class="operation-dialog" align-center :show-close="false">
            <template #header>
                <div class="dialog-header">
                    <span>操作控制台</span>
                    <el-button link class="close-btn" @click="operationVisible = false">
                        <el-icon>
                            <Close />
                        </el-icon>
                    </el-button>
                </div>
            </template>
            <div class="op-container">
                <div class="op-left">
                    <el-menu :default-active="operationTab" class="op-menu"
                        @select="(key: string) => operationTab = key as any">
                        <el-menu-item index="permission">
                            <el-icon>
                                <Lock />
                            </el-icon>
                            <span>权限设置</span>
                        </el-menu-item>
                        <el-menu-item index="key">
                            <el-icon>
                                <Key />
                            </el-icon>
                            <span>生成 Key</span>
                        </el-menu-item>
                        <el-menu-item index="delete">
                            <el-icon>
                                <Delete />
                            </el-icon>
                            <span>删除文件</span>
                        </el-menu-item>
                    </el-menu>
                </div>
                <div class="op-right">
                    <div v-if="operationTab === 'permission'" class="op-section">
                        <div class="op-header">
                            <div class="op-title">更改文件权限</div>
                            <div class="op-subtitle">设置文件的访问级别，公开或需要密钥。</div>
                        </div>

                        <div class="permission-card">
                            <el-radio-group v-model="selectedRole" class="role-group">
                                <div class="role-option" :class="{ active: selectedRole === 'public' }"
                                    @click="selectedRole = 'public'">
                                    <div class="role-icon"><el-icon>
                                            <View />
                                        </el-icon></div>
                                    <div class="role-info">
                                        <div class="role-name">公开访问</div>
                                        <div class="role-desc">任何人都可以访问此文件</div>
                                    </div>
                                    <el-radio label="public" class="role-radio"><span /></el-radio>
                                </div>
                                <div class="role-option" :class="{ active: selectedRole === 'key' }"
                                    @click="selectedRole = 'key'">
                                    <div class="role-icon"><el-icon>
                                            <Lock />
                                        </el-icon></div>
                                    <div class="role-info">
                                        <div class="role-name">密钥访问</div>
                                        <div class="role-desc">需要有效的 Key 才能访问</div>
                                    </div>
                                    <el-radio label="key" class="role-radio"><span /></el-radio>
                                </div>
                            </el-radio-group>
                        </div>

                        <div class="op-actions">
                            <el-button type="primary" size="large" :loading="updating"
                                @click="doUpdatePermission">保存更改</el-button>
                        </div>
                    </div>
                    <div v-else-if="operationTab === 'key'" class="op-section">
                        <div class="op-header">
                            <div class="op-title">生成访问 Key</div>
                            <div class="op-subtitle">当文件权限为密钥访问时，生成用于验证的 Key。</div>
                        </div>

                        <div class="key-gen-area">
                            <div v-if="selectedFile?.role !== 'key'" class="warning-box">
                                <el-icon>
                                    <Warning />
                                </el-icon>
                                <span>请先将文件权限设置为“密钥访问”</span>
                                <el-button link type="primary" @click="operationTab = 'permission'">去设置</el-button>
                            </div>

                            <template v-else>
                                <div class="op-actions">
                                    <el-button type="primary" size="large" :loading="generating" @click="doGenerateKey">
                                        {{ generatedKey ? '重新生成 Key' : '生成 Key' }}
                                    </el-button>
                                </div>

                                <div v-if="generatedKey" class="key-result-box">
                                    <div class="key-label">生成的 Key</div>
                                    <div class="key-content">
                                        <el-input v-model="generatedKey" readonly>
                                            <template #append>
                                                <el-button @click="copyKey">
                                                    <el-icon>
                                                        <CopyDocument />
                                                    </el-icon>
                                                </el-button>
                                            </template>
                                        </el-input>
                                    </div>
                                    <div class="key-tip">请妥善保管此 Key，用于文件访问验证。</div>
                                </div>
                            </template>
                        </div>
                    </div>
                    <div v-else-if="operationTab === 'delete'" class="op-section">
                        <div class="op-header">
                            <div class="op-title">删除文件</div>
                            <div class="op-subtitle">永久删除此文件及其所有数据。</div>
                        </div>

                        <div class="delete-area">
                            <div class="warning-box danger">
                                <el-icon>
                                    <Warning />
                                </el-icon>
                                <div class="warning-content">
                                    <div class="warning-title">警告</div>
                                    <div class="warning-text">此操作将永久删除该文件，包括所有分片数据和访问权限设置。此操作无法恢复。</div>
                                </div>
                            </div>

                            <div class="op-actions">
                                <el-button type="danger" size="large" :loading="deleting" @click="doDeleteFile">
                                    确认删除
                                </el-button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </el-dialog>

        <el-dialog v-model="infoVisible" width="600px" class="info-dialog" align-center title="文件详细信息">
            <div v-if="selectedFile" class="info-content">
                <el-descriptions :column="1" border class="info-desc">
                    <el-descriptions-item label="文件名">
                        <span class="text-strong">{{ selectedFile.name }}</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="文件大小">{{ formatSize(selectedFile.size) }}</el-descriptions-item>
                    <el-descriptions-item label="文件地址">{{ selectedFile.path }}</el-descriptions-item>
                    <el-descriptions-item label="权限">
                        <el-tag :type="selectedFile.role === 'public' ? 'success' : 'warning'" size="small"
                            effect="dark">
                            {{ selectedFile.role === 'public' ? '公开' : '密钥' }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="修改时间">{{ formatDate(selectedFile.modifiedTime)
                        }}</el-descriptions-item>
                    <el-descriptions-item label="分片进度">
                        <el-progress
                            :percentage="Math.round((selectedFile.chunks.length / selectedFile.chunkCount) * 100)"
                            :status="selectedFile.chunks.length === selectedFile.chunkCount ? 'success' : ''" />
                    </el-descriptions-item>
                    <el-descriptions-item label="文件哈希">
                        <div class="code-block">{{ selectedFile.hash }}</div>
                    </el-descriptions-item>
                    <el-descriptions-item label="预览链接">
                        <div class="code-block link-block">{{ previewUrl }}</div>
                    </el-descriptions-item>
                </el-descriptions>
            </div>
            <template #footer>
                <el-button @click="infoVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped>
.list-container {
    height: 100%;
    padding: 0;
    background-color: transparent;
}

.full-height {
    height: 100%;
}

.col-list,
.col-preview {
    height: 100%;
}

.box-card {
    display: flex;
    flex-direction: column;
    border: none;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
}

.col-list .box-card {
    border-right: 1px solid #ebeef5;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    color: #303133;
    padding: 0 10px;
    /* Add some horizontal padding to header */
    height: 32px;
    /* Ensure consistent height for alignment */
}

.header-actions {
    display: flex;
    gap: 12px;
}

/* File List Styles */
.file-list-ul {
    list-style: none;
    padding: 8px;
    margin: 0;
}

.file-list-ul li {
    padding: 8px 12px;
    margin-bottom: 2px;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: all 0.1s ease;
    color: #1f2329;
    font-size: 14px;
    height: 36px;
    box-sizing: border-box;
}

.file-list-ul li:hover {
    background-color: #eff0f1;
    color: #1f2329;
}

.file-list-ul li.active {
    background-color: #e4f2ff;
    color: #0066cc;
    font-weight: 500;
}

.caret-wrapper {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 2px;
    color: #8f959e;
    flex-shrink: 0;
}

.caret-icon {
    font-size: 12px;
    transition: transform 0.2s ease;
}

.caret-icon.expanded {
    transform: rotate(90deg);
}

.file-icon {
    margin-right: 8px;
    font-size: 18px;
    display: flex;
    align-items: center;
}

/* Specific icon colors if needed, but getFileIcon handles type logic. 
   We can style the icon wrapper color here if we want generic folder color */
.file-icon :deep(svg) {
    /* Ensure svg inherits color */
}

.file-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    font-size: 14px;
    line-height: 20px;
}

.empty-list,
.empty-preview {
    color: #909399;
    text-align: center;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 10px;
    font-size: 14px;
}

.file-detail-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 20px;
}

.preview-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 20px;
    background-color: #fff;
}

.preview-header {
    font-weight: 600;
    margin-bottom: 16px;
    color: #303133;
    font-size: 15px;
}

.preview-content {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background-color: #f8fafc;
    border-radius: 6px;
    border: 1px dashed #dcdfe6;
}

.preview-media {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.text-preview {
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: #f8fafc;
    padding: 16px;
    border-radius: 6px;
    text-align: left;
    box-sizing: border-box;
}

.text-preview pre {
    margin: 0;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #333;
    white-space: pre-wrap;
    word-break: break-all;
}

.no-preview {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: #909399;
}

/* Operation Dialog Styles */
.dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.op-container {
    display: flex;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    overflow: hidden;
    height: 420px;
    background-color: #fff;
}

.op-left {
    width: 200px;
    background-color: #f5f7fa;
    border-right: 1px solid #ebeef5;
    flex-shrink: 0;
}

.op-menu {
    border-right: none;
    background-color: transparent;
}

.op-menu :deep(.el-menu-item) {
    height: 50px;
    line-height: 50px;
    margin: 4px 8px;
    border-radius: 6px;
}

.op-menu :deep(.el-menu-item.is-active) {
    background-color: #fff;
    color: #409EFF;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.op-right {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
}

.op-header {
    margin-bottom: 24px;
}

.op-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
}

.op-subtitle {
    font-size: 14px;
    color: #909399;
}

/* Permission Card Styles */
.permission-card {
    margin-bottom: 30px;
}

.role-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
}

.role-option {
    display: flex;
    align-items: center;
    padding: 16px;
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
}

.role-option:hover {
    border-color: #c0c4cc;
    background-color: #fafafa;
}

.role-option.active {
    border-color: #409EFF;
    background-color: #ecf5ff;
}

.role-icon {
    font-size: 24px;
    margin-right: 16px;
    color: #909399;
    display: flex;
}

.role-option.active .role-icon {
    color: #409EFF;
}

.role-info {
    flex: 1;
}

.role-name {
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
}

.role-desc {
    font-size: 12px;
    color: #909399;
}

.role-radio {
    margin-left: 10px;
    pointer-events: none;
}

/* Key Gen Styles */
.warning-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    background-color: #fdf6ec;
    border-radius: 8px;
    color: #e6a23c;
    gap: 12px;
}

.warning-box .el-icon {
    font-size: 32px;
}

.key-gen-area {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.key-result-box {
    background-color: #f5f7fa;
    padding: 20px;
    border-radius: 8px;
    border: 1px dashed #dcdfe6;
}

.key-label {
    font-size: 14px;
    font-weight: 600;
    color: #606266;
    margin-bottom: 8px;
}

.key-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
}

/* Info Dialog Styles */
.info-desc :deep(.el-descriptions__label) {
    width: 100px;
    color: #606266;
}

.text-strong {
    font-weight: 600;
    color: #303133;
}

.code-block {
    font-family: monospace;
    background-color: #f5f7fa;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #606266;
    word-break: break-all;
    white-space: pre-wrap;
    max-height: 100px;
    overflow-y: auto;
}

.link-block {
    color: #409EFF;
}

/* Delete Area Styles */
.delete-area {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.warning-box.danger {
    background-color: #fef0f0;
    color: #f56c6c;
    border: 1px solid #fde2e2;
    flex-direction: row;
    align-items: flex-start;
    text-align: left;
    padding: 20px;
}

.warning-box.danger .el-icon {
    font-size: 24px;
    margin-top: 2px;
    margin-right: 12px;
}

.warning-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.warning-title {
    font-weight: 600;
    font-size: 16px;
    color: #f56c6c;
}

.warning-text {
    font-size: 14px;
    color: #f56c6c;
    opacity: 0.8;
}
</style>
