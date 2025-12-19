<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { Document, Picture, VideoCamera, Service, View, Lock } from '@element-plus/icons-vue'
import { getFileList } from '../services/apis/files'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

interface FileItem {
    hash: string
    name: string
    role: 'public' | 'key'
    key?: string
    type: 'file'
    size: number
    chunkCount: number
    chunks: any[]
    modifiedTime: string
}

const userStore = useUserStore()
const fileList = ref<FileItem[]>([])
const loading = ref(false)

const fetchFiles = async () => {
    loading.value = true
    try {
        const res = await getFileList(userStore.token)
        if (res.success) {
            fileList.value = res.data
        } else {
            ElMessage.error(res.message || '获取文件列表失败')
        }
    } catch (e) {
        ElMessage.error('获取文件列表出错')
    } finally {
        loading.value = false
    }
}

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (value: string | number) => {
    if (!value) return ''
    let ts = typeof value === 'string' ? Number(value.trim()) : value
    if (ts < 1e12) ts *= 1000
    const date = new Date(ts)
    return isNaN(date.getTime()) ? '' : date.toLocaleString()
}

const getExt = (filename: string) => filename.split('.').pop()?.toLowerCase() || ''
const isImageExt = (ext: string) => ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
const isVideoExt = (ext: string) => ['mp4', 'webm', 'ogg'].includes(ext)
const isAudioExt = (ext: string) => ['mp3', 'wav'].includes(ext)

const getFileIcon = (filename: string) => {
    const ext = getExt(filename)
    if (isImageExt(ext)) return Picture
    if (isVideoExt(ext)) return VideoCamera
    if (isAudioExt(ext)) return Service
    return Document
}

const totalFiles = computed(() => fileList.value.length)
const totalSize = computed(() => fileList.value.reduce((sum, f) => +sum + Number(f.size || 0), 0))
const avgSize = computed(() => (totalFiles.value ? Math.round(totalSize.value / totalFiles.value) : 0))

const publicCount = computed(() => fileList.value.filter(f => f.role === 'public').length)
const keyCount = computed(() => fileList.value.filter(f => f.role === 'key').length)
const privacyPublicPercent = computed(() => totalFiles.value ? Math.round((publicCount.value / totalFiles.value) * 100) : 0)
const privacyKeyPercent = computed(() => totalFiles.value ? Math.round((keyCount.value / totalFiles.value) * 100) : 0)

const completedCount = computed(() => fileList.value.filter(f => (f.chunks?.length || 0) >= (f.chunkCount || 0)).length)
const completedPercent = computed(() => totalFiles.value ? Math.round((completedCount.value / totalFiles.value) * 100) : 0)

const imagesCount = computed(() => fileList.value.filter(f => isImageExt(getExt(f.name))).length)
const videosCount = computed(() => fileList.value.filter(f => isVideoExt(getExt(f.name))).length)
const audiosCount = computed(() => fileList.value.filter(f => isAudioExt(getExt(f.name))).length)
const othersCount = computed(() => Math.max(totalFiles.value - imagesCount.value - videosCount.value - audiosCount.value, 0))
const typePercent = computed(() => {
    const total = totalFiles.value || 1
    return {
        images: Math.round((imagesCount.value / total) * 100),
        videos: Math.round((videosCount.value / total) * 100),
        audios: Math.round((audiosCount.value / total) * 100),
        others: Math.round((othersCount.value / total) * 100),
    }
})

const recentFiles = computed(() => {
    return [...fileList.value]
        .sort((a, b) => Number(b.modifiedTime) - Number(a.modifiedTime))
        .slice(0, 8)
})

onMounted(() => {
    fetchFiles()
})
</script>

<template>
    <div class="dashboard-container" v-loading="loading">
        <el-row :gutter="20" class="full-height">
            <!-- Top: Metrics -->
            <el-col :span="24">
                <div class="metric-grid">
                    <el-card class="box-card metric-card" :body-style="{ padding: '16px' }">
                        <div class="metric-header">
                            <el-icon class="metric-icon">
                                <Document />
                            </el-icon>
                            <span>文件总数</span>
                        </div>
                        <div class="metric-value">{{ totalFiles }}</div>
                        <div class="metric-sub">已完成上传：{{ completedCount }} / {{ totalFiles }}</div>
                    </el-card>
                    <el-card class="box-card metric-card" :body-style="{ padding: '16px' }">
                        <div class="metric-header">
                            <el-icon class="metric-icon">
                                <Service />
                            </el-icon>
                            <span>存储占用</span>
                        </div>
                        <div class="metric-value">{{ formatSize(totalSize) }}</div>
                        <div class="metric-sub">平均大小：{{ formatSize(avgSize) }}</div>
                    </el-card>
                    <el-card class="box-card metric-card" :body-style="{ padding: '16px' }">
                        <div class="metric-header">
                            <el-icon class="metric-icon">
                                <View />
                            </el-icon>
                            <span>公开文件</span>
                        </div>
                        <div class="metric-value">{{ publicCount }}</div>
                        <el-progress :percentage="privacyPublicPercent" :stroke-width="8" status="success" />
                    </el-card>
                    <el-card class="box-card metric-card" :body-style="{ padding: '16px' }">
                        <div class="metric-header">
                            <el-icon class="metric-icon">
                                <Lock />
                            </el-icon>
                            <span>密钥文件</span>
                        </div>
                        <div class="metric-value">{{ keyCount }}</div>
                        <el-progress :percentage="privacyKeyPercent" :stroke-width="8" status="warning" />
                    </el-card>
                </div>
            </el-col>

            <!-- Middle: Overview -->
            <el-col :span="12" class="col-block">
                <el-card class="box-card" :body-style="{ padding: '20px' }">
                    <template #header>
                        <div class="card-header">
                            <span>存储概览</span>
                            <el-button link type="primary" @click="fetchFiles">刷新</el-button>
                        </div>
                    </template>
                    <div class="overview-grid">
                        <div class="overview-item">
                            <div class="overview-title">
                                <el-icon>
                                    <Picture />
                                </el-icon>
                                <span>图片</span>
                            </div>
                            <el-progress :percentage="typePercent.images" :stroke-width="10" />
                            <div class="overview-sub">{{ imagesCount }} 个</div>
                        </div>
                        <div class="overview-item">
                            <div class="overview-title">
                                <el-icon>
                                    <VideoCamera />
                                </el-icon>
                                <span>视频</span>
                            </div>
                            <el-progress :percentage="typePercent.videos" :stroke-width="10" />
                            <div class="overview-sub">{{ videosCount }} 个</div>
                        </div>
                        <div class="overview-item">
                            <div class="overview-title">
                                <el-icon>
                                    <Service />
                                </el-icon>
                                <span>音频</span>
                            </div>
                            <el-progress :percentage="typePercent.audios" :stroke-width="10" />
                            <div class="overview-sub">{{ audiosCount }} 个</div>
                        </div>
                        <div class="overview-item">
                            <div class="overview-title">
                                <el-icon>
                                    <Document />
                                </el-icon>
                                <span>其他</span>
                            </div>
                            <el-progress :percentage="typePercent.others" :stroke-width="10" />
                            <div class="overview-sub">{{ othersCount }} 个</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="12" class="col-block">
                <el-card class="box-card" :body-style="{ padding: '20px' }">
                    <template #header>
                        <div class="card-header">
                            <span>隐私概览</span>
                            <el-button link type="primary" @click="fetchFiles">刷新</el-button>
                        </div>
                    </template>
                    <div class="privacy-grid">
                        <div class="privacy-item">
                            <div class="privacy-title">
                                <el-tag type="success" effect="dark" size="small">公开</el-tag>
                            </div>
                            <div class="privacy-value">{{ publicCount }}</div>
                            <el-progress :percentage="privacyPublicPercent" :stroke-width="10" status="success" />
                        </div>
                        <div class="privacy-item">
                            <div class="privacy-title">
                                <el-tag type="warning" effect="dark" size="small">密钥</el-tag>
                            </div>
                            <div class="privacy-value">{{ keyCount }}</div>
                            <el-progress :percentage="privacyKeyPercent" :stroke-width="10" status="warning" />
                        </div>
                        <div class="privacy-item">
                            <div class="privacy-title">
                                <el-tag type="info" effect="dark" size="small">上传完成</el-tag>
                            </div>
                            <div class="privacy-value">{{ completedPercent }}%</div>
                            <el-progress :percentage="completedPercent" :stroke-width="10" />
                        </div>
                    </div>
                </el-card>
            </el-col>

            <!-- Bottom: Recent Files -->
            <el-col :span="24" class="col-block">
                <el-card class="box-card" :body-style="{ padding: '0px' }">
                    <template #header>
                        <div class="card-header">
                            <span>最近文件</span>
                            <el-button link type="primary" @click="fetchFiles">刷新</el-button>
                        </div>
                    </template>
                    <div v-if="recentFiles.length === 0" class="empty-list">暂无数据</div>
                    <el-table v-else :data="recentFiles" border style="width: 100%">
                        <el-table-column prop="name" label="文件名" min-width="220" />
                        <el-table-column prop="size" label="大小" width="120">
                            <template #default="{ row }">{{ formatSize(row.size) }}</template>
                        </el-table-column>
                        <el-table-column prop="role" label="权限" width="120">
                            <template #default="{ row }">
                                <el-tag :type="row.role === 'public' ? 'success' : 'warning'" size="small"
                                    effect="dark">
                                    {{ row.role === 'public' ? '公开' : '密钥' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="modifiedTime" label="修改时间" width="180">
                            <template #default="{ row }">{{ formatDate(row.modifiedTime) }}</template>
                        </el-table-column>
                        <el-table-column label="类型" width="120">
                            <template #default="{ row }">
                                <el-icon>
                                    <component :is="getFileIcon(row.name)" />
                                </el-icon>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>


<style lang="scss" scoped>
.dashboard-container {
    height: 100%;
    padding: 0;
    background-color: #f0f2f5;
}

.full-height {
    height: 100%;
}

.box-card {
    border: none;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    color: #303133;
}

.metric-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}

.metric-card .metric-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #606266;
    font-size: 14px;
}

.metric-card .metric-icon {
    font-size: 18px;
    color: #909399;
}

.metric-card .metric-value {
    font-size: 24px;
    font-weight: 700;
    color: #303133;
    margin: 6px 0 8px;
}

.metric-card .metric-sub {
    font-size: 12px;
    color: #909399;
}

.col-block {
    margin-top: 20px;
}

.overview-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

.overview-item {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 16px;
    background-color: #fff;
}

.overview-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
}

.overview-sub {
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
}

.privacy-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.privacy-item {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 16px;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.privacy-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.privacy-value {
    font-size: 20px;
    font-weight: 700;
    color: #303133;
}

.empty-list {
    color: #909399;
    text-align: center;
    padding: 20px;
}
</style>
