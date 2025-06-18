<template>
    <el-menu
    :default-active="activeIndex"
    class="el-menu-demo"
    mode="horizontal"
    @select="handleSelect"
    >
    <el-menu-item class="mainPage" index="1">主页</el-menu-item>
    <el-sub-menu index="2">
      <template #title>商品列表</template>
      <el-menu-item index="2-1">item one</el-menu-item>
      <el-menu-item index="2-2">item two</el-menu-item>
      <el-menu-item index="2-3">item three</el-menu-item>
      <el-sub-menu index="2-4">
        <template #title>item four</template>
        <el-menu-item index="2-4-1">item one</el-menu-item>
        <el-menu-item index="2-4-2">item two</el-menu-item>
        <el-menu-item index="2-4-3">item three</el-menu-item>
      </el-sub-menu>
    </el-sub-menu>
    <div v-if="userName == 'admin'">
      <el-sub-menu index="3">
        <template #title>管理员</template>
          <el-menu-item index="3-1">用户管理</el-menu-item>
          <el-menu-item index="3-2">订单管理</el-menu-item>
          <el-menu-item index="3-3">商品管理</el-menu-item>
          <el-menu-item index="3-4">物流管理</el-menu-item>
          <el-menu-item index="3-5">商品分类管理</el-menu-item>
      </el-sub-menu>
    </div>
    <el-menu-item index="4">个人信息</el-menu-item>
  </el-menu>

  <div v-if="status == 4">
    <PersonalInfo :passedUserName="userName"></PersonalInfo>
  </div>
  <div v-else-if="status == '3-1'">
    <UserManagement></UserManagement>
  </div>
  <div v-else-if="status == '3-2'">
    <OrderManagement></OrderManagement>
  </div>
  <div v-else-if="status == '3-3'">
    <ProductManagement></ProductManagement>
  </div>
  <div v-else-if="status == '3-4'">
    <DeliveryManagement></DeliveryManagement>
  </div>
  <div>
    <CategoryManagement></CategoryManagement>
  </div>

</template>

<script setup>
import { ref, watch } from 'vue'
import PersonalInfo from './views/PersonalInfo.vue'
import UserManagement from './views/UserManagement.vue'
import OrderManagement from '@/components/views/OrderManagement.vue'
import ProductManagement from './views/ProductManagement.vue'
import DeliveryManagement from './views/DeliveryManagement.vue'
import CategoryManagement from './views/CategoryManagement.vue'
import { useRoute, onBeforeRouteUpdate } from 'vue-router'
const route = useRoute()

// const props = defineProps({
//     userName: String,
// });

const userName = ref(route.query.userName || '')

const status = ref(route.query.status || '')
const activeIndex = ref('1');

// ✅ 使用 watch 监听 route.query 的变化（包括返回）
watch(() => route.query.status, (newStatus) => {
  if (newStatus) {
    status.value = newStatus
    console.log('Status updated (via watch):', newStatus)
  }
})

watch(() => route.query.userName, (newUserName) => {
  if (newUserName) {
    userName.value = newUserName
    console.log('UserName updated (via watch):', newUserName)
  }
})



const handleSelect = (key, keyPath) => {
  console.log(key, keyPath);
  status.value = keyPath.slice(-1); // 获取数组最后一个元素
  console.log('status: ' + status.value);
}

</script>

<style>
.mainPage {
  width: 120px;
}
</style>