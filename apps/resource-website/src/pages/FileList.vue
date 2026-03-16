<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    Document, View, Download, Search,
    Picture, VideoCamera, Service, MoreFilled, InfoFilled
} from '@element-plus/icons-vue'
import { getFileList, updateFilePermission, generateKey, deleteFile } from '../services/apis/files'
import { useUserStore } from '../stores/user'
import { getFileIcon, isImageExt, isVideoExt, isTextExt, getIconColor, formatSize, getExt, isAudioExt } from '../utils/file'
import { formatDate } from '../utils/common'
import type { FileItem } from '../types/file'
import FileOperationDialog from '../components/FileOperationDialog.vue'
import FileInfoDialog from '../components/FileInfoDialog.vue'
import CustomDialog from '../components/CustomDialog.vue'

const userStore = useUserStore()
const fileList = ref<FileItem[]>([])
const selectedFile = ref<FileItem | null>(null)
const loading = ref(false)

// Dialogs
const operationVisible = ref(false)
const infoVisible = ref(false)
const previewVisible = ref(false)

// Operation states
const updating = ref(false)
const generating = ref(false)
const deleting = ref(false)

// Preview states
const textContent = ref('')
const loadingText = ref(false)

// Filter & Search
const searchQuery = ref('')
const currentFilter = ref<'all' | 'document' | 'image' | 'video'>('all')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

const handleResize = () => {
    // windowWidth.value = window.innerWidth
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
    fetchFiles()
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})

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

const filteredFiles = computed(() => {
    let result = fileList.value

    // Search
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(f =>
            f.name.toLowerCase().includes(query) ||
            f.path.toLowerCase().includes(query)
        )
    }

    // Filter
    if (currentFilter.value !== 'all') {
        result = result.filter(f => {
            const ext = getExt(f.name)
            if (currentFilter.value === 'image') return isImageExt(ext)
            if (currentFilter.value === 'video') return isVideoExt(ext)
            if (currentFilter.value === 'document') return !isImageExt(ext) && !isVideoExt(ext) && !isAudioExt(ext)
            return true
        })
    }

    return result
})

const pagedFiles = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredFiles.value.slice(start, end)
})

const totalFiltered = computed(() => filteredFiles.value.length)

watch([currentFilter, searchQuery], () => {
    currentPage.value = 1
})

const previewUrl = computed(() => {
    if (!selectedFile.value) return ''
    const { hash, key } = selectedFile.value

    let baseUrl = import.meta.env.VITE_SERVER_URL || ''
    if (!baseUrl || baseUrl.startsWith('/')) {
        baseUrl = window.location.origin + baseUrl
    }
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1)
    }

    const API_BASE = baseUrl + '/api'

    if (key) {
        return `${API_BASE}/file/read?hash=${hash}&key=${key}`
    }
    return `${API_BASE}/file/read?hash=${hash}`
})

const isImage = computed(() => selectedFile.value ? isImageExt(selectedFile.value.name) : false)
const isVideo = computed(() => selectedFile.value ? isVideoExt(selectedFile.value.name) : false)
const isText = computed(() => selectedFile.value ? isTextExt(selectedFile.value.name) : false)

const handlePreview = (file: FileItem) => {
    selectedFile.value = file
    previewVisible.value = true
}

const openOperation = (file: FileItem) => {
    selectedFile.value = file
    operationVisible.value = true
}

const openInfo = (file: FileItem) => {
    selectedFile.value = file
    infoVisible.value = true
}

watch([selectedFile, previewVisible], async ([newFile, visible]) => {
    if (newFile && visible && isText.value) {
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

const doUpdatePermission = async (role: 'public' | 'key') => {
    if (!selectedFile.value) return
    updating.value = true
    try {
        const res = await updateFilePermission(selectedFile.value.hash, role, userStore.token)
        if (res.success) {
            selectedFile.value.role = role
            // Update local list
            const idx = fileList.value.findIndex(f => f.hash === selectedFile.value?.hash)
            if (idx !== -1) fileList.value[idx]!.role = role
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
            // Update local list
            const idx = fileList.value.findIndex(f => f.hash === selectedFile.value?.hash)
            if (idx !== -1) fileList.value[idx]!.key = key
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
            operationVisible.value = false
            selectedFile.value = null
            previewVisible.value = false
            ElMessage.success('文件已删除')
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

// Summary Data
const totalSize = computed(() => fileList.value.reduce((sum, f) => sum + Number(f.size || 0), 0))
const totalCount = computed(() => fileList.value.length)
const publicCount = computed(() => fileList.value.filter(f => f.role === 'public').length)
</script>

<template>
    <div class="file-manager-container" v-loading="loading">
        <!-- Page Title & Description -->
        <div class="page-header">
            <h2 class="page-title">Files</h2>
            <p class="page-desc">Manage and organize your platform resources across all regions.</p>
        </div>

        <!-- Filters & Search -->
        <div class="toolbar-section">
            <div class="search-wrapper">
                <el-icon class="search-icon">
                    <Search />
                </el-icon>
                <input v-model="searchQuery" class="search-input" type="text"
                    placeholder="Search files by name, type or path..." />
            </div>
            <div class="filter-group">
                <button class="filter-btn" :class="{ active: currentFilter === 'all' }"
                    @click="currentFilter = 'all'">All Files</button>
                <button class="filter-btn" :class="{ active: currentFilter === 'document' }"
                    @click="currentFilter = 'document'">
                    <el-icon class="btn-icon">
                        <Document />
                    </el-icon> Documents
                </button>
                <button class="filter-btn" :class="{ active: currentFilter === 'image' }"
                    @click="currentFilter = 'image'">
                    <el-icon class="btn-icon">
                        <Picture />
                    </el-icon> Images
                </button>
                <button class="filter-btn" :class="{ active: currentFilter === 'video' }"
                    @click="currentFilter = 'video'">
                    <el-icon class="btn-icon">
                        <VideoCamera />
                    </el-icon> Videos
                </button>
            </div>
        </div>

        <!-- Data Table -->
        <div class="table-card">
            <el-table :data="pagedFiles" style="width: 100%" class="custom-table">
                <el-table-column label="Name" min-width="250">
                    <template #default="{ row }">
                        <div class="file-name-cell">
                            <el-icon class="file-icon" :style="{ color: getIconColor(row.name) || '#94a3b8' }">
                                <component :is="getFileIcon(row.name)" />
                            </el-icon>
                            <span class="text">{{ row.name }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="Type" width="150">
                    <template #default="{ row }">
                        <span class="text-muted">{{ getExt(row.name).toUpperCase() }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="Size" width="120">
                    <template #default="{ row }">
                        <span class="text-muted">{{ formatSize(row.size) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="Modified Date" width="180">
                    <template #default="{ row }">
                        <span class="text-muted">{{ formatDate(row.modifiedTime) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="Path" min-width="150" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span class="text-mono">{{ row.path }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="Actions" width="180" align="right">
                    <template #default="{ row }">
                        <div class="row-actions">
                            <button class="action-btn" title="Preview" @click="handlePreview(row)">
                                <el-icon>
                                    <View />
                                </el-icon>
                            </button>
                            <button class="action-btn" title="Download">
                                <a :href="previewUrl" download class="download-link-icon">
                                    <el-icon>
                                        <Download />
                                    </el-icon>
                                </a>
                            </button>
                            <button class="action-btn danger" title="Delete" @click="openInfo(row)">
                                <el-icon>
                                    <InfoFilled />
                                </el-icon>
                            </button>
                            <button class="action-btn" title="More" @click=" openOperation(row)">
                                <el-icon>
                                    <MoreFilled />
                                </el-icon>
                            </button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>

            <!-- Pagination -->
            <div class="pagination-footer">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="totalFiltered"
                    :page-sizes="[10, 20, 50, 100]" layout="sizes, prev, pager, next" background small />
            </div>
        </div>

        <!-- Storage Summary -->
        <div class="summary-section">
            <div class="summary-card">
                <div class="summary-icon blue">
                    <el-icon>
                        <Service />
                    </el-icon>
                </div>
                <div class="summary-text">
                    <p class="summary-label">Cloud Usage</p>
                    <p class="summary-value">{{ formatSize(totalSize) }}</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon emerald">
                    <el-icon>
                        <Document />
                    </el-icon>
                </div>
                <div class="summary-text">
                    <p class="summary-label">Total Files</p>
                    <p class="summary-value">{{ totalCount }} <span class="unit">Items</span></p>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon amber">
                    <el-icon>
                        <View />
                    </el-icon>
                </div>
                <div class="summary-text">
                    <p class="summary-label">Public Files</p>
                    <p class="summary-value">{{ publicCount }} <span class="unit">Active</span></p>
                </div>
            </div>
        </div>

        <!-- Dialogs -->
        <CustomDialog v-model="previewVisible" :title="selectedFile?.name || '预览'" width="800px">
            <div class="preview-container">
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
                            <el-button type="primary">
                                <el-icon style="margin-right: 4px">
                                    <Download />
                                </el-icon>
                                下载文件
                            </el-button>
                        </a>
                    </div>
                </div>
            </div>
            <template #footer>
                <el-button @click="previewVisible = false">关闭</el-button>
            </template>
        </CustomDialog>

        <FileOperationDialog v-model="operationVisible" :file="selectedFile" :updating="updating"
            :generating="generating" :deleting="deleting" @update-permission="doUpdatePermission"
            @generate-key="doGenerateKey" @delete-file="doDeleteFile" />

        <FileInfoDialog v-model="infoVisible" :file="selectedFile" :preview-url="previewUrl" />
    </div>
</template>

<style lang="scss" scoped>
.file-manager-container {
    height: 100%;
    padding: 32px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    font-family: 'Inter', sans-serif;
    color: var(--color-text-primary);
    box-sizing: border-box;
    position: relative;
    z-index: 0;
    min-width: 0;
}

.page-header {
    margin-bottom: 24px;
    flex-shrink: 0;
}

.page-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 4px 0;
}

.page-desc {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0;
}

/* Toolbar */
.toolbar-section {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: space-between;
    align-items: center;
    background: var(--color-bg-secondary);
    padding: 16px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    margin-bottom: 24px;
    flex-shrink: 0;
}

.search-wrapper {
    position: relative;
    flex: 1;
    max-width: 450px;
    width: 100%;
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-tertiary);
    font-size: 18px;
}

.search-input {
    width: 100%;
    padding: 10px 16px 10px 40px;
    border-radius: 8px;
    border: none;
    background: var(--color-bg-base);
    color: var(--color-text-primary);
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
    box-sizing: border-box;

    &:focus {
        box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2);
    }

    &::placeholder {
        color: var(--color-text-tertiary);
    }
}

.filter-group {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    flex-wrap: wrap;
}

.filter-btn {
    padding: 6px 12px;
    border-radius: 8px;
    border: none;
    background: var(--color-bg-base);
    color: var(--color-text-secondary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    transition: all 0.2s;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    &.active {
        background: var(--color-primary);
        color: white;
    }
}

/* Table */
.table-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 24px;
    box-shadow: var(--shadow-sm);
    position: relative;
    z-index: 1;
    flex-shrink: 0;
}

.custom-table {
    --el-table-header-bg-color: var(--color-bg-base);
    --el-table-border-color: var(--border-color);
    --el-table-row-hover-bg-color: rgba(0, 0, 0, 0.02);
}

:deep(.el-table th.el-table__cell) {
    background-color: #f8fafc; // slate-50
    color: #64748b; // slate-500
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 16px 24px;
}

:deep(.el-table td.el-table__cell) {
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-color);
}

.file-name-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.file-icon {
    font-size: 20px;
}

.text {
    font-weight: 500;
    color: var(--color-text-primary);
}

.text-muted {
    color: var(--color-text-secondary);
    font-size: 14px;
}

.text-mono {
    color: var(--color-text-tertiary);
    font-family: monospace;
    font-size: 13px;
}

/* Actions */
.row-actions {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
}

:deep(.el-table__row:hover) .row-actions {
    opacity: 1;
}

.action-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--color-text-tertiary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
        background: rgba(6, 182, 212, 0.1);
        color: var(--color-primary);
    }

    &.danger:hover {
        background: rgba(239, 68, 68, 0.1);
        color: var(--color-danger);
    }
}

.download-link-icon {
    color: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

/* Pagination */
.pagination-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    background: #f8fafc; // slate-50
}

.pagination-info {
    font-size: 14px;
    color: var(--color-text-secondary);
}

.pagination-controls {
    display: flex;
    gap: 8px;
}

.page-btn,
.page-num {
    height: 32px;
    min-width: 32px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: white;
    color: var(--color-text-secondary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px;

    &:hover:not(:disabled) {
        background: #f1f5f9;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &.active {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
    }
}

/* Summary Cards */
.summary-section {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
}

.summary-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-sm);
}

.summary-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;

    &.blue {
        background: #dbeafe;
        color: #2563eb;
    }

    &.emerald {
        background: #d1fae5;
        color: #059669;
    }

    &.amber {
        background: #fef3c7;
        color: #d97706;
    }
}

.summary-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    margin: 0 0 4px 0;
}

.summary-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
}

.unit {
    font-size: 14px;
    font-weight: 400;
    color: var(--color-text-tertiary);
}

/* Preview Styles from previous */
.preview-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
    max-height: 60vh;
}

.preview-content {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: auto;
}

.preview-media {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: var(--shadow-md);
}

.text-preview {
    width: 100%;
    max-height: 60vh;
    overflow: auto;
    background-color: var(--color-bg-base);
    padding: 16px;
    border-radius: 8px;
    text-align: left;
    box-sizing: border-box;
    border: 1px solid var(--border-color);

    pre {
        margin: 0;
        font-family: var(--font-family-mono);
        font-size: 13px;
        line-height: 1.6;
        color: var(--color-text-primary);
        white-space: pre-wrap;
        word-break: break-all;
    }
}

.no-preview {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: var(--color-text-tertiary);
    padding: 40px;
}

.custom-scrollbar {
    &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
    }
}

@media (max-width: 900px) {
    .summary-section {
        grid-template-columns: 1fr;
    }

    .toolbar-section {
        flex-direction: column;
        align-items: stretch;
    }

    .search-wrapper {
        max-width: none;
    }
}

@media (max-width: 600px) {
    .file-manager-container {
        padding: 16px;
    }

    .filter-group {
        padding-bottom: 8px; // scroll space
    }
}
</style>
