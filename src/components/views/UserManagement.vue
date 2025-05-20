<script setup>
import axios from 'axios';
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
const router = useRouter()

const numberOfUsers = ref(0);
const userList = ref([]);

const getUserCount = async () => {
    // 获取用户数量
    try {
        const response = await axios.get('http://localhost:8080/api/user/count')
        console.log('Get user count success', response);
        numberOfUsers.value = response.data.data;
    } catch (error) {
        console.log('Failed', error);
        throw error;
    }
}

const getUserList = async () => {
    // 获取所有用户
    try {
        const response = await axios.get('http://localhost:8080/api/user/all')
        console.log('Get all users success', response);
        userList.value = response.data.data;
    } catch (error) {
        console.log('Failed', error);
        throw error;
    }
}

onMounted(async () => {
    getUserCount();
    getUserList();
})

const editInfoPressed = (userName) => {
    router.push({
        path: '/editInfo',
        query: {
        userName: userName
        }
    })
}

const deleteById = async (userId) => {
    try {
        const response = await axios.delete('http://localhost:8080/api/user/' + userId)
        console.log('Successfully delete user by userId', response);
        ElMessage({
            message: '删除成功',
            type: 'success',
        })
    } catch (error) {
        console.log('Failed to delete user by userId', error);
        throw error;
    }
}

const deleteButtonPressed = async (userName) => {
  ElMessageBox.confirm(
    '你确定要删除该用户吗?\n此操作不可恢复',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
  .then(async () => {  // 加上 async
    try {
      const response = await axios.get('http://localhost:8080/api/user/byUserName/' + userName);
      console.log('Successfully get user by userName', response);
      deleteById(response.data.data.userId);
      getUserList();
    } catch (error) {
      console.log('Failed to get user by userName', error);
      throw error;
    }
  })
  .catch(() => {});
}


</script>

<template>
    <h1>用户管理</h1>
    <el-space wrap direction="vertical">
        <div v-if="numberOfUsers == 0">
            <h1>没有用户记录</h1>
        </div>
        <div v-else>
            <el-space wrap direction="vertical">
                <div v-for="(user, index) in userList" :key="user.userId">
                    <el-descriptions border size="default" :column="3" class="user-descriptions">
                        <el-descriptions-item
                        :rowspan="2"
                        :width="90"
                        label="Photo"
                        align="center"
                        >
                        <el-image
                            style="width: 50px; height: 50px"
                            :src="`http://localhost:8080/uploads/${user.userName}.jpg`"
                        />
                        </el-descriptions-item>
                        <el-descriptions-item label="用户名">{{ user.userName }}</el-descriptions-item>
                        <el-descriptions-item label="性别">{{ user.gender }}</el-descriptions-item>
                        <el-descriptions-item label="手机号">{{ user.phone }}</el-descriptions-item>
                        <el-descriptions-item label="地区">{{ user.region }}</el-descriptions-item>
                        <el-descriptions-item label="邮箱">{{ user.email }}</el-descriptions-item>
                        <el-descriptions-item label="出生日期">{{ user.birthday }}</el-descriptions-item>
                        <el-descriptions-item label="修改信息">
                            <el-button @click="editInfoPressed(user.userName)" type="primary" plain>修改信息</el-button>
                        </el-descriptions-item>
                        <el-descriptions-item label="所有订单">
                            <el-button type="primary" plain>查看订单</el-button>
                        </el-descriptions-item>
                        <el-descriptions-item label="删除用户">
                            <el-button @click="deleteButtonPressed(user.userName)" type="danger" plain>删除用户</el-button>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
                <el-pagination layout="prev, pager, next" :total="numberOfUsers*10/5" />
            </el-space>
        </div>
    </el-space>
    <p>{{ userList }}</p>
</template>

<style>
.user-descriptions {
  width: 700px;
}
</style>