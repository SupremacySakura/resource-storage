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

const handleLogin = async () => {
    // 简单表单验证
    if (!username.value || !password.value) {
        errorMessage.value = '用户名和密码不能为空'
        return
    }
    // 登录
    try {
        const res = await postLogin(username.value, password.value)
        if (+res.code === 200) {
            console.log(res.data)
            router.push('/')
            ElMessage.success('登录成功')
            // 设置token
            userStore.setToken(res.data)
        } else {
            ElMessage.error(res.message)
        }
    } catch (err) {
        ElMessage.error(`登录失败: ${err}`)
    }
}
</script>

<template>
    <div class="login-container">
        <div class="login-left">
            <div class="brand-content">
                <h1 class="brand-title">Resource Storage</h1>
                <p class="brand-desc">安全、高效的个人资源存储与管理平台</p>
            </div>
            <div class="overlay"></div>
        </div>

        <div class="login-right">
            <div class="login-form-wrapper">
                <div class="login-header">
                    <h2>欢迎登录</h2>
                    <p>请输入您的账户信息以继续</p>
                </div>

                <form class="login-form" @submit.prevent="handleLogin">
                    <div class="form-group">
                        <label for="username">用户名</label>
                        <div class="input-wrapper">
                            <input id="username" v-model="username" type="text" placeholder="请输入用户名" required
                                autocomplete="username" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="password">密码</label>
                        <div class="input-wrapper">
                            <input id="password" v-model="password" type="password" placeholder="请输入密码" required
                                autocomplete="current-password" />
                        </div>
                    </div>

                    <div class="form-options">
                        <label class="remember-me">
                            <input v-model="rememberMe" type="checkbox" />
                            <span>记住我</span>
                        </label>
                        <a href="#" class="forgot-password">忘记密码?</a>
                    </div>

                    <button type="submit" class="login-button">
                        登录
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
    display: flex;
    height: 100vh;
    width: 100vw;
    background-color: #fff;
    overflow: hidden;
}

.login-left {
    flex: 1;
    background-image: url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop');
    background-size: cover;
    background-position: center;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 40px;
}

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(0, 102, 255, 0.8) 0%, rgba(0, 82, 204, 0.9) 100%);
    z-index: 1;
}

.brand-content {
    position: relative;
    z-index: 2;
    text-align: center;
    color: white;
}

.brand-title {
    font-size: 48px;
    font-weight: 700;
    margin-bottom: 16px;
    letter-spacing: 1px;
}

.brand-desc {
    font-size: 18px;
    opacity: 0.9;
    font-weight: 300;
    max-width: 400px;
    line-height: 1.6;
}

.login-right {
    width: 500px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    background-color: #fff;
    height: 100%;
    box-sizing: border-box;
}

.login-form-wrapper {
    width: 100%;
    max-width: 360px;
}

.login-header {
    margin-bottom: 40px;
}

.login-header h2 {
    font-size: 28px;
    color: #1a1a1a;
    margin-bottom: 8px;
    font-weight: 600;
}

.login-header p {
    color: #86909c;
    font-size: 14px;
}

.form-group {
    margin-bottom: 24px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #1d2129;
    text-align: left;
}

.input-wrapper input {
    width: 100%;
    height: 48px;
    padding: 0 16px;
    border: 1px solid #e5e6eb;
    border-radius: 8px;
    font-size: 14px;
    color: #1d2129;
    background-color: #f7f8fa;
    transition: all 0.2s;
    box-sizing: border-box;
}

.input-wrapper input:focus {
    outline: none;
    background-color: #fff;
    border-color: #0066ff;
    box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.2);
}

.input-wrapper input::placeholder {
    color: #c9cdcf;
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
    user-select: none;
}

.remember-me input {
    margin-right: 8px;
    accent-color: #0066ff;
    width: 16px;
    height: 16px;
}

.remember-me span {
    font-size: 14px;
    color: #4e5969;
}

.forgot-password {
    font-size: 14px;
    color: #0066ff;
    text-decoration: none;
    font-weight: 500;
}

.forgot-password:hover {
    text-decoration: underline;
}

.login-button {
    width: 100%;
    height: 48px;
    background: linear-gradient(90deg, #0066ff 0%, #0052cc 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.2s;
    box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
}

.login-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 102, 255, 0.4);
}

.login-button:active {
    transform: translateY(1px);
}

.error-message {
    margin-top: 16px;
    padding: 10px;
    background-color: #ffece8;
    color: #f53f3f;
    border-radius: 4px;
    font-size: 13px;
    text-align: center;
}

.register-link {
    margin-top: 32px;
    text-align: center;
    font-size: 14px;
    color: #86909c;
}

.register-link a {
    color: #0066ff;
    text-decoration: none;
    font-weight: 500;
    margin-left: 4px;
}

.register-link a:hover {
    text-decoration: underline;
}

@media (max-width: 900px) {
    .login-container {
        background-image: url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop');
        background-size: cover;
        background-position: center;
        position: relative;
    }

    .login-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(0, 102, 255, 0.4) 0%, rgba(0, 82, 204, 0.5) 100%);
        z-index: 0;
        backdrop-filter: blur(4px);
    }

    .login-left {
        display: none;
    }

    .login-right {
        width: 100%;
        padding: 20px;
        background-color: transparent;
        position: relative;
        z-index: 1;
    }

    .login-form-wrapper {
        max-width: 420px;
        padding: 40px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
}

@media (max-width: 480px) {
    .login-form-wrapper {
        padding: 24px;
        max-width: 100%;
    }

    .login-header h2 {
        font-size: 24px;
    }

    .input-wrapper input {
        height: 44px;
    }

    .login-button {
        height: 44px;
    }
}
</style>
