<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
    User,
    Expand,
    Monitor,
    ArrowDown
} from '@element-plus/icons-vue'

const props = defineProps<{
    menuItems: Array<{
        title: string
        path: string
        icon: any
    }>
    username: string
}>()

const emit = defineEmits<{
    (e: 'logout'): void
}>()

const isCollapse = ref(false)
const router = useRouter()

const isActive = (path: string) => router.currentRoute.value.path === path || router.currentRoute.value.path.startsWith(path + '/')

const handleMenuClick = (item: any) => {
    router.push(item.path)
}

const handleLogout = () => {
    emit('logout')
}

const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
}
</script>

<template>
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
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" stroke-width="1.5" />
                            <path d="M6 3V13" stroke="currentColor" stroke-width="1.5" />
                        </svg>
                    </div>
                </el-icon>
            </div>
        </div>

        <!-- Custom Menu -->
        <div class="menu-container">
            <div v-for="item in menuItems" :key="item.path" class="menu-group">
                <!-- Menu Item -->
                <div class="menu-item" :class="{
                    'is-active': isActive(item.path),
                    'collapsed': isCollapse
                }" @click="handleMenuClick(item)">

                    <el-icon class="menu-icon">
                        <component :is="item.icon" />
                    </el-icon>

                    <span v-if="!isCollapse" class="menu-title">{{ item.title }}</span>
                </div>
            </div>
        </div>

        <!-- User Info -->
        <div class="user-container">
            <el-dropdown trigger="click" class="user-dropdown" :class="{ 'collapsed': isCollapse }">
                <div class="user-info">
                    <el-avatar :size="32" :icon="User" />
                    <span v-show="!isCollapse" class="username">{{ username }}</span>
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
</template>

<style lang="scss" scoped>
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
</style>
