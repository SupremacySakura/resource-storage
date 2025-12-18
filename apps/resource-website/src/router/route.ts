import type { RouteRecordRaw } from "vue-router"
const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: '/home',
    },
    {
        path: '/home',
        component: () => import('../pages/HomePage.vue'),
        redirect: '/home/welcome',
        children: [
            {
                path: 'welcome',
                name: 'Welcome',
                component: () => import('../pages/Welcome.vue'),
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