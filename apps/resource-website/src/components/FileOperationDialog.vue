<script lang="ts" setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Lock, Key, Delete, View, Warning, CopyDocument } from '@element-plus/icons-vue'
import type { FileItem } from '../types/file'
import CustomDialog from './CustomDialog.vue'

const props = defineProps<{
    modelValue: boolean
    file: FileItem | null
    updating: boolean
    generating: boolean
    deleting: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'update-permission', role: 'public' | 'key'): void
    (e: 'generate-key'): void
    (e: 'delete-file'): void
}>()

const operationTab = ref<'permission' | 'key' | 'delete'>('permission')
const selectedRole = ref<'public' | 'key'>('public')

watch(() => props.file, (newFile) => {
    if (newFile) {
        selectedRole.value = newFile.role
        operationTab.value = 'permission'
    }
}, { immediate: true })

watch(() => props.modelValue, (val) => {
    if (val && props.file) {
        selectedRole.value = props.file.role
        operationTab.value = 'permission'
    }
})

const handleUpdatePermission = () => {
    emit('update-permission', selectedRole.value)
}

const handleGenerateKey = () => {
    emit('generate-key')
}

const handleDeleteFile = () => {
    emit('delete-file')
}

const copyKey = async () => {
    if (!props.file?.key) return
    try {
        await navigator.clipboard.writeText(props.file.key)
        ElMessage.success('已复制到剪贴板')
    } catch {
        ElMessage.error('复制失败')
    }
}
</script>

<template>
    <CustomDialog :model-value="modelValue" title="操作控制台" width="700px"
        @update:model-value="(val: boolean) => emit('update:modelValue', val)">

        <div class="op-container">
            <div class="op-left">
                <div class="nav-item" :class="{ active: operationTab === 'permission' }"
                    @click="operationTab = 'permission'">
                    <el-icon>
                        <Lock />
                    </el-icon>
                    <span>权限设置</span>
                </div>
                <div class="nav-item" :class="{ active: operationTab === 'key' }" @click="operationTab = 'key'">
                    <el-icon>
                        <Key />
                    </el-icon>
                    <span>生成密钥</span>
                </div>
                <div class="nav-item" :class="{ active: operationTab === 'delete' }" @click="operationTab = 'delete'">
                    <el-icon>
                        <Delete />
                    </el-icon>
                    <span>删除文件</span>
                </div>
            </div>

            <div class="op-right">
                <div v-if="operationTab === 'permission'" class="op-section">
                    <div class="op-header">
                        <div class="op-title">更改文件权限</div>
                        <div class="op-subtitle">设置文件的访问级别，公开或需要密钥。</div>
                    </div>

                    <div class="permission-card">
                        <div class="role-group">
                            <div class="role-option" :class="{ active: selectedRole === 'public' }"
                                @click="selectedRole = 'public'">
                                <div class="role-icon"><el-icon>
                                        <View />
                                    </el-icon></div>
                                <div class="role-info">
                                    <div class="role-name">公开访问</div>
                                    <div class="role-desc">任何人都可以访问此文件</div>
                                </div>
                                <div class="radio-indicator"></div>
                            </div>
                            <div class="role-option" :class="{ active: selectedRole === 'key' }"
                                @click="selectedRole = 'key'">
                                <div class="role-icon"><el-icon>
                                        <Lock />
                                    </el-icon></div>
                                <div class="role-info">
                                    <div class="role-name">密钥访问</div>
                                    <div class="role-desc">需要有效的密钥才能访问</div>
                                </div>
                                <div class="radio-indicator"></div>
                            </div>
                        </div>
                    </div>

                    <div class="op-actions">
                        <el-button type="primary" size="large" :loading="updating"
                            @click="handleUpdatePermission">保存更改</el-button>
                    </div>
                </div>
                <div v-else-if="operationTab === 'key'" class="op-section">
                    <div class="op-header">
                        <div class="op-title">生成访问密钥</div>
                        <div class="op-subtitle">当文件权限为密钥访问时，生成用于验证的密钥。</div>
                    </div>

                    <div class="key-gen-area">
                        <div v-if="file?.role !== 'key'" class="warning-box">
                            <el-icon>
                                <Warning />
                            </el-icon>
                            <span>请先将文件权限设置为“密钥访问”</span>
                            <el-button link type="primary" @click="operationTab = 'permission'">去设置</el-button>
                        </div>

                        <template v-else>
                            <div class="op-actions">
                                <el-button type="primary" size="large" :loading="generating" @click="handleGenerateKey">
                                    {{ file?.key ? '重新生成密钥' : '生成密钥' }}
                                </el-button>
                            </div>

                            <div v-if="file?.key" class="key-result-box">
                                <div class="key-label">生成的密钥</div>
                                <div class="key-content">
                                    <div class="key-text">{{ file.key }}</div>
                                    <el-button @click="copyKey" size="small" circle>
                                        <el-icon>
                                            <CopyDocument />
                                        </el-icon>
                                    </el-button>
                                </div>
                                <div class="key-tip">请妥善保管此密钥，用于文件访问验证。</div>
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
                            <el-button type="danger" size="large" :loading="deleting" @click="handleDeleteFile">
                                确认删除
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </CustomDialog>
</template>

<style scoped>
.op-container {
    display: flex;
    height: 400px;
    margin: -24px;
    /* 抵消弹窗内边距 */
}

.op-left {
    width: 200px;
    background-color: rgba(0, 0, 0, 0.2);
    border-right: 1px solid var(--border-color);
    flex-shrink: 0;
    padding: 16px 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.nav-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: all 0.2s;
    font-size: 14px;
}

.nav-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary);
}

.nav-item.active {
    background-color: rgba(6, 182, 212, 0.1);
    color: var(--color-primary);
    font-weight: 600;
}

.nav-item .el-icon {
    margin-right: 10px;
    font-size: 18px;
}

.op-right {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    color: var(--color-text-primary);
}

.op-header {
    margin-bottom: 24px;
}

.op-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 8px;
}

.op-actions {
    margin-top: 24px;
}

.op-subtitle {
    font-size: 14px;
    color: var(--color-text-secondary);
}

/* Permission Card Styles */
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
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background-color: rgba(255, 255, 255, 0.02);
}

.role-option:hover {
    border-color: rgba(255, 255, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.05);
}

.role-option.active {
    border-color: var(--color-primary);
    background-color: rgba(6, 182, 212, 0.1);
}

.role-icon {
    font-size: 24px;
    margin-right: 16px;
    color: var(--color-text-secondary);
    display: flex;
}

.role-option.active .role-icon {
    color: var(--color-primary);
}

.role-info {
    flex: 1;
}

.role-name {
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 4px;
}

.role-desc {
    font-size: 12px;
    color: var(--color-text-secondary);
}

.radio-indicator {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid var(--color-text-secondary);
    position: relative;
    margin-left: 12px;
}

.role-option.active .radio-indicator {
    border-color: var(--color-primary);
}

.role-option.active .radio-indicator::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    background-color: var(--color-primary);
    border-radius: 50%;
}

/* Key Gen Styles */
.warning-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    background-color: rgba(245, 158, 11, 0.1);
    border-radius: 8px;
    color: var(--color-warning);
    gap: 12px;
    border: 1px solid rgba(245, 158, 11, 0.2);
    text-align: center;
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
    background-color: rgba(0, 0, 0, 0.2);
    padding: 20px;
    border-radius: 8px;
    border: 1px dashed var(--border-color);
}

.key-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: 8px;
}

.key-content {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(0, 0, 0, 0.3);
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
}

.key-text {
    flex: 1;
    font-family: var(--font-family-mono);
    color: var(--color-text-primary);
    font-size: 14px;
    word-break: break-all;
}

.key-tip {
    font-size: 12px;
    color: var(--color-text-tertiary);
    margin-top: 8px;
}

/* Delete Area Styles */
.delete-area {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.warning-box.danger {
    background-color: rgba(239, 68, 68, 0.1);
    color: var(--color-danger);
    border: 1px solid rgba(239, 68, 68, 0.2);
    flex-direction: row;
    align-items: flex-start;
    text-align: left;
    padding: 20px;
}

.warning-box.danger .el-icon {
    font-size: 24px;
    margin-top: 2px;
    margin-right: 12px;
    flex-shrink: 0;
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
    color: var(--color-danger);
}

.warning-text {
    font-size: 14px;
    color: var(--color-danger);
    opacity: 0.8;
}

@media (max-width: 600px) {
    .op-container {
        flex-direction: column;
        height: 100%;
        /* Fill dialog height */
        min-height: auto;
        /* margin: -20px; */
        width: 100%;
        /* Adjust margin to match padding */
        overflow: hidden;
        /* Prevent container scrolling */
    }

    .op-left {
        width: 100%;
        flex-direction: row;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
        padding: 8px 4px;
        overflow-x: auto;
        /* Only allow horizontal scroll here */
        overflow-y: hidden;
        flex-shrink: 0;
        /* Prevent shrinking */
        gap: 8px;
        /* Add gap between items */
        /* Hide scrollbar for cleaner look but keep functionality */
        scrollbar-width: none;
        /* Firefox */
        -ms-overflow-style: none;
        /* IE/Edge */
    }

    .op-left::-webkit-scrollbar {
        display: none;
        /* Chrome/Safari/Opera */
    }

    .nav-item {
        flex: 0 0 auto;
        /* Allow items to keep their size */
        width: 80px;
        /* Fixed width for better touch target */
        justify-content: center;
        padding: 8px 4px;
        white-space: nowrap;
        flex-direction: column;
        gap: 4px;
        font-size: 11px;
    }

    .nav-item .el-icon {
        margin-right: 0;
        font-size: 18px;
        margin-bottom: 2px;
    }

    .op-right {
        padding: 6px;
        flex: 1;
        overflow-y: auto;
        /* Allow vertical scroll */
        overflow-x: hidden;
        /* Prevent horizontal scroll */
        display: flex;
        flex-direction: column;
        width: 100%;
        box-sizing: border-box;
    }

    .op-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .op-header {
        margin-bottom: 12px;
    }

    .op-title {
        font-size: 16px;
        margin-bottom: 4px;
    }

    .op-subtitle {
        font-size: 12px;
        line-height: 1.4;
    }

    .role-group {
        gap: 8px;
    }

    .role-option {
        padding: 8px;
    }

    .role-icon {
        margin-right: 8px;
        font-size: 16px;
    }

    .role-name {
        font-size: 13px;
        margin-bottom: 2px;
    }

    .role-desc {
        font-size: 10px;
    }

    .radio-indicator {
        width: 14px;
        height: 14px;
        margin-left: 8px;
    }

    .radio-indicator::after {
        width: 6px;
        height: 6px;
    }

    .warning-box {
        padding: 16px 12px;
        gap: 8px;
    }

    .warning-box .el-icon {
        font-size: 20px;
    }

    .warning-content {
        gap: 2px;
    }

    .warning-title {
        font-size: 14px;
    }

    .warning-text {
        font-size: 11px;
        line-height: 1.4;
    }

    .key-result-box {
        padding: 12px;
    }

    .key-content {
        padding: 6px 8px;
    }

    .key-text {
        font-size: 12px;
    }

    .op-actions {
        padding-top: 12px;
    }

    /* Force button size smaller on mobile */
    .op-actions :deep(.el-button) {
        height: 32px;
        font-size: 13px;
        padding: 8px 16px;
    }
}
</style>
