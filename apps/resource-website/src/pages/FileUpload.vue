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
    item.message = '准备中…'

    try {
        const res = await uploadFile(item.file, userStore.token, uploadPath.value || './', (percent) => {
            item.progress = percent
            if (percent < 100) {
                item.message = `上传中… ${percent}%`
            } else {
                item.message = '处理中…'
            }
        })

        if (res.success === true) {
            item.progress = 100
            item.status = 'success'
            item.message = '完成'
        } else {
            item.status = 'error'
            item.message = res.message || '上传失败'
        }
    } catch (error) {
        console.error(error)
        item.status = 'error'
        item.message = '网络错误'
    }
}

// Upload all pending files
const uploadAll = async () => {
    const pendingFiles = uploadList.value.filter(item => item.status === 'pending' || item.status === 'error')
    if (pendingFiles.length === 0) {
        ElMessage.warning('没有待上传的文件')
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
                <h2>上传文件</h2>
                <p class="subtitle">拖拽文件到此处，或点击选择文件</p>
                <div class="path-input-wrapper">
                    <el-input v-model="uploadPath" placeholder="上传路径（默认：./）" :prefix-icon="Folder"
                        class="custom-input glass-input" />
                </div>
            </div>

            <!-- Drop Zone -->
            <div class="drop-zone glass-card" :class="{ 'is-dragging': isDragging }" @dragover="onDragOver"
                @dragleave="onDragLeave" @drop="onDrop" @click="triggerFileInput">
                <input type="file" ref="fileInput" multiple class="hidden-input" @change="onFileChange" />
                <div class="drop-content">
                    <div class="icon-circle">
                        <el-icon>
                            <UploadFilled />
                        </el-icon>
                    </div>
                    <div class="drop-text">
                        <span class="highlight">点击选择文件</span> 或拖拽到此处
                    </div>
                    <div class="drop-hint">支持所有文件类型（支持大文件分片上传）</div>
                </div>

                <!-- Corner Decorations -->
                <div class="corner top-left"></div>
                <div class="corner top-right"></div>
                <div class="corner bottom-left"></div>
                <div class="corner bottom-right"></div>
            </div>

            <!-- Action Bar -->
            <div class="action-bar" v-if="uploadList.length > 0">
                <div class="list-summary">
                    已选择 {{ uploadList.length }} 个文件
                </div>
                <div class="buttons">
                    <button class="btn btn-secondary" @click="uploadList = []">清空</button>
                    <button class="btn btn-primary" @click="uploadAll">开始上传</button>
                </div>
            </div>

            <!-- File List -->
            <div class="file-list" v-if="uploadList.length > 0">
                <transition-group name="list">
                    <div v-for="item in uploadList" :key="item.id" class="file-card glass-card">
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
                                    <div class="glow-bar"></div>
                                </div>
                            </div>

                            <div class="file-status">
                                <span v-if="item.status === 'pending'" class="status-text pending">待上传</span>
                                <span v-else-if="item.status === 'uploading'" class="status-text uploading">{{
                                    item.message
                                }}</span>
                                <span v-else-if="item.status === 'success'" class="status-text success">成功</span>
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
                </transition-group>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.upload-page {
    height: 100%;
    overflow-y: auto;
    padding: 20px;
}

.upload-container {
    max-width: 800px;
    margin: 0 auto;
    padding-bottom: 40px;
}

.header-section {
    margin-bottom: 32px;
    text-align: center;
}

.header-section h2 {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
}

.subtitle {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0;
}

.path-input-wrapper {
    margin-top: 24px;
    display: flex;
    justify-content: center;
}

.custom-input {
    width: 360px;
    max-width: 100%;
}

.custom-input :deep(.el-input__wrapper) {
    background-color: #fff;
    box-shadow: none;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 8px 12px;
    transition: all 0.2s;
}

.custom-input :deep(.el-input__wrapper:hover) {
    border-color: var(--color-primary);
}

.custom-input :deep(.el-input__wrapper.is-focus) {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 1px var(--color-primary-glow);
}

.custom-input :deep(.el-input__inner) {
    color: var(--color-text-primary);
}

/* Drop Zone */
.drop-zone {
    border: 1px dashed var(--border-color);
    padding: 60px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
    background-color: var(--color-bg-secondary);
    border-radius: 16px;
}

.drop-zone:hover,
.drop-zone.is-dragging {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    box-shadow: var(--shadow-md);

    .icon-circle {
        transform: scale(1.1);
        color: var(--color-primary);
        background: #fff;
    }
}

.hidden-input {
    display: none;
}

.drop-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    position: relative;
    z-index: 2;
}

.icon-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: var(--color-bg-base);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: var(--color-text-secondary);
    margin-bottom: 8px;
    transition: all 0.3s ease;
}

.drop-text {
    font-size: 18px;
    color: var(--color-text-primary);
    font-weight: 500;
}

.highlight {
    color: var(--color-primary);
    font-weight: 600;
}

.drop-hint {
    font-size: 13px;
    color: var(--color-text-tertiary);
}

/* Corner Decorations */
.corner {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid transparent;
    transition: all 0.3s ease;
}

.drop-zone:hover .corner {
    border-color: var(--color-primary);
}

.top-left {
    top: -1px;
    left: -1px;
    border-top: 2px solid transparent;
    border-left: 2px solid transparent;
}

.top-right {
    top: -1px;
    right: -1px;
    border-top: 2px solid transparent;
    border-right: 2px solid transparent;
}

.bottom-left {
    bottom: -1px;
    left: -1px;
    border-bottom: 2px solid transparent;
    border-left: 2px solid transparent;
}

.bottom-right {
    bottom: -1px;
    right: -1px;
    border-bottom: 2px solid transparent;
    border-right: 2px solid transparent;
}

/* Action Bar */
.action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 0 4px;
}

.list-summary {
    font-size: 14px;
    color: var(--color-text-secondary);
}

.buttons {
    display: flex;
    gap: 12px;
}

.btn {
    padding: 8px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
}

.btn-primary {
    background: var(--color-primary);
    color: #fff;
    box-shadow: 0 4px 12px var(--color-primary-glow);

    &:hover {
        transform: translateY(-1px);
        filter: brightness(1.1);
    }

    &:active {
        transform: translateY(0);
    }
}

.btn-secondary {
    background: #fff;
    color: var(--color-text-secondary);
    border: 1px solid var(--border-color);

    &:hover {
        background: var(--color-bg-base);
        color: var(--color-text-primary);
        border-color: var(--color-text-secondary);
    }
}

/* File List */
.file-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
}

.file-card {
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    position: relative;
    transition: all 0.2s;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    background: var(--color-bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;

    &:hover {
        transform: translateY(-2px);
        border-color: var(--color-primary);
        box-shadow: var(--shadow-sm);
    }
}

.file-icon-wrapper {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    flex-shrink: 0;
    background: var(--color-bg-base);
    border-radius: 8px;
}

.file-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.file-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.file-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
}

.file-size {
    font-size: 12px;
    color: var(--color-text-tertiary);
    flex-shrink: 0;
    font-family: var(--font-family-mono);
}

.file-status {
    font-size: 12px;
    min-height: 18px;
}

.status-text.pending {
    color: var(--color-text-secondary);
}

.status-text.uploading {
    color: var(--color-primary);
}

.status-text.success {
    color: var(--color-success);
}

.status-text.error {
    color: var(--color-danger);
}

/* Progress Bar */
.progress-track {
    height: 4px;
    background-color: var(--color-bg-base);
    border-radius: 2px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background-color: var(--color-primary);
    transition: width 0.3s ease;
    position: relative;
    overflow: hidden;
}

.progress-fill .glow-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }

    100% {
        transform: translateX(100%);
    }
}

.progress-fill.success {
    background-color: var(--color-success);
}

.progress-fill.error {
    background-color: var(--color-danger);
}

.remove-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--color-text-tertiary);
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
        background-color: var(--color-bg-base);
        color: var(--color-text-primary);
    }
}

/* List Transitions */
.list-enter-active,
.list-leave-active {
    transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

@media (max-width: 600px) {
    .upload-container {
        padding-bottom: 20px;
    }

    .file-list {
        grid-template-columns: 1fr;
    }

    .drop-zone {
        padding: 40px 20px;
    }
}
</style>
