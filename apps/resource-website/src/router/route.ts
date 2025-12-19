import type { RouteRecordRaw, NavigationGuardNext, RouteLocationNormalized } from "vue-router"
import { useUserStore } from "../stores/user"
import { checkLogin } from "../services/apis/login"

const authGuard = async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
    const userStore = useUserStore()
    if (!userStore.token) {
        next('/login')
        return
    }
    try {
        const res = await checkLogin(userStore.token)
        if (res.success) {
            next()
        } else {
            next('/login')
        }
    } catch (error) {
        next('/login')
    }
}

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: '/home',
    },
    {
        path: '/home',
        component: () => import('../pages/HomePage.vue'),
        beforeEnter: authGuard,
        redirect: '/home/dashboard',
        children: [
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('../pages/Dashboard.vue'),
            },
            {
                path: 'files/upload',
                name: 'Upload',
                component: () => import('../pages/FileUpload.vue')
            },
            {
                path: 'files/list',
                name: 'List',
                component: () => import('../pages/FileList.vue')
            }
        ]
    },
    {
        path: '/login',
        component: () => import('../pages/Login.vue'),
    }
]
export {
    routes,
}