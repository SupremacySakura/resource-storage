<script lang="ts" setup>
import { useRouter } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'
import {
    Menu as IconMenu,
    UploadFilled,
    Document
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const menuItems = [
    {
        title: '控制台',
        path: '/home/dashboard',
        icon: IconMenu
    },
    {
        title: '文件列表',
        path: '/home/files/list',
        icon: Document
    },
    {
        title: '文件上传',
        path: '/home/files/upload',
        icon: UploadFilled
    },
]

const username = 'Admin'

const handleLogout = () => {
    userStore.logout()
    router.push('/login')
}
</script>

<template>
    <el-container class="layout-container">
        <Sidebar :menu-items="menuItems" :username="username" @logout="handleLogout" />

        <!-- Main Content -->
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
</template>

<style lang="scss" scoped>
.layout-container {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background-color: #f7f8fa;
}

.main-content {
    background-color: #f7f8fa;
    padding: 12px;
    /* Spacing around the white card */
    overflow: hidden;
    height: 100vh;

    .page-container {
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        height: 100%;
        overflow: hidden;
        position: relative;
    }
}

// Fade animation
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
