<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Folder, CaretRight } from '@element-plus/icons-vue'
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
        ElMessage.warning('请先将权限设置为 key')
        return
    }
    generating.value = true
    try {
        const res = await generateKey(selectedFile.value.hash, userStore.token)
        if (res.success) {
            const key = res.data || ''
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
                            <el-icon class="file-icon" :style="{ color: getIconColor(item.name) || '' }">
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

        <FileOperationDialog v-model="operationVisible" :file="selectedFile" :updating="updating"
            :generating="generating" :deleting="deleting" @update-permission="doUpdatePermission"
            @generate-key="doGenerateKey" @delete-file="doDeleteFile" />

        <FileInfoDialog v-model="infoVisible" :file="selectedFile" :preview-url="previewUrl" />
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
</style>