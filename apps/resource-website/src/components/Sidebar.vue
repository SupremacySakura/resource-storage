<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
    User,
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
    isMobile?: boolean
    isOpen?: boolean
}>()

const emit = defineEmits<{
    (e: 'logout'): void
    (e: 'close'): void
}>()

const isCollapse = ref(false)
const router = useRouter()

const isActive = (path: string) => router.currentRoute.value.path === path || router.currentRoute.value.path.startsWith(path + '/')

const handleMenuClick = (item: any) => {
    router.push(item.path)
    if (props.isMobile) {
        emit('close')
    }
}

const handleLogout = () => {
    emit('logout')
}

const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
}

// Sidebar width logic
const sidebarWidth = computed(() => {
    if (props.isMobile) return '280px'
    return isCollapse.value ? '72px' : '260px'
})
</script>

<template>
    <div class="sidebar-wrapper" :class="{ 'mobile': isMobile, 'mobile-open': isOpen }">
        <!-- Backdrop for mobile -->
        <div v-if="isMobile && isOpen" class="sidebar-backdrop" @click="emit('close')"></div>

        <el-aside :width="sidebarWidth" class="aside glass-card" :class="{ 'collapsed': !isMobile && isCollapse }">
            <!-- Logo & Toggle Area -->
            <div class="sidebar-header">
                <div class="logo-area" v-show="!isCollapse || isMobile">
                    <div class="logo-icon-wrapper">
                        <el-icon class="logo-icon">
                            <Monitor />
                        </el-icon>
                    </div>
                    <span class="logo-text">资源<span class="highlight">存储</span></span>
                </div>

                <!-- Desktop Toggle -->
                <div v-if="!isMobile" class="toggle-btn" @click="toggleCollapse">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>

                <!-- Mobile Close -->
                <button v-if="isMobile" class="toggle-btn" type="button" aria-label="关闭侧边栏" @click="emit('close')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>

            <!-- Menu Items -->
            <div class="menu-container">
                <div v-for="(item, index) in menuItems" :key="index" class="menu-group">
                    <div class="menu-item" :class="{
                        'is-active': isActive(item.path),
                        'collapsed': !isMobile && isCollapse
                    }" @click="handleMenuClick(item)">
                        
                        <div class="active-indicator"></div>
                        
                        <el-icon class="menu-icon">
                            <component :is="item.icon" />
                        </el-icon>
                        
                        <span v-if="!isCollapse || isMobile" class="menu-title">{{ item.title }}</span>
                        
                        <!-- Tooltip for collapsed state -->
                        <div v-if="!isMobile && isCollapse" class="menu-tooltip">
                            {{ item.title }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- User Info -->
            <div class="user-container">
                <el-dropdown trigger="click" class="user-dropdown" :class="{ 'collapsed': !isMobile && isCollapse }">
                    <button class="user-info" type="button" aria-label="用户菜单">
                        <div class="avatar-wrapper">
                            <el-avatar :size="32" :icon="User" class="custom-avatar" />
                            <div class="status-dot"></div>
                        </div>
                        <div v-show="isMobile || !isCollapse" class="user-details">
                            <span class="username">{{ username }}</span>
                            <span class="role">管理员</span>
                        </div>
                        <el-icon v-show="isMobile || !isCollapse" class="el-icon--right">
                            <ArrowDown />
                        </el-icon>
                    </button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </el-aside>
    </div>
</template>

<style lang="scss" scoped>
.sidebar-wrapper {
    transition: all 0.3s ease;
    z-index: 50;

    &.mobile {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        z-index: 100;
        pointer-events: none;

        .aside {
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            height: 100%;
            border-radius: 0 16px 16px 0;
            border: 1px solid var(--border-color);
            border-left: none;
            background: var(--color-bg-secondary);
        }

        .sidebar-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(4px);
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }

        &.mobile-open {
            pointer-events: auto;

            .aside {
                transform: translateX(0);
            }

            .sidebar-backdrop {
                opacity: 1;
                pointer-events: auto;
            }
        }
    }
}

.aside {
    transition: width 0.3s cubic-bezier(0.2, 0, 0, 1);
    display: flex;
    flex-direction: column;
    overflow-x: visible;
    height: 100%;
    border: none;
    box-shadow: none;
    background: var(--color-bg-glass);
    border-right: 1px solid var(--border-color);

    // Custom Sidebar Header
    .sidebar-header {
        height: 70px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        color: var(--color-text-primary);
        flex-shrink: 0;
        border-bottom: 1px solid var(--border-color);

        .logo-area {
            display: flex;
            align-items: center;
            overflow: hidden;
            gap: 12px;

            .logo-icon-wrapper {
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px var(--color-primary-glow);
            }

            .logo-icon {
                font-size: 20px;
                color: #fff;
            }

            .logo-text {
                font-size: 18px;
                font-weight: 700;
                white-space: nowrap;
                letter-spacing: -0.5px;
                color: var(--color-text-primary);
                
                .highlight {
                    color: var(--color-primary);
                }
            }
        }

        .toggle-btn {
            cursor: pointer;
            color: var(--color-text-secondary);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            transition: all 0.2s;
            border: 1px solid transparent;
            background: transparent;
            padding: 0;

            &:hover {
                background-color: rgba(0, 0, 0, 0.05);
                color: var(--color-text-primary);
            }
        }
    }

    .menu-container {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px 12px;

        .menu-item {
            position: relative;
            display: flex;
            align-items: center;
            height: 48px;
            padding: 0 16px;
            margin-bottom: 4px;
            border-radius: 12px;
            cursor: pointer;
            color: var(--color-text-secondary);
            transition: all 0.2s ease;
            white-space: nowrap;
            width: 100%;
            border: 1px solid transparent;
            background: transparent;
            text-align: left;

            &:hover {
                background-color: rgba(0, 0, 0, 0.03);
                color: var(--color-text-primary);

                .menu-icon {
                    color: var(--color-text-primary);
                }
            }

            &.is-active {
                background: var(--color-primary-light);
                color: var(--color-primary);
                font-weight: 600;

                .menu-icon {
                    color: var(--color-primary);
                }
            }

            &.collapsed {
                justify-content: center;
                padding: 0;

                .menu-icon {
                    margin-right: 0;
                }

                &:hover .menu-tooltip {
                    opacity: 1;
                    transform: translateX(0);
                    visibility: visible;
                }
            }

            .active-indicator {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 3px;
                height: 20px;
                background-color: var(--color-primary);
                border-radius: 0 4px 4px 0;
                opacity: 0;
                transition: all 0.3s ease;
            }

            &.is-active .active-indicator {
                opacity: 1;
            }

            .menu-icon {
                font-size: 20px;
                margin-right: 14px;
                flex-shrink: 0;
                transition: all 0.3s ease;
            }

            .menu-title {
                font-size: 14px;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .menu-tooltip {
                position: absolute;
                left: 100%;
                top: 50%;
                transform: translateY(-50%) translateX(10px);
                background: var(--color-text-primary);
                color: #fff;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                visibility: hidden;
                transition: all 0.2s ease;
                z-index: 100;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                pointer-events: none;
                margin-left: 10px;

                &::before {
                    content: '';
                    position: absolute;
                    left: -4px;
                    top: 50%;
                    transform: translateY(-50%);
                    border-width: 4px 4px 4px 0;
                    border-style: solid;
                    border-color: transparent var(--color-text-primary) transparent transparent;
                }
            }
        }
    }

    .user-container {
        padding: 20px;
        border-top: 1px solid var(--border-color);
        background: transparent;

        .user-dropdown {
            width: 100%;
            cursor: pointer;

            .user-info {
                display: flex;
                align-items: center;
                padding: 8px;
                border-radius: 12px;
                transition: background-color 0.2s;
                border: 1px solid var(--border-color);
                background: #fff;
                text-align: left;

                &:hover {
                    background-color: rgba(0, 0, 0, 0.02);
                    border-color: var(--color-primary);
                }

                &:focus-visible {
                    outline: 2px solid var(--color-primary);
                    outline-offset: 2px;
                }

                .avatar-wrapper {
                    position: relative;
                    width: 32px;
                    height: 32px;
                    flex-shrink: 0;

                    .custom-avatar {
                        background: var(--color-primary-light);
                        color: var(--color-primary);
                    }

                    .status-dot {
                        position: absolute;
                        bottom: 0;
                        right: 0;
                        width: 8px;
                        height: 8px;
                        background-color: var(--color-success);
                        border-radius: 50%;
                        border: 2px solid #fff;
                    }
                }

                .user-details {
                    margin-left: 12px;
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    overflow: hidden;

                    .username {
                        font-size: 14px;
                        color: var(--color-text-primary);
                        font-weight: 600;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .role {
                        font-size: 11px;
                        color: var(--color-text-tertiary);
                    }
                }

                .el-icon--right {
                    color: var(--color-text-tertiary);
                    margin-left: 8px;
                }
            }

            &.collapsed {
                .user-info {
                    justify-content: center;
                    padding: 8px 0;
                }
            }
        }
    }
}
</style>
