<script lang="ts" setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    Menu as IconMenu,
    User,
    Expand,
    Monitor,
    Folder,
    ArrowDown,
    ArrowRight
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const isCollapse = ref(false)
const route = useRoute()
const router = useRouter()

// Menu Data Configuration
const menuItems = [
    {
        title: '控制台',
        path: '/home/dashboard',
        icon: IconMenu
    },
    {
        title: '文件管理',
        path: '/home/files',
        icon: Folder,
        children: [
            { title: '文件列表', path: '/home/files/list' },
            { title: '文件上传', path: '/home/files/upload' }
        ]
    }
]

// State for expanded submenus
const expandedKeys = ref<string[]>(['/home/files']) // Default expand file management

const toggleExpand = (path: string) => {
    const index = expandedKeys.value.indexOf(path)
    if (index > -1) {
        expandedKeys.value.splice(index, 1)
    } else {
        expandedKeys.value.push(path)
    }
}

const isExpanded = (path: string) => expandedKeys.value.includes(path)

const isActive = (path: string) => route.path === path || route.path.startsWith(path + '/')

const handleMenuClick = (item: any) => {
    if (item.children) {
        if (isCollapse.value) {
            isCollapse.value = false // Auto expand sidebar if clicking a collapsed parent with children
            if (!expandedKeys.value.includes(item.path)) {
                expandedKeys.value.push(item.path)
            }
        } else {
            toggleExpand(item.path)
        }
    } else {
        router.push(item.path)
    }
}

const handleLogout = () => {
    const userStore = useUserStore()
    userStore.logout()
    router.push('/login')
}

const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
}
</script>

<template>
    <el-container class="layout-container">
        <el-aside :width="isCollapse ? '64px' : '240px'" class="aside">
            <!-- Logo & Toggle Area -->
            <div class="sidebar-header" :class="{ 'collapsed': isCollapse }">
                <div class="logo-area">
                    <el-icon class="logo-icon">
                        <Monitor />
                    </el-icon>
                    <span v-show="!isCollapse" class="logo-text">资源管理</span>
                </div>
                <div class="toggle-btn" @click="toggleCollapse">
                    <el-icon>
                        <Expand v-if="isCollapse" />
                        <div v-else class="sidebar-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor"
                                    stroke-width="1.5" />
                                <path d="M6 3V13" stroke="currentColor" stroke-width="1.5" />
                            </svg>
                        </div>
                    </el-icon>
                </div>
            </div>

            <!-- Custom Menu -->
            <div class="menu-container">
                <div v-for="item in menuItems" :key="item.path" class="menu-group">
                    <!-- Menu Item (Parent or Leaf) -->
                    <div class="menu-item" :class="{
                        'is-active': !item.children && isActive(item.path),
                        'is-parent': item.children,
                        'collapsed': isCollapse
                    }" @click="handleMenuClick(item)">

                        <el-icon class="menu-icon">
                            <component :is="item.icon" />
                        </el-icon>

                        <span v-if="!isCollapse" class="menu-title">{{ item.title }}</span>

                        <!-- Arrow for submenu -->
                        <el-icon v-if="!isCollapse && item.children" class="arrow-icon"
                            :class="{ 'is-expanded': isExpanded(item.path) }">
                            <ArrowRight />
                        </el-icon>
                    </div>

                    <!-- Submenu Children -->
                    <div v-if="item.children && !isCollapse && isExpanded(item.path)" class="submenu">
                        <div v-for="child in item.children" :key="child.path" class="menu-item sub-item"
                            :class="{ 'is-active': isActive(child.path) }" @click.stop="router.push(child.path)">
                            <span class="menu-title">{{ child.title }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- User Info -->
            <div class="user-container">
                <el-dropdown trigger="click" class="user-dropdown" :class="{ 'collapsed': isCollapse }">
                    <div class="user-info">
                        <el-avatar :size="32" :icon="User" />
                        <span v-show="!isCollapse" class="username">Admin</span>
                        <el-icon v-show="!isCollapse" class="el-icon--right">
                            <ArrowDown />
                        </el-icon>
                    </div>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item divided @click="handleLogout">Logout</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </el-aside>

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

.aside {
    background-color: #f7f8fa;
    transition: width 0.3s cubic-bezier(0.2, 0, 0, 1);
    display: flex;
    flex-direction: column;
    border-right: none;
    /* Removed border as main content will have spacing */
    overflow-x: hidden;
    position: relative;
    z-index: 10;

    // Custom Sidebar Header
    .sidebar-header {
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        color: #1d2129;
        flex-shrink: 0;

        .logo-area {
            display: flex;
            align-items: center;
            overflow: hidden;

            .logo-icon {
                font-size: 24px;
                color: #0066ff;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 8px;
                flex-shrink: 0;
            }

            .logo-text {
                font-size: 16px;
                font-weight: 600;
                white-space: nowrap;
            }
        }

        .toggle-btn {
            cursor: pointer;
            color: #86909c;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            transition: all 0.2s;

            &:hover {
                background-color: rgba(0, 0, 0, 0.05);
                color: #1d2129;
            }

            .sidebar-icon {
                display: flex;
                align-items: center;
            }
        }

        &.collapsed {
            padding: 0;
            justify-content: center;

            .logo-area {
                .logo-icon {
                    margin-right: 0;
                }
            }

            .toggle-btn {
                position: absolute;
                top: 18px;
                display: none;
            }

            // Re-enable toggle btn in collapsed mode properly
            .logo-area {
                display: none;
            }

            .toggle-btn {
                display: flex;
                position: static;
                width: 100%;
                height: 100%;

                :deep(.el-icon) {
                    font-size: 20px;
                }
            }
        }
    }

    .menu-container {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 12px;

        .menu-group {
            margin-bottom: 4px;
        }

        .menu-item {
            display: flex;
            align-items: center;
            height: 40px;
            padding: 0 12px;
            margin-bottom: 4px;
            border-radius: 8px;
            cursor: pointer;
            color: #4e5969;
            transition: all 0.2s;
            white-space: nowrap;
            overflow: hidden;

            &:hover {
                background-color: rgba(0, 0, 0, 0.04);
                color: #1d2129;
            }

            &.is-active {
                background-color: #e8f3ff;
                color: #0066ff;
                font-weight: 500;

                .menu-icon {
                    color: #0066ff;
                }
            }

            &.collapsed {
                justify-content: center;
                padding: 0;

                .menu-icon {
                    margin-right: 0;
                }
            }

            .menu-icon {
                font-size: 18px;
                margin-right: 10px;
                flex-shrink: 0;
                color: #4e5969;
            }

            .menu-title {
                font-size: 14px;
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .arrow-icon {
                font-size: 12px;
                color: #86909c;
                transition: transform 0.3s;

                &.is-expanded {
                    transform: rotate(90deg);
                }
            }
        }

        .submenu {
            margin-left: 12px;
            padding-left: 12px;
            border-left: 1px solid #e5e6eb;

            .sub-item {
                height: 36px;
                font-size: 13px;

                .menu-title {
                    color: #4e5969;
                }

                &.is-active {
                    background-color: transparent;

                    .menu-title {
                        color: #0066ff;
                        font-weight: 500;
                    }
                }

                &:hover {
                    background-color: rgba(0, 0, 0, 0.04);
                }
            }
        }
    }

    .user-container {
        padding: 16px;
        border-top: 1px solid rgba(0, 0, 0, 0.04);
        flex-shrink: 0;

        .user-dropdown {
            width: 100%;
            cursor: pointer;

            .user-info {
                display: flex;
                align-items: center;
                padding: 8px;
                border-radius: 8px;
                transition: background-color 0.2s;

                &:hover {
                    background-color: rgba(0, 0, 0, 0.04);
                }

                .username {
                    margin-left: 12px;
                    flex: 1;
                    font-size: 14px;
                    color: #1d2129;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .el-icon--right {
                    color: #86909c;
                    margin-left: 8px;
                }
            }

            &.collapsed {
                .user-info {
                    justify-content: center;
                    padding: 8px 0;

                    .username,
                    .el-icon--right {
                        display: none;
                    }
                }
            }
        }
    }
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