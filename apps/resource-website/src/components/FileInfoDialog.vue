<script lang="ts" setup>
import { formatSize } from '../utils/file'
import { formatDate } from '../utils/common'
import type { FileItem } from '../types/file'

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
    <el-dialog :model-value="modelValue" width="600px" class="info-dialog" align-center title="文件详细信息"
        @update:model-value="(val: boolean) => emit('update:modelValue', val)">
        <div v-if="file" class="info-content">
            <el-descriptions :column="1" border class="info-desc">
                <el-descriptions-item label="文件名">
                    <span class="text-strong">{{ file.name }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="文件大小">{{ formatSize(file.size) }}</el-descriptions-item>
                <el-descriptions-item label="文件地址">{{ file.path }}</el-descriptions-item>
                <el-descriptions-item label="权限">
                    <el-tag :type="file.role === 'public' ? 'success' : 'warning'" size="small" effect="dark">
                        {{ file.role === 'public' ? '公开' : '密钥' }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="修改时间">{{ formatDate(file.modifiedTime) }}</el-descriptions-item>
                <el-descriptions-item label="分片进度">
                    <el-progress :percentage="Math.round((file.chunks.length / file.chunkCount) * 100)"
                        :status="file.chunks.length === file.chunkCount ? 'success' : ''" />
                </el-descriptions-item>
                <el-descriptions-item label="文件哈希">
                    <div class="code-block">{{ file.hash }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="预览链接">
                    <div class="code-block link-block">{{ previewUrl }}</div>
                </el-descriptions-item>
            </el-descriptions>
        </div>
        <template #footer>
            <el-button @click="handleClose">关闭</el-button>
        </template>
    </el-dialog>
</template>

<style scoped>
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
</style>