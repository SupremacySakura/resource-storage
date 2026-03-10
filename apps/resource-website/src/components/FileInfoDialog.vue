<script lang="ts" setup>
import { formatSize } from '../utils/file'
import { formatDate } from '../utils/common'
import type { FileItem } from '../types/file'
import CustomDialog from './CustomDialog.vue'

defineProps<{
    modelValue: boolean
    file: FileItem | null
    previewUrl: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const handleClose = () => {
    emit('update:modelValue', false)
}
</script>

<template>
    <CustomDialog :model-value="modelValue" title="文件详细信息" width="600px"
        @update:model-value="(val: boolean) => emit('update:modelValue', val)">
        <div v-if="file" class="info-content">
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">文件名</span>
                    <span class="value text-strong">{{ file.name }}</span>
                </div>
                <div class="info-item">
                    <span class="label">文件大小</span>
                    <span class="value">{{ formatSize(file.size) }}</span>
                </div>
                <div class="info-item">
                    <span class="label">文件地址</span>
                    <span class="value">{{ file.path }}</span>
                </div>
                <div class="info-item">
                    <span class="label">权限</span>
                    <span class="value">
                        <span class="badge" :class="file.role === 'public' ? 'success' : 'warning'">
                            {{ file.role === 'public' ? '公开' : '密钥' }}
                        </span>
                    </span>
                </div>
                <div class="info-item">
                    <span class="label">修改时间</span>
                    <span class="value">{{ formatDate(file.modifiedTime) }}</span>
                </div>
                <div class="info-item">
                    <span class="label">分片进度</span>
                    <div class="value progress-wrapper">
                        <div class="progress-bar">
                            <div class="fill"
                                :style="{ width: Math.round((file.chunks.length / file.chunkCount) * 100) + '%' }">
                            </div>
                        </div>
                        <span class="progress-text">{{ Math.round((file.chunks.length / file.chunkCount) * 100)
                            }}%</span>
                    </div>
                </div>
                <div class="info-item vertical">
                    <span class="label">文件哈希</span>
                    <div class="code-block">{{ file.hash }}</div>
                </div>
                <div class="info-item vertical">
                    <span class="label">预览链接</span>
                    <div class="code-block link-block">{{ previewUrl }}</div>
                </div>
            </div>
        </div>
        <template #footer>
            <el-button @click="handleClose">关闭</el-button>
        </template>
    </CustomDialog>
</template>

<style scoped>
.info-grid {
    display: grid;
    gap: 16px;
}

.info-content {
    width: 100%;
}

.info-item {
    display: grid;
    grid-template-columns: 100px 1fr;
    align-items: center;
    gap: 16px;
}

.info-item.vertical {
    grid-template-columns: 1fr;
    gap: 8px;
    align-items: start;
}

.label {
    color: var(--color-text-secondary);
    font-size: 14px;
}

.value {
    color: var(--color-text-primary);
    font-size: 14px;
    word-break: break-all;
    width: 100%;
    /* Ensure full width usage */
    box-sizing: border-box;
    /* Include padding/border in width */
}

.text-strong {
    font-weight: 600;
}

/* Badge */
.badge {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
}

.badge.success {
    background-color: rgba(16, 185, 129, 0.2);
    color: var(--color-success);
}

.badge.warning {
    background-color: rgba(245, 158, 11, 0.2);
    color: var(--color-warning);
}

/* Progress */
.progress-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
}

.progress-bar {
    flex: 1;
    height: 6px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
}

.fill {
    height: 100%;
    background-color: var(--color-success);
    border-radius: 3px;
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 12px;
    color: var(--color-text-secondary);
    min-width: 32px;
    text-align: right;
}

.code-block {
    font-family: var(--font-family-mono);
    background-color: rgba(0, 0, 0, 0.3);
    padding: 10px 12px;
    border-radius: 6px;
    font-size: 13px;
    color: var(--color-text-primary);
    word-break: break-all;
    white-space: pre-wrap;
    max-height: 100px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
}

.link-block {
    color: var(--color-primary);
}

@media (max-width: 600px) {
    .info-item {
        grid-template-columns: 1fr;
        /* Stack vertically on mobile */
        gap: 8px;
        /* Increased gap */
        align-items: start;
        width: 100%;
        /* Full width container */
    }

    .info-grid {
        width: 100%;
        /* Full width grid */
        gap: 12px;
    }

    .label {
        font-size: 13px;
        /* Slightly larger for readability */
        color: var(--color-text-tertiary);
    }

    .value {
        font-size: 15px;
        line-height: 1.5;
        /* Better line height for multi-line text */
    }
}
</style>
