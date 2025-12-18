<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    Menu as IconMenu,
    Setting,
    User,
    Fold,
    Expand,
    Monitor,
    Folder,
    ArrowDown
} from '@element-plus/icons-vue'

const isCollapse = ref(false)
const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.path)

const handleLogout = () => {
    router.push('/login')
}

const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
}
</script>

<template>
    <el-container class="layout-container">
        <el-aside :width="isCollapse ? '64px' : '240px'" class="aside">
            <div class="logo-container">
                <el-icon class="logo-icon">
                    <Monitor />
                </el-icon>
                <span v-show="!isCollapse" class="logo-text">Resource Admin</span>
            </div>
            <el-menu :default-active="activeMenu" class="el-menu-vertical" :collapse="isCollapse" router
                background-color="#ffffff" text-color="#4e5969" active-text-color="#0066ff">
                <el-menu-item index="/home/welcome">
                    <el-icon>
                        <IconMenu />
                    </el-icon>
                    <template #title>控制台</template>
                </el-menu-item>

                <el-sub-menu index="/home/files">
                    <template #title>
                        <el-icon>
                            <Folder />
                        </el-icon>
                        <span>文件管理</span>
                    </template>
                    <el-menu-item index="/home/files/list">文件列表</el-menu-item>
                    <el-menu-item index="/home/files/upload">文件上传</el-menu-item>
                </el-sub-menu>

                <el-menu-item index="/home/settings">
                    <el-icon>
                        <Setting />
                    </el-icon>
                    <template #title>设置</template>
                </el-menu-item>
            </el-menu>
        </el-aside>

        <el-container>
            <el-header class="header">
                <div class="header-left">
                    <el-icon class="collapse-btn" @click="toggleCollapse">
                        <Expand v-if="isCollapse" />
                        <Fold v-else />
                    </el-icon>
                </div>
                <div class="header-right">
                    <el-dropdown trigger="click">
                        <span class="el-dropdown-link">
                            <el-avatar :size="32" :icon="User" />
                            <span class="username">Admin</span>
                            <el-icon class="el-icon--right">
                                <ArrowDown />
                            </el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item>Profile</el-dropdown-item>
                                <el-dropdown-item divided @click="handleLogout">Logout</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </el-header>

            <el-main class="main-content">
                <router-view v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </el-main>
        </el-container>
    </el-container>
</template>

<style lang="scss" scoped>
.layout-container {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
}

.aside {
    background-color: #ffffff;
    transition: width 0.3s;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e5e6eb;
    overflow-x: hidden;

    .logo-container {
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #ffffff;
        color: #0066ff;
        font-size: 20px;
        font-weight: bold;
        white-space: nowrap;
        border-bottom: 1px solid #e5e6eb;

        .logo-icon {
            font-size: 24px;
            margin-right: 8px;
            color: #0066ff;
        }

        .logo-text {
            font-size: 18px;
        }
    }

    .el-menu-vertical {
        border-right: none;
        flex: 1;

        &:not(.el-menu--collapse) {
            width: 240px;
        }

        :deep(.el-menu-item.is-active) {
            background-color: #f2f7ff;
            border-right: 3px solid #0066ff;
        }
    }
}

.header {
    height: 60px;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    padding: 0 20px;
    z-index: 9;
    border-bottom: 1px solid #e5e6eb;

    .header-left {
        display: flex;
        align-items: center;

        .collapse-btn {
            font-size: 20px;
            cursor: pointer;
            color: #4e5969;

            &:hover {
                color: #0066ff;
            }
        }
    }

    .header-right {
        .el-dropdown-link {
            cursor: pointer;
            display: flex;
            align-items: center;
            color: #1d2129;

            .username {
                margin: 0 8px;
                font-weight: 500;
            }
        }
    }
}

.main-content {
    background-color: #f7f8fa;
    padding: 20px;
    overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
