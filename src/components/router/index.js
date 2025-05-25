import { createRouter, createWebHistory } from 'vue-router'
import Hello from '@/components/Hello.vue'
import Index from '@/components/Index.vue'
import EditInfo from '@/components/views/EditInfo.vue'
import EditOrderInfo from '@/components/views/EditOrderInfo.vue'
import Orders4SpecificUserVue from '../views/Orders4SpecificUser.vue'

const routes = [
  {
    path: '/',
    name: 'Hello',
    component: Hello
  },
  {
    path: '/index',
    name: 'Index',
    component: Index,
    props: true // 允许通过 props 传参
  },
  {
    path: '/editUserInfo',
    name: 'EditUserInfo',
    component: EditInfo,
    props: true
  },
  {
    path: '/editOrderInfo',
    name: 'EditOrderInfo',
    component: EditOrderInfo,
    props: true
  },
  {
    path: '/orders4SpecificUser',
    name: 'Orders4SpecificUser',
    component: Orders4SpecificUserVue,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
