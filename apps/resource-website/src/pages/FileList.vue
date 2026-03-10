<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Folder, CaretRight, Back, Refresh, MoreFilled } from '@element-plus/icons-vue'
import { getFileList, updateFilePermission, generateKey, deleteFile } from '../services/apis/files'
import { useUserStore } from '../stores/user'
import { getFileIcon, isImageExt, isVideoExt, isTextExt, getIconColor } from '../utils/file'
import type { FileItem } from '../types/file'
import FileOperationDialog from '../components/FileOperationDialog.vue'
import FileInfoDialog from '../components/FileInfoDialog.vue'


const userStore = useUserStore()
const fileList = ref<FileItem[]>([])
const selectedFile = ref<FileItem | null>(null)
const loading = ref(false)
const operationVisible = ref(false)
const updating = ref(false)
const generating = ref(false)
const deleting = ref(false)
const infoVisible = ref(false)

const expandedDirs = ref<Set<string>>(new Set())

// Mobile logic
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)
const mobilePreviewVisible = ref(false)

const handleResize = () => {
    windowWidth.value = window.innerWidth
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
    fetchFiles()
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})

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
        if (isMobile.value) {
            mobilePreviewVisible.value = true
        }
    }
}

const closeMobilePreview = () => {
    mobilePreviewVisible.value = false
    selectedFile.value = null
}

const fetchFiles = async () => {
    loading.value = true
    try {
        const res = await getFileList(userStore.token)
        if (res.success) {
            fileList.value = res.data
        } else {
            ElMessage.error(res.message || '获取文件列表失败')
        }
    } catch (error) {
        console.error(error)
        ElMessage.error('获取文件列表出错')
    } finally {
        loading.value = false
    }
}

const handleSelect = (file: FileItem) => {
    selectedFile.value = file
}

const previewUrl = computed(() => {
    if (!selectedFile.value) return ''
    const { hash, key } = selectedFile.value

    // 优化：处理 Docker 部署时 VITE_SERVER_URL 为空的情况，补全协议和域名
    let baseUrl = import.meta.env.VITE_SERVER_URL || ''

    // 如果没有配置 VITE_SERVER_URL (Docker部署时为空)，或者是相对路径，补全 origin
    if (!baseUrl || baseUrl.startsWith('/')) {
        baseUrl = window.location.origin + baseUrl
    }

    // 去除末尾斜杠，避免双重斜杠
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1)
    }

    const API_BASE = baseUrl + '/api'

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
                textContent.value = '加载文件内容失败：' + res.statusText
            }
        } catch (e) {
            textContent.value = '加载文件内容出错。'
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
    operationVisible.value = true
}

const openInfo = () => {
    if (!selectedFile.value) {
        ElMessage.warning('请先选择文件')
        return
    }
    infoVisible.value = true
}

const doUpdatePermission = async (role: 'public' | 'key') => {
    if (!selectedFile.value) return
    updating.value = true
    try {
        const res = await updateFilePermission(selectedFile.value.hash, role, userStore.token)
        if (res.success) {
            selectedFile.value.role = role
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
        ElMessage.warning('请先将权限设置为密钥')
        return
    }
    generating.value = true
    try {
        const res = await generateKey(selectedFile.value.hash, userStore.token)
        if (res.success) {
            const key = res.data || ''
            selectedFile.value.key = key
            ElMessage.success('密钥已生成')
        } else {
            ElMessage.error(res.message || '生成密钥失败')
        }
    } catch (e) {
        ElMessage.error('生成密钥出错')
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
            if (isMobile.value) mobilePreviewVisible.value = false
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
</script>

<template>
    <div class="list-container" v-loading="loading">
        <el-row :gutter="0" class="full-height">
            <!-- Left: File List -->
            <el-col :span="24" :md="6" class="col-list" :class="{ 'hidden-mobile': isMobile && mobilePreviewVisible }">
                <div class="panel-card glass-card full-height no-padding">
                    <div class="card-header padding">
                        <span>文件浏览</span>
                        <el-button link type="primary" @click="fetchFiles">
                            <el-icon>
                                <Refresh />
                            </el-icon>
                        </el-button>
                    </div>

                    <div v-if="fileList.length === 0" class="empty-list">
                        未找到文件
                    </div>
                    <ul v-else class="file-list-ul custom-scrollbar">
                        <li v-for="item in displayItems" :key="item.key"
                            :class="{ active: !item.isDir && selectedFile?.hash === item.file.hash }"
                            @click="handleItemClick(item)" :style="{ paddingLeft: (16 + item.level * 20) + 'px' }">
                            <span class="caret-wrapper">
                                <el-icon v-if="item.isDir" class="caret-icon"
                                    :class="{ expanded: expandedDirs.has(item.fullPath) }">
                                    <CaretRight />
                                </el-icon>
                            </span>
                            <el-icon class="file-icon"
                                :style="{ color: getIconColor(item.name) || 'var(--color-text-secondary)' }">
                                <component :is="item.isDir ? Folder : getFileIcon(item.name)" />
                            </el-icon>
                            <span class="file-name" :title="item.name">{{ item.name }}</span>
                        </li>
                    </ul>
                </div>
            </el-col>

            <!-- Right: Preview & Metadata (Desktop) -->
            <el-col :span="0" :md="18" class="col-preview hidden-mobile-block">
                <div class="panel-card glass-card full-height">
                    <div class="card-header">
                        <span>文件详情</span>
                        <div class="header-actions">
                            <el-button type="primary" size="small" @click="openOperation"
                                :disabled="!selectedFile">操作</el-button>
                            <el-button size="small" @click="openInfo" :disabled="!selectedFile">信息</el-button>
                        </div>
                    </div>

                    <div v-if="!selectedFile" class="empty-preview">
                        <el-icon :size="48">
                            <Document />
                        </el-icon>
                        <p>请选择一个文件查看详情</p>
                    </div>

                    <div v-else class="file-detail-container">
                        <!-- Preview Section -->
                        <div class="preview-section">
                            <div class="preview-content custom-scrollbar">
                                <img v-if="isImage" :src="previewUrl" class="preview-media" />
                                <video v-else-if="isVideo" :src="previewUrl" controls class="preview-media"></video>
                                <div v-else-if="isText" class="text-preview" v-loading="loadingText">
                                    <pre><code>{{ textContent }}</code></pre>
                                </div>
                                <div v-else class="no-preview">
                                    <el-icon :size="64">
                                        <Document />
                                    </el-icon>
                                    <p>暂不支持预览</p>
                                    <a :href="previewUrl" target="_blank" class="download-link">
                                        <el-button type="primary" link>下载</el-button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </el-col>
        </el-row>

        <!-- Mobile Preview Drawer -->
        <el-drawer v-model="mobilePreviewVisible" size="100%" :with-header="false" class="mobile-preview-drawer"
            destroy-on-close>
            <div class="mobile-preview-container">
                <div class="mobile-header">
                    <el-button link @click="closeMobilePreview">
                        <el-icon :size="20">
                            <Back />
                        </el-icon>
                    </el-button>
                    <span class="title">{{ selectedFile?.name }}</span>
                    <el-dropdown trigger="click">
                        <el-icon :size="20">
                            <MoreFilled />
                        </el-icon>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item @click="openOperation">操作</el-dropdown-item>
                                <el-dropdown-item @click="openInfo">信息</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>

                <div class="mobile-content">
                    <div class="preview-section mobile">
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
                                <p>暂不支持预览</p>
                                <a :href="previewUrl" target="_blank">
                                    <el-button type="primary">下载</el-button>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </el-drawer>

        <FileOperationDialog v-model="operationVisible" :file="selectedFile" :updating="updating"
            :generating="generating" :deleting="deleting" @update-permission="doUpdatePermission"
            @generate-key="doGenerateKey" @delete-file="doDeleteFile" />

        <FileInfoDialog v-model="infoVisible" :file="selectedFile" :preview-url="previewUrl" />
    </div>
</template>

<style lang="scss" scoped>
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
    transition: all 0.3s ease;
}

.panel-card {
    display: flex;
    flex-direction: column;
    background: rgba(30, 41, 59, 0.6); // Override
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;

    &.no-padding {
        padding: 0;
    }
}

.col-preview .panel-card {
    margin-left: 12px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    color: var(--color-text-primary);
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);

    &.padding {
        padding: 16px 20px;
    }
}

.header-actions {
    display: flex;
    gap: 8px;
}

/* File List Styles */
.file-list-ul {
    list-style: none;
    padding: 12px;
    margin: 0;
    overflow-y: auto;
    flex: 1;
}

.file-list-ul li {
    padding: 10px 12px;
    margin-bottom: 4px;
    cursor: pointer;
    border-radius: 8px;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;
    color: var(--color-text-secondary);
    font-size: 14px;
    height: 40px;
    box-sizing: border-box;
    border: 1px solid transparent;
}

.file-list-ul li:hover {
    background-color: rgba(255, 255, 255, 0.03);
    color: var(--color-text-primary);
}

.file-list-ul li.active {
    background: linear-gradient(90deg, rgba(6, 182, 212, 0.1) 0%, transparent 100%);
    color: var(--color-primary);
    border-color: rgba(6, 182, 212, 0.2);
    font-weight: 500;
}

.caret-wrapper {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
    color: var(--color-text-tertiary);
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
    margin-right: 10px;
    font-size: 18px;
    display: flex;
    align-items: center;
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
    color: var(--color-text-tertiary);
    text-align: center;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 16px;
    font-size: 14px;
}

.file-detail-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 20px;
    overflow: hidden;
}

.preview-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background-color: rgba(0, 0, 0, 0.2);
    overflow: hidden;

    &.mobile {
        height: 100%;
        border: none;
        background: transparent;
    }
}

.preview-content {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: auto;
    padding: 20px;
}

.preview-media {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    border-radius: 8px;
}

.text-preview {
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 16px;
    border-radius: 8px;
    text-align: left;
    box-sizing: border-box;
}

.text-preview pre {
    margin: 0;
    font-family: var(--font-family-mono);
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-text-primary);
    white-space: pre-wrap;
    word-break: break-all;
}

.no-preview {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: var(--color-text-tertiary);
}

/* Mobile Specific */
.hidden-mobile-block {
    display: block;
}

@media (max-width: 768px) {
    .col-preview.hidden-mobile-block {
        display: none;
    }

    .col-list {
        width: 100%;
        flex: 0 0 100%;
        max-width: 100%;
    }

    .col-preview .panel-card {
        margin-left: 0;
    }
}

.mobile-preview-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-base);
    color: var(--color-text-primary);
}

.mobile-header {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--color-bg-secondary);

    .title {
        font-weight: 600;
        font-size: 16px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
    }
}

.mobile-content {
    flex: 1;
    overflow: hidden;
    padding: 16px;
    display: flex;
    flex-direction: column;
}

/* Custom Scrollbar class */
.custom-scrollbar {
    &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }
}
</style>
