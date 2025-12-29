<script lang="ts" setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, Lock, Key, Delete, View, Warning, CopyDocument } from '@element-plus/icons-vue'
import type { FileItem } from '../types/file'

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
        // Reset tab to permission on open? Or keep last? 
        // Original code reset it in openOperation: operationTab.value = 'permission'
        operationTab.value = 'permission'
    }
})

const handleClose = () => {
    emit('update:modelValue', false)
}

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
    <el-dialog :model-value="modelValue" width="700px" class="operation-dialog" align-center :show-close="false"
        @update:model-value="(val: boolean) => emit('update:modelValue', val)">
        <template #header>
            <div class="dialog-header">
                <span>操作控制台</span>
                <el-button link class="close-btn" @click="handleClose">
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
                            @click="handleUpdatePermission">保存更改</el-button>
                    </div>
                </div>
                <div v-else-if="operationTab === 'key'" class="op-section">
                    <div class="op-header">
                        <div class="op-title">生成访问 Key</div>
                        <div class="op-subtitle">当文件权限为密钥访问时，生成用于验证的 Key。</div>
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
                                    {{ file?.key ? '重新生成 Key' : '生成 Key' }}
                                </el-button>
                            </div>

                            <div v-if="file?.key" class="key-result-box">
                                <div class="key-label">生成的 Key</div>
                                <div class="key-content">
                                    <el-input :model-value="file.key" readonly>
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
                            <el-button type="danger" size="large" :loading="deleting" @click="handleDeleteFile">
                                确认删除
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<style scoped>
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