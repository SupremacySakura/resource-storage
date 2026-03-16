<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { postLogin } from '../services/apis/login'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const errorMessage = ref('')
const router = useRouter()
const isLoading = ref(false)

const handleLogin = async () => {
    if (!username.value || !password.value) {
        errorMessage.value = '用户名和密码不能为空'
        return
    }
    isLoading.value = true
    try {
        const res = await postLogin(username.value, password.value)
        if (+res.code === 200) {
            console.log(res.data)
            router.push('/')
            ElMessage.success('登录成功')
            userStore.setToken(res.data)
        } else {
            ElMessage.error(res.message)
        }
    } catch (err) {
        ElMessage.error(`登录失败: ${err}`)
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="login-container">
        <!-- Animated Background -->
        <div class="tech-bg">
            <div class="circle c1"></div>
            <div class="circle c2"></div>
            <div class="grid-overlay"></div>
        </div>

        <div class="login-content">
            <div class="brand-section">
                <div class="logo-circle">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                </div>
                <h1 class="brand-title">资源存储</h1>
                <p class="brand-desc">安全 · 高效 · 可靠</p>
            </div>

            <div class="login-card glass-card">
                <div class="login-header">
                    <h2>欢迎回来</h2>
                    <p>登录后管理你的资源</p>
                </div>

                <form class="login-form" @submit.prevent="handleLogin">
                    <div class="form-group">
                        <label for="username">用户名</label>
                        <div class="input-wrapper">
                            <input id="username" v-model="username" type="text" placeholder="请输入用户名" required
                                autocomplete="username" />
                            <div class="input-glow"></div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="password">密码</label>
                        <div class="input-wrapper">
                            <input id="password" v-model="password" type="password" placeholder="请输入密码"
                                required autocomplete="current-password" />
                            <div class="input-glow"></div>
                        </div>
                    </div>

                    <div class="form-options">
                        <label class="remember-me">
                            <input v-model="rememberMe" type="checkbox" />
                            <span>记住我</span>
                        </label>
                        <a href="#" class="forgot-password">忘记密码？</a>
                    </div>

                    <button type="submit" class="login-button" :disabled="isLoading">
                        <span v-if="isLoading" class="loading-spinner"></span>
                        <span v-else>登录</span>
                    </button>

                    <div v-if="errorMessage" class="error-message">
                        {{ errorMessage }}
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.login-container {
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
    background-color: var(--color-bg-base);
}

.tech-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    overflow: hidden;

    .grid-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image:
            linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px);
        background-size: 40px 40px;
        mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
    }

    .circle {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.3;
        animation: float 10s infinite ease-in-out;
    }

    .c1 {
        width: 400px;
        height: 400px;
        background: var(--color-primary);
        top: -100px;
        left: -100px;
        animation-delay: 0s;
    }

    .c2 {
        width: 500px;
        height: 500px;
        background: var(--color-secondary);
        bottom: -150px;
        right: -150px;
        animation-delay: -5s;
    }
}

@keyframes float {
    0%,
    100% {
        transform: translate(0, 0);
    }
    50% {
        transform: translate(30px, 50px);
    }
}

.login-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
    width: 100%;
    max-width: 440px;
    padding: 20px;
}

.brand-section {
    text-align: center;

    .logo-circle {
        width: 64px;
        height: 64px;
        background: #fff;
        border-radius: 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 auto 16px;
        border: 1px solid var(--border-color);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

        svg {
            width: 32px;
            height: 32px;
            color: var(--color-primary);
        }
    }

    .brand-title {
        font-size: 32px;
        font-weight: 700;
        color: var(--color-text-primary);
        margin: 0 0 8px;
        letter-spacing: -0.5px;
    }

    .brand-desc {
        font-size: 16px;
        color: var(--color-text-secondary);
        margin: 0;
    }
}

.login-card {
    width: 100%;
    padding: 40px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    border: 1px solid #fff;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
}

.login-header {
    text-align: center;
    margin-bottom: 32px;

    h2 {
        font-size: 24px;
        color: var(--color-text-primary);
        margin: 0 0 8px;
    }

    p {
        color: var(--color-text-secondary);
        font-size: 14px;
    }
}

.form-group {
    margin-bottom: 24px;

    label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: var(--color-text-secondary);
        font-weight: 500;
    }
}

.input-wrapper {
    position: relative;

    input {
        width: 100%;
        height: 48px;
        background: #fff;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 0 16px;
        color: var(--color-text-primary);
        font-size: 15px;
        transition: all 0.3s ease;
        box-sizing: border-box;

        &::placeholder {
            color: var(--color-text-tertiary);
        }

        &:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px var(--color-primary-glow);
        }
    }
}

.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
}

.remember-me {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    color: var(--color-text-secondary);

    input {
        margin-right: 8px;
        accent-color: var(--color-primary);
        width: 16px;
        height: 16px;
    }
}

.forgot-password {
    font-size: 14px;
    color: var(--color-primary);
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
        color: #06b6d4;
    }
}

.login-button {
    width: 100%;
    height: 48px;
    background: linear-gradient(135deg, var(--color-primary) 0%, #06b6d4 100%);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px var(--color-primary-glow);
    }

    &:active {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
}

.error-message {
    margin-top: 16px;
    padding: 12px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    color: var(--color-danger);
    font-size: 14px;
    text-align: center;
}

.loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@media (max-width: 480px) {
    .login-card {
        padding: 24px;
    }

    .brand-title {
        font-size: 28px;
    }
}
</style>
