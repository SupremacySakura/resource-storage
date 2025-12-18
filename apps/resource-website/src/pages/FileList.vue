<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Picture, VideoCamera, Service } from '@element-plus/icons-vue'
import { getFileList } from '../services/apis/files'
import { useUserStore } from '../stores/user'

interface FileItem {
    hash: string
    name: string
    role: 'public' | 'private' | 'key'
    key?: string
    type: 'file'
    size: number
    chunkCount: number
    chunks: any[]
    modifiedTime: string
}

const userStore = useUserStore()
const fileList = ref<FileItem[]>([])
const selectedFile = ref<FileItem | null>(null)
const loading = ref(false)

const fetchFiles = async () => {
    loading.value = true
    try {
        const res = await getFileList(userStore.token)
        if (res.success) {
            fileList.value = res.data
            console.log(res.data)
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
}

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return Picture
    if (['mp4', 'webm', 'ogg'].includes(ext || '')) return VideoCamera
    if (['mp3', 'wav'].includes(ext || '')) return Service
    return Document
}

const previewUrl = computed(() => {
    if (!selectedFile.value) return ''
    const { hash, key } = selectedFile.value
    // Assuming the server address is localhost:3001, in production should be env variable
    const API_BASE = 'http://localhost:3001/api'
    if (key) {
        return `${API_BASE}/file/read?hash=${hash}&key=${key}`
    }
    return `${API_BASE}/file/read?hash=${hash}`
})

const isImage = computed(() => {
    if (!selectedFile.value) return false
    const ext = selectedFile.value.name.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
})

const isVideo = computed(() => {
    if (!selectedFile.value) return false
    const ext = selectedFile.value.name.split('.').pop()?.toLowerCase()
    return ['mp4', 'webm', 'ogg'].includes(ext || '')
})

onMounted(() => {
    fetchFiles()
})
</script>

<template>
    <div class="list-container" v-loading="loading">
        <el-row :gutter="20" class="full-height">
            <!-- Left: File List -->
            <el-col :span="6" class="col-list">
                <el-card class="box-card full-height"
                    :body-style="{ padding: '0px', height: '100%', overflow: 'auto' }">
                    <template #header>
                        <div class="card-header">
                            <span>File List</span>
                            <el-button link type="primary" @click="fetchFiles">Refresh</el-button>
                        </div>
                    </template>
                    <div v-if="fileList.length === 0" class="empty-list">
                        No files found.
                    </div>
                    <ul v-else class="file-list-ul">
                        <li v-for="file in fileList" :key="file.hash"
                            :class="{ active: selectedFile?.hash === file.hash }" @click="handleSelect(file)">
                            <el-icon class="file-icon">
                                <component :is="getFileIcon(file.name)" />
                            </el-icon>
                            <span class="file-name" :title="file.name">{{ file.name }}</span>
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
                            <span>File Details</span>
                        </div>
                    </template>
                    <div v-if="!selectedFile" class="empty-preview">
                        Select a file to view details and preview
                    </div>
                    <div v-else class="file-detail-container">
                        <!-- Metadata Section -->
                        <div class="meta-section">
                            <el-descriptions title="Metadata" :column="2" border>
                                <el-descriptions-item label="Name">{{ selectedFile.name }}</el-descriptions-item>
                                <el-descriptions-item label="Size">{{ formatSize(selectedFile.size)
                                }}</el-descriptions-item>
                                <el-descriptions-item label="Type">{{ selectedFile.role }}</el-descriptions-item>
                                <el-descriptions-item label="Modified">{{ selectedFile.modifiedTime
                                }}</el-descriptions-item>
                                <el-descriptions-item label="Chunks">{{ selectedFile.chunks.length }} / {{
                                    selectedFile.chunkCount
                                }}</el-descriptions-item>
                                <el-descriptions-item label="Hash">
                                    <span class="hash-text" :title="selectedFile.hash">{{ selectedFile.hash }}</span>
                                </el-descriptions-item>
                            </el-descriptions>
                        </div>

                        <!-- Preview Section -->
                        <div class="preview-section">
                            <div class="preview-header">Preview</div>
                            <div class="preview-content">
                                <img v-if="isImage" :src="previewUrl" class="preview-media" />
                                <video v-else-if="isVideo" :src="previewUrl" controls class="preview-media"></video>
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
    </div>
</template>

<style scoped>
.list-container {
    height: 100%;
    padding: 0;
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
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.file-list-ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.file-list-ul li {
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    transition: background-color 0.2s;
}

.file-list-ul li:hover {
    background-color: #f5f7fa;
}

.file-list-ul li.active {
    background-color: #ecf5ff;
    color: #409EFF;
}

.file-icon {
    margin-right: 10px;
    font-size: 18px;
}

.file-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
}

.empty-list,
.empty-preview {
    color: #909399;
    text-align: center;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.file-detail-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 20px;
}

.meta-section {
    flex-shrink: 0;
}

.preview-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    /* Important for flex child scrolling/overflow */
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 16px;
}

.preview-header {
    font-weight: bold;
    margin-bottom: 12px;
    color: #303133;
}

.preview-content {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background-color: #f9fafe;
    border-radius: 4px;
}

.preview-media {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.no-preview {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.hash-text {
    word-break: break-all;
    font-size: 12px;
    font-family: monospace;
}
</style>
