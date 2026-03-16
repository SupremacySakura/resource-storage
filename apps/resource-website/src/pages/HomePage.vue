<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'
import {
    Menu as IconMenu,
    UploadFilled,
    Document,
    Service,
    Fold
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const menuItems = [
    {
        title: '仪表盘',
        path: '/home/dashboard',
        icon: IconMenu
    },
    {
        title: 'API 文档',
        path: '/home/api-docs',
        icon: Service
    },
    {
        title: '文件列表',
        path: '/home/files/list',
        icon: Document
    },
    {
        title: '上传文件',
        path: '/home/files/upload',
        icon: UploadFilled
    },
]

const username = '管理员'

const handleLogout = () => {
    userStore.logout()
    router.push('/login')
}

// Mobile Responsiveness Logic
const windowWidth = ref(window.innerWidth)
const sidebarOpen = ref(false)

const isMobile = computed(() => windowWidth.value < 1024) // Breakpoint at 1024px

const handleResize = () => {
    windowWidth.value = window.innerWidth
    if (!isMobile.value) {
        sidebarOpen.value = false // Reset state on desktop
    }
}

const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
    sidebarOpen.value = false
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})
</script>

<template>
    <el-container class="layout-container">
        <!-- Sidebar -->
        <Sidebar :menu-items="menuItems" :username="username" :is-mobile="isMobile" :is-open="sidebarOpen"
            @logout="handleLogout" @close="closeSidebar" />

        <!-- Main Content -->
        <el-container class="content-wrapper">
            <!-- Mobile Header -->
            <div v-if="isMobile" class="mobile-header glass-card">
                <div class="header-left">
                    <div class="menu-btn" @click="toggleSidebar">
                        <el-icon>
                            <Fold />
                        </el-icon>
                    </div>
                    <span class="page-title">资源<span class="highlight">存储</span></span>
                </div>
            </div>

            <el-main class="main-content">
                <div class="page-container">
                    <router-view v-slot="{ Component }">
                        <transition name="fade" mode="out-in">
                            <component :is="Component" />
                        </transition>
                    </router-view>
                </div>
            </el-main>
        </el-container>
    </el-container>
</template>

<style lang="scss" scoped>
.layout-container {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background-color: var(--color-bg-base);
    background-image:
        radial-gradient(circle at 15% 50%, rgba(6, 182, 212, 0.05), transparent 25%),
        radial-gradient(circle at 85% 30%, rgba(124, 58, 237, 0.05), transparent 25%);
}

.content-wrapper {
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
}

.mobile-header {
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    margin: 12px 12px 0 12px;
    z-index: 40;
    border-radius: 12px;
    background: var(--color-bg-glass);
    border: 1px solid #fff;

    .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .menu-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        color: var(--color-text-primary);
        cursor: pointer;
        background: transparent;
        border: 1px solid var(--border-color);

        &:active {
            transform: scale(0.95);
        }
    }

    .page-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--color-text-primary);

        .highlight {
            color: var(--color-primary);
        }
    }
}

.main-content {
    padding: 20px;
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;

    .page-container {
        flex: 1;
        overflow: hidden;
        position: relative;
        background: transparent;
    }
}

@media (max-width: 1024px) {
    .main-content {
        padding: 12px;
    }
}
</style>
