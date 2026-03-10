<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { Document, Picture, VideoCamera, Service, View, Lock, Refresh } from '@element-plus/icons-vue'
import { getFileList } from '../services/apis/files'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import type { FileItem } from '../types/file'
import { formatSize, getExt, getFileIcon, isAudioExt, isImageExt, isVideoExt } from '../utils/file'
import { formatDate } from '../utils/common'

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
        <!-- Top: Metrics -->
        <div class="section-block">
            <div class="metric-grid">
                <div class="metric-card glass-card">
                    <div class="metric-icon-wrapper primary">
                        <el-icon>
                            <Document />
                        </el-icon>
                    </div>
                    <div class="metric-content">
                        <span class="label">文件总数</span>
                        <div class="value">{{ totalFiles }}</div>
                        <div class="sub">已完成：{{ completedCount }}</div>
                    </div>
                </div>

                <div class="metric-card glass-card">
                    <div class="metric-icon-wrapper secondary">
                        <el-icon>
                            <Service />
                        </el-icon>
                    </div>
                    <div class="metric-content">
                        <span class="label">存储占用</span>
                        <div class="value">{{ formatSize(totalSize) }}</div>
                        <div class="sub">平均：{{ formatSize(avgSize) }}</div>
                    </div>
                </div>

                <div class="metric-card glass-card">
                    <div class="metric-icon-wrapper success">
                        <el-icon>
                            <View />
                        </el-icon>
                    </div>
                    <div class="metric-content">
                        <span class="label">公开文件</span>
                        <div class="value">{{ publicCount }}</div>
                        <div class="progress-mini">
                            <div class="bar"
                                :style="{ width: privacyPublicPercent + '%', background: 'var(--color-success)' }">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="metric-card glass-card">
                    <div class="metric-icon-wrapper warning">
                        <el-icon>
                            <Lock />
                        </el-icon>
                    </div>
                    <div class="metric-content">
                        <span class="label">密钥文件</span>
                        <div class="value">{{ keyCount }}</div>
                        <div class="progress-mini">
                            <div class="bar"
                                :style="{ width: privacyKeyPercent + '%', background: 'var(--color-warning)' }"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Middle: Overview -->
        <div class="section-block two-columns">
            <div class="column-item">
                <div class="panel-card glass-card">
                    <div class="panel-header">
                        <h3>存储概览</h3>
                        <el-button link type="primary" @click="fetchFiles">
                            <el-icon>
                                <Refresh />
                            </el-icon>
                        </el-button>
                    </div>
                    <div class="overview-grid">
                        <div class="overview-item">
                            <div class="overview-title">
                                <el-icon class="icon-img">
                                    <Picture />
                                </el-icon>
                                <span>图片</span>
                            </div>
                            <el-progress :percentage="typePercent.images" :stroke-width="6"
                                :color="'var(--color-primary)'" />
                            <div class="overview-sub">{{ imagesCount }} 个</div>
                        </div>
                        <div class="overview-item">
                            <div class="overview-title">
                                <el-icon class="icon-vid">
                                    <VideoCamera />
                                </el-icon>
                                <span>视频</span>
                            </div>
                            <el-progress :percentage="typePercent.videos" :stroke-width="6"
                                :color="'var(--color-secondary)'" />
                            <div class="overview-sub">{{ videosCount }} 个</div>
                        </div>
                        <div class="overview-item">
                            <div class="overview-title">
                                <el-icon class="icon-aud">
                                    <Service />
                                </el-icon>
                                <span>音频</span>
                            </div>
                            <el-progress :percentage="typePercent.audios" :stroke-width="6"
                                :color="'var(--color-success)'" />
                            <div class="overview-sub">{{ audiosCount }} 个</div>
                        </div>
                        <div class="overview-item">
                            <div class="overview-title">
                                <el-icon class="icon-oth">
                                    <Document />
                                </el-icon>
                                <span>其他</span>
                            </div>
                            <el-progress :percentage="typePercent.others" :stroke-width="6"
                                :color="'var(--color-info)'" />
                            <div class="overview-sub">{{ othersCount }} 个</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="column-item">
                <div class="panel-card glass-card">
                    <div class="panel-header">
                        <h3>权限分布</h3>
                        <el-button link type="primary" @click="fetchFiles">
                            <el-icon>
                                <Refresh />
                            </el-icon>
                        </el-button>
                    </div>
                    <div class="privacy-grid">
                        <div class="privacy-item">
                            <div class="privacy-title">
                                <span class="badge success">公开</span>
                            </div>
                            <div class="privacy-value">{{ publicCount }}</div>
                            <el-progress :percentage="privacyPublicPercent" :stroke-width="6" status="success" />
                        </div>
                        <div class="privacy-item">
                            <div class="privacy-title">
                                <span class="badge warning">密钥保护</span>
                            </div>
                            <div class="privacy-value">{{ keyCount }}</div>
                            <el-progress :percentage="privacyKeyPercent" :stroke-width="6" status="warning" />
                        </div>
                        <div class="privacy-item">
                            <div class="privacy-title">
                                <span class="badge info">已完成</span>
                            </div>
                            <div class="privacy-value">{{ completedPercent }}%</div>
                            <el-progress :percentage="completedPercent" :stroke-width="6" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom: Recent Files -->
        <div class="section-block">
            <div class="panel-card glass-card no-padding">
                <div class="panel-header padding">
                    <h3>最近文件</h3>
                    <el-button link type="primary" @click="fetchFiles">
                        <el-icon>
                            <Refresh />
                        </el-icon>
                    </el-button>
                </div>

                <div v-if="recentFiles.length === 0" class="empty-list">暂无数据</div>

                <div v-else class="responsive-table-wrapper">
                    <el-table :data="recentFiles" style="width: 100%" class="transparent-table">
                        <el-table-column prop="name" label="文件名" min-width="200">
                            <template #default="{ row }">
                                <div class="file-name-cell">
                                    <el-icon class="file-icon">
                                        <component :is="getFileIcon(row.name)" />
                                    </el-icon>
                                    <span class="text">{{ row.name }}</span>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="size" label="大小" width="120">
                            <template #default="{ row }">
                                <span class="mono-text">{{ formatSize(row.size) }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="role" label="权限" width="120">
                            <template #default="{ row }">
                                <span class="badge" :class="row.role === 'public' ? 'success' : 'warning'">
                                    {{ row.role === 'public' ? '公开' : '密钥' }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="modifiedTime" label="修改时间" width="180">
                            <template #default="{ row }">
                                <span class="mono-text">{{ formatDate(row.modifiedTime) }}</span>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.dashboard-container {
    height: 100%;
    padding: 20px;
    padding-bottom: 60px;
    overflow-y: auto;
}

.section-block {
    margin-bottom: 24px;
}

/* Metric Cards */
.metric-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}

.metric-card {
    padding: 20px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    transition: transform 0.2s;

    &:hover {
        transform: translateY(-2px);
    }

    .metric-icon-wrapper {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        flex-shrink: 0;

        &.primary {
            background: rgba(6, 182, 212, 0.1);
            color: var(--color-primary);
        }

        &.secondary {
            background: rgba(139, 92, 246, 0.1);
            color: var(--color-secondary);
        }

        &.success {
            background: rgba(16, 185, 129, 0.1);
            color: var(--color-success);
        }

        &.warning {
            background: rgba(245, 158, 11, 0.1);
            color: var(--color-warning);
        }
    }

    .metric-content {
        flex: 1;

        .label {
            font-size: 13px;
            color: var(--color-text-secondary);
            display: block;
            margin-bottom: 4px;
        }

        .value {
            font-size: 24px;
            font-weight: 700;
            color: var(--color-text-primary);
            font-family: var(--font-family-mono);
            margin-bottom: 4px;
        }

        .sub {
            font-size: 12px;
            color: var(--color-text-tertiary);
        }

        .progress-mini {
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            margin-top: 8px;
            overflow: hidden;

            .bar {
                height: 100%;
                border-radius: 2px;
            }
        }
    }
}

/* Overview Panels */
.two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}

.column-item {
    height: 100%;
}

.panel-card {
    padding: 24px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;

    &.no-padding {
        padding: 0;
    }

    /* Only fill height when inside a grid column to ensure alignment */
    .column-item & {
        height: 100%;
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        flex-shrink: 0;

        &.padding {
            padding: 20px 24px;
            margin-bottom: 0;
            border-bottom: 1px solid var(--border-color);
        }

        h3 {
            font-size: 16px;
            font-weight: 600;
            color: var(--color-text-primary);
            margin: 0;
        }
    }
}

.responsive-table-wrapper {
    width: 100%;
    overflow-x: auto;
}

.overview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.overview-item {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid var(--border-color);

    .overview-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: var(--color-text-primary);
        margin-bottom: 12px;
        font-size: 14px;

        .icon-img {
            color: var(--color-primary);
        }

        .icon-vid {
            color: var(--color-secondary);
        }

        .icon-aud {
            color: var(--color-success);
        }

        .icon-oth {
            color: var(--color-info);
        }
    }

    .overview-sub {
        font-size: 12px;
        color: var(--color-text-secondary);
        margin-top: 8px;
        text-align: right;
        font-family: var(--font-family-mono);
    }
}

.privacy-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
}

.privacy-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid var(--border-color);

    .privacy-value {
        font-size: 20px;
        font-weight: 700;
        color: var(--color-text-primary);
        font-family: var(--font-family-mono);
    }
}

/* Badges */
.badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;

    &.success {
        background: rgba(16, 185, 129, 0.2);
        color: var(--color-success);
    }

    &.warning {
        background: rgba(245, 158, 11, 0.2);
        color: var(--color-warning);
    }

    &.info {
        background: rgba(59, 130, 246, 0.2);
        color: var(--color-info);
    }
}

/* Table Styles */
.transparent-table {
    --el-table-bg-color: transparent;
    --el-table-tr-bg-color: transparent;
    --el-table-header-bg-color: rgba(255, 255, 255, 0.02);
    --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.05);
    --el-table-border-color: var(--border-color);
    background-color: transparent !important;
}

.file-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .file-icon {
        font-size: 18px;
        color: var(--color-text-secondary);
    }

    .text {
        color: var(--color-text-primary);
        font-weight: 500;
    }
}

.mono-text {
    font-family: var(--font-family-mono);
    color: var(--color-text-secondary);
    font-size: 13px;
}

.empty-list {
    color: var(--color-text-secondary);
    text-align: center;
    padding: 40px;
}

/* Responsive */
@media (max-width: 1200px) {
    .metric-grid {
        grid-template-columns: 1fr 1fr;
    }
}

@media (max-width: 900px) {
    .two-columns {
        grid-template-columns: 1fr;
    }

    .privacy-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 600px) {
    .dashboard-container {
        padding: 16px;
    }

    .metric-grid {
        grid-template-columns: 1fr;
    }

    .overview-grid {
        grid-template-columns: 1fr;
    }
}
</style>
