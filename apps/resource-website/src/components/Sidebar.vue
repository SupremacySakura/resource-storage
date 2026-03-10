<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
    User,
    Expand,
    Monitor,
    ArrowDown,
    Fold
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
                    <span class="logo-text">Resource<span class="highlight">OS</span></span>
                </div>
                
                <!-- Desktop Toggle -->
                <div v-if="!isMobile" class="toggle-btn" @click="toggleCollapse">
                    <el-icon>
                        <Expand v-if="isCollapse" />
                        <Fold v-else />
                    </el-icon>
                </div>

                <!-- Mobile Close -->
                <div v-if="isMobile" class="toggle-btn" @click="emit('close')">
                    <el-icon><Fold /></el-icon>
                </div>
            </div>

            <!-- Custom Menu -->
            <div class="menu-container">
                <div v-for="item in props.menuItems" :key="item.path" class="menu-group">
                    <!-- Menu Item -->
                    <div class="menu-item" :class="{
                        'is-active': isActive(item.path),
                        'collapsed': !isMobile && isCollapse
                    }" @click="handleMenuClick(item)">
                        
                        <div class="active-indicator"></div>

                        <el-icon class="menu-icon">
                            <component :is="item.icon" />
                        </el-icon>

                        <span v-if="isMobile || !isCollapse" class="menu-title">{{ item.title }}</span>
                        
                        <!-- Tooltip for collapsed mode -->
                        <div v-if="!isMobile && isCollapse" class="menu-tooltip">
                            {{ item.title }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- User Info -->
            <div class="user-container">
                <el-dropdown trigger="click" class="user-dropdown" :class="{ 'collapsed': !isMobile && isCollapse }">
                    <div class="user-info">
                        <div class="avatar-wrapper">
                            <el-avatar :size="32" :icon="User" class="custom-avatar" />
                            <div class="status-dot"></div>
                        </div>
                        <div v-show="isMobile || !isCollapse" class="user-details">
                            <span class="username">{{ username }}</span>
                            <span class="role">Administrator</span>
                        </div>
                        <el-icon v-show="isMobile || !isCollapse" class="el-icon--right">
                            <ArrowDown />
                        </el-icon>
                    </div>
                    <template #dropdown>
                        <el-dropdown-menu class="custom-dropdown">
                            <el-dropdown-item divided @click="handleLogout">Logout</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </el-aside>
    </div>
</template>

<style lang="scss" scoped>
.sidebar-wrapper {
    height: 100%;
    transition: all 0.3s ease;
    z-index: 50;

    &.mobile {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        z-index: 100;
        pointer-events: none; // Allow clicks through when closed

        .aside {
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            height: 100%;
            border-radius: 0 16px 16px 0;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-left: none;
        }

        .sidebar-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
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
    background: rgba(15, 23, 42, 0.85); // Darker glass
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    transition: width 0.3s cubic-bezier(0.2, 0, 0, 1);
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    overflow-x: visible; // Allow tooltips
    height: 100%;
    
    // Remove default element plus border
    border: none; 
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.2);

    // Custom Sidebar Header
    .sidebar-header {
        height: 70px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        color: var(--color-text-primary);
        flex-shrink: 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);

        .logo-area {
            display: flex;
            align-items: center;
            overflow: hidden;
            gap: 12px;

            .logo-icon-wrapper {
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1));
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .logo-icon {
                font-size: 20px;
                color: var(--color-primary);
            }

            .logo-text {
                font-size: 18px;
                font-weight: 700;
                white-space: nowrap;
                letter-spacing: -0.5px;
                
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

            &:hover {
                background-color: rgba(255, 255, 255, 0.05);
                color: var(--color-text-primary);
            }
        }
    }

    &.collapsed {
        .sidebar-header {
            justify-content: center;
            padding: 0;
            
            .toggle-btn {
                width: 40px;
                height: 40px;
            }
        }
    }

    .menu-container {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px 12px;

        .menu-group {
            margin-bottom: 4px;
        }

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

            &:hover {
                background-color: rgba(255, 255, 255, 0.03);
                color: var(--color-text-primary);
                
                .menu-icon {
                    color: var(--color-text-primary);
                    transform: scale(1.1);
                }
            }

            &.is-active {
                background: linear-gradient(90deg, rgba(6, 182, 212, 0.1) 0%, transparent 100%);
                color: var(--color-primary);
                font-weight: 600;

                .menu-icon {
                    color: var(--color-primary);
                    filter: drop-shadow(0 0 5px var(--color-primary-glow));
                }

                .active-indicator {
                    height: 20px;
                    opacity: 1;
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
                height: 0;
                background-color: var(--color-primary);
                border-radius: 0 4px 4px 0;
                box-shadow: 0 0 10px var(--color-primary);
                opacity: 0;
                transition: all 0.3s ease;
            }

            .menu-icon {
                font-size: 20px;
                margin-right: 14px;
                flex-shrink: 0;
                transition: all 0.3s ease;
            }

            .menu-title {
                font-size: 14px;
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .menu-tooltip {
                position: absolute;
                left: 100%;
                top: 50%;
                transform: translateY(-50%) translateX(10px);
                background: var(--color-bg-secondary);
                color: var(--color-text-primary);
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                visibility: hidden;
                transition: all 0.2s ease;
                z-index: 100;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
                    border-color: transparent var(--color-bg-secondary) transparent transparent;
                }
            }
        }
    }

    .user-container {
        padding: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(0, 0, 0, 0.1);

        .user-dropdown {
            width: 100%;
            cursor: pointer;

            .user-info {
                display: flex;
                align-items: center;
                padding: 8px;
                border-radius: 12px;
                transition: background-color 0.2s;
                border: 1px solid transparent;

                &:hover {
                    background-color: rgba(255, 255, 255, 0.03);
                    border-color: rgba(255, 255, 255, 0.05);
                }

                .avatar-wrapper {
                    position: relative;
                    
                    .custom-avatar {
                        background: var(--color-bg-secondary);
                        color: var(--color-text-secondary);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }

                    .status-dot {
                        position: absolute;
                        bottom: 0;
                        right: 0;
                        width: 8px;
                        height: 8px;
                        background-color: var(--color-success);
                        border-radius: 50%;
                        border: 2px solid var(--color-bg-base);
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
