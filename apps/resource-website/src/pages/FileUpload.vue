<script lang="ts" setup>
import { ref } from 'vue'
import { UploadFilled, Close, Folder } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import { uploadFile } from '../services/apis/files'
import { formatSize, getFileIcon, getIconColor } from '../utils/file'
import type { UploadFileItem } from '../types/file'

const userStore = useUserStore()
const fileInput = ref<HTMLInputElement | null>(null)
const uploadList = ref<UploadFileItem[]>([])
const isDragging = ref(false)
const uploadPath = ref('./')

// 处理文件选择
const handleFiles = (files: FileList | null) => {
    if (!files) return

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file) {
            uploadList.value.push({
                id: Date.now() + i,
                file,
                name: file.name,
                size: file.size,
                status: 'pending',
                progress: 0
            })
        }
    }
}

const triggerFileInput = () => {
    fileInput.value?.click()
}

const onFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    handleFiles(target.files)
    if (target.value) target.value = '' // Reset input
}

// Drag and drop handlers
const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = true
}

const onDragLeave = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = false
}

const onDrop = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = false
    handleFiles(e.dataTransfer?.files || null)
}

// Remove file from list
const removeFile = (id: number) => {
    const index = uploadList.value.findIndex(item => item.id === id)
    if (index > -1) {
        uploadList.value.splice(index, 1)
    }
}

// Upload single file
const processUpload = async (item: UploadFileItem) => {
    if (item.status === 'uploading' || item.status === 'success') return

    item.status = 'uploading'
    item.progress = 0
    item.message = 'Preparing...'

    try {
        const res = await uploadFile(item.file, userStore.token, uploadPath.value || './', (percent) => {
            item.progress = percent
            if (percent < 100) {
                item.message = `Uploading... ${percent}%`
            } else {
                item.message = 'Processing...'
            }
        })

        if (res.success === true) {
            item.progress = 100
            item.status = 'success'
            item.message = 'Completed'
        } else {
            item.status = 'error'
            item.message = res.message || 'Upload failed'
        }
    } catch (error) {
        console.error(error)
        item.status = 'error'
        item.message = 'Network error'
    }
}

// Upload all pending files
const uploadAll = async () => {
    const pendingFiles = uploadList.value.filter(item => item.status === 'pending' || item.status === 'error')
    if (pendingFiles.length === 0) {
        ElMessage.warning('No pending files to upload')
        return
    }

    // Process sequentially or parallel? Let's do parallel for better UX but limit concurrency if needed
    // For now simple parallel
    await Promise.all(pendingFiles.map(item => processUpload(item)))
}
</script>

<template>
    <div class="upload-page">
        <div class="upload-container">
            <!-- Header -->
            <div class="header-section">
                <h2>文件上传</h2>
                <p class="subtitle">支持大文件分片上传，拖拽文件至下方区域即可添加</p>
                <div class="path-input-wrapper">
                    <el-input v-model="uploadPath" placeholder="设置上传目录（默认根目录 ./）" :prefix-icon="Folder"
                        class="custom-input" />
                </div>
            </div>

            <!-- Drop Zone -->
            <div class="drop-zone" :class="{ 'is-dragging': isDragging }" @dragover="onDragOver"
                @dragleave="onDragLeave" @drop="onDrop" @click="triggerFileInput">
                <input type="file" ref="fileInput" multiple class="hidden-input" @change="onFileChange" />
                <div class="drop-content">
                    <div class="icon-circle">
                        <el-icon>
                            <UploadFilled />
                        </el-icon>
                    </div>
                    <div class="drop-text">
                        <span class="highlight">点击上传</span> 或将文件拖拽到此处
                    </div>
                    <div class="drop-hint">支持任意类型文件</div>
                </div>
            </div>

            <!-- Action Bar -->
            <div class="action-bar" v-if="uploadList.length > 0">
                <div class="list-summary">
                    已选择 {{ uploadList.length }} 个文件
                </div>
                <div class="buttons">
                    <button class="btn btn-secondary" @click="uploadList = []">清空列表</button>
                    <button class="btn btn-primary" @click="uploadAll">开始上传</button>
                </div>
            </div>

            <!-- File List -->
            <div class="file-list" v-if="uploadList.length > 0">
                <div v-for="item in uploadList" :key="item.id" class="file-card">
                    <div class="file-icon-wrapper" :style="{ color: getIconColor(item.name) }">
                        <component :is="getFileIcon(item.name)" />
                    </div>

                    <div class="file-info">
                        <div class="file-header">
                            <span class="file-name" :title="item.name">{{ item.name }}</span>
                            <span class="file-size">{{ formatSize(item.size) }}</span>
                        </div>

                        <!-- Progress Bar -->
                        <div class="progress-track" v-if="item.status !== 'pending'">
                            <div class="progress-fill" :class="item.status" :style="{ width: item.progress + '%' }">
                            </div>
                        </div>

                        <div class="file-status">
                            <span v-if="item.status === 'pending'" class="status-text pending">等待上传</span>
                            <span v-else-if="item.status === 'uploading'" class="status-text uploading">{{ item.message
                                }}</span>
                            <span v-else-if="item.status === 'success'" class="status-text success">上传成功</span>
                            <span v-else-if="item.status === 'error'" class="status-text error">{{ item.message
                                }}</span>
                        </div>
                    </div>

                    <button class="remove-btn" @click.stop="removeFile(item.id)">
                        <el-icon>
                            <Close />
                        </el-icon>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.upload-page {
    height: 100%;
    overflow-y: auto;
    padding: 20px;
}

.upload-container {
    max-width: 800px;
    margin: 0 auto;
    background-color: transparent;
}

.header-section {
    margin-bottom: 24px;
    text-align: center;
}

.header-section h2 {
    font-size: 24px;
    font-weight: 600;
    color: #1d2129;
    margin: 0 0 8px 0;
}

.subtitle {
    font-size: 14px;
    color: #86909c;
    margin: 0;
}

.path-input-wrapper {
    margin-top: 24px;
    display: flex;
    justify-content: center;
}

.custom-input {
    width: 360px;
}

.custom-input :deep(.el-input__wrapper) {
    background-color: #f7f8fa;
    box-shadow: none;
    border: 1px solid #e5e6eb;
    border-radius: 8px;
    padding: 6px 12px;
    transition: all 0.2s;
}

.custom-input :deep(.el-input__wrapper:hover) {
    background-color: #f2f3f5;
    border-color: #c9cdd4;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
    background-color: #ffffff;
    border-color: #0066ff;
    box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.1);
}

/* Drop Zone */
.drop-zone {
    background-color: #ffffff;
    border: 1px dashed #e5e6eb;
    border-radius: 12px;
    padding: 40px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 24px;
}

.drop-zone:hover,
.drop-zone.is-dragging {
    border-color: #0066ff;
    background-color: #f2f7ff;
}

.hidden-input {
    display: none;
}

.drop-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.icon-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: #f2f3f5;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #4e5969;
    margin-bottom: 4px;
}

.drop-text {
    font-size: 16px;
    color: #1d2129;
    font-weight: 500;
}

.highlight {
    color: #0066ff;
}

.drop-hint {
    font-size: 12px;
    color: #86909c;
}

/* Action Bar */
.action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 0 4px;
}

.list-summary {
    font-size: 14px;
    color: #4e5969;
}

.buttons {
    display: flex;
    gap: 12px;
}

.btn {
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
}

.btn-primary {
    background-color: #0066ff;
    color: white;
}

.btn-primary:hover {
    background-color: #005ce6;
}

.btn-secondary {
    background-color: #f2f3f5;
    color: #4e5969;
}

.btn-secondary:hover {
    background-color: #e5e6eb;
}

/* File List */
.file-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
}

.file-card {
    background-color: #ffffff;
    border: 1px solid #e5e6eb;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    position: relative;
    transition: all 0.2s;
}

.file-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-color: #c9cdd4;
}

.file-icon-wrapper {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    flex-shrink: 0;
}

.file-info {
    flex: 1;
    min-width: 0;
    /* Enable truncation */
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.file-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
}

.file-name {
    font-size: 14px;
    font-weight: 600;
    color: #1d2129;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.file-size {
    font-size: 12px;
    color: #86909c;
    flex-shrink: 0;
}

.file-status {
    font-size: 12px;
    min-height: 18px;
}

.status-text.pending {
    color: #86909c;
}

.status-text.uploading {
    color: #0066ff;
}

.status-text.success {
    color: #00b42a;
}

.status-text.error {
    color: #f53f3f;
}

/* Progress Bar */
.progress-track {
    height: 4px;
    background-color: #f2f3f5;
    border-radius: 2px;
    overflow: hidden;
    margin-top: 4px;
}

.progress-fill {
    height: 100%;
    background-color: #0066ff;
    transition: width 0.3s ease;
}

.progress-fill.success {
    background-color: #00b42a;
}

.progress-fill.error {
    background-color: #f53f3f;
}

.remove-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: #c9cdd4;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
}

.remove-btn:hover {
    background-color: #f2f3f5;
    color: #4e5969;
}
</style>