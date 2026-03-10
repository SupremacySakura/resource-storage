<script lang="ts" setup>
import { Close } from '@element-plus/icons-vue'

defineProps<{
    modelValue: boolean
    title?: string
    width?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const close = () => {
    emit('update:modelValue', false)
}
</script>

<template>
    <transition name="dialog-fade">
        <div v-if="modelValue" class="custom-dialog-overlay" @click.self="close">
            <div class="custom-dialog glass-card" :style="{ width: width || '500px' }">
                <div class="dialog-header">
                    <span class="dialog-title">{{ title }}</span>
                    <button class="close-btn" @click="close">
                        <el-icon>
                            <Close />
                        </el-icon>
                    </button>
                </div>

                <div class="dialog-body">
                    <slot></slot>
                </div>

                <div v-if="$slots.footer" class="dialog-footer">
                    <slot name="footer"></slot>
                </div>
            </div>
        </div>
    </transition>
</template>

<style scoped lang="scss">
.custom-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 9999;
    /* Ensure high z-index to overlay everything */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.custom-dialog {
    background: var(--color-bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    overflow: hidden;
    position: relative;
    animation: dialog-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    max-width: 100%;
    /* Ensure it doesn't overflow screen width */
}

.dialog-header {
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-color);
}

.dialog-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
}

.close-btn {
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--color-text-primary);
    }
}

.dialog-body {
    padding: 24px;
    overflow-y: auto;
    color: var(--color-text-primary);
    min-height: 0;
}

.dialog-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* Animations */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
    transition: opacity 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
    opacity: 0;
}

@keyframes dialog-slide-in {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@media (max-width: 600px) {
    .custom-dialog-overlay {
        padding: 0;
        align-items: flex-end;
        /* Sheet style on mobile */
    }

    .custom-dialog {
        width: 100%;
        margin: 0;
        /* Remove any margins */
        border-radius: 16px 16px 0 0;
        height: 85vh;
        /* Fixed height on mobile */
        max-height: 85vh;
        animation: dialog-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        border-bottom: none;
        border-left: none;
        /* Remove side borders on mobile */
        border-right: none;
    }

    .dialog-header {
        padding: 16px 20px;
    }

    .dialog-body {
        padding: 8px 4px;
        flex: 1;
        /* Take up remaining space */
        overflow-y: auto;
        /* Enable scrolling */
        height: auto;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        min-height: 0;
    }

    .dialog-footer {
        padding: 12px 20px;
        background: var(--color-bg-secondary);
        /* Ensure background covers content */
        z-index: 10;
    }

    @keyframes dialog-slide-up {
        from {
            transform: translateY(100%);
        }

        to {
            transform: translateY(0);
        }
    }
}
</style>
