<script setup>
import axios from 'axios';
import { onMounted, ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
const router = useRouter()

const numberOfUsers = ref(0);
const userList = ref([]);         // 原始用户列表
const filteredUserList = ref([]); // 当前用于渲染的用户列表
const currentPage = ref(1);

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
  try {
    const response = await axios.get('http://localhost:8080/api/user/all')
    userList.value = response.data.data;
    filteredUserList.value = [...userList.value]; // 拷贝初始数据用于渲染
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
  .then(async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/user/byUserName/' + userName);
    console.log('Successfully get user by userName', response);
    
    // 等待删除完成再刷新列表
    await deleteById(response.data.data.userId);  
    await getUserList();  // 这里也加上 await

    // 更新用户数量
    await getUserCount();

    } catch (error) {
        console.log('Failed to get user by userName or delete user', error);
    }
  })
  .catch(() => {});
}

const pageSize = 3;
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredUserList.value.slice(start, end);
});

var searchKey = ref('')

const querySearch = (queryString, cb) => {
    var results = queryString
        ? userList.value.filter(createFilter(queryString)).map(user => ({
            value: user.phone
        }))
        : userList.value.map(user => ({
            value: user.userName
        }));
    switch (searchKind.value) {
        case 'userName':
            results = queryString
                ? userList.value.filter(createFilter(queryString)).map(user => ({
                    value: user.userName
                }))
                : userList.value.map(user => ({
                    value: user.userName
                }))
            cb(results)
            break
        case 'phone':
            results = queryString
                ? userList.value.filter(createFilter(queryString)).map(user => ({
                    value: user.phone
                }))
                : userList.value.map(user => ({
                    value: user.phone
                }))
            cb(results)
            break
        case 'region':
            results = queryString
                ? userList.value.filter(createFilter(queryString)).map(user => ({
                    value: user.region
                }))
                : userList.value.map(user => ({
                    value: user.region
                }))
            cb(results)
            break
        case 'email':
            results = queryString
                ? userList.value.filter(createFilter(queryString)).map(user => ({
                    value: user.email
                }))
                : userList.value.map(user => ({
                    value: user.email
                }))
            cb(results)
            break
        case 'gender':
            results = queryString
                ? userList.value.filter(createFilter(queryString)).map(user => ({
                    value: user.gender
                }))
                : userList.value.map(user => ({
                    value: user.gender
                }))
            cb(results)
            break
    }
}
const createFilter = (queryString) => {
  return (user) => {
    switch (searchKind.value) {
        case 'userName':
            return (
                user.userName.toLowerCase().indexOf(queryString.toLowerCase()) === 0
            )
        case 'phone':
            return (
                user.phone.toLowerCase().indexOf(queryString.toLowerCase()) === 0
            )
        case 'region':
            return (
                user.region.toLowerCase().indexOf(queryString.toLowerCase()) === 0
            )
        case 'email':
            return (
                user.email.toLowerCase().indexOf(queryString.toLowerCase()) === 0
            )
        case 'gender':
            return (
                user.gender.toLowerCase().indexOf(queryString.toLowerCase()) === 0
            )
    }

  }
}
const handleSelect = (item) => {
  console.log(item)
}

const searchUserByUserName = () => {
  filteredUserList.value = userList.value.filter(
    user => user.userName === searchKey.value
  );
}
const searchUserByPhone = () => {
    filteredUserList.value = userList.value.filter(
        user => user.phone === searchKey.value
    );
}
const searchUserByEmail = () => {
    filteredUserList.value = userList.value.filter(
        user => user.email === searchKey.value
    );
}
const searchUserByGender = () => {
    filteredUserList.value = userList.value.filter(
        user => user.gender === searchKey.value
    );
}
const searchUserByRegion = () => {
    filteredUserList.value = userList.value.filter(
        user => user.region === searchKey.value
    );
}
const search = () => {
    switch (searchKind.value) {
        case 'userName':
            searchUserByUserName(searchKey.value);
            break
        case 'phone':
            searchUserByPhone(searchKey.value);
            break
        case 'region':
            searchUserByRegion(searchKey.value);
            break
        case 'email':
            searchUserByEmail(searchKey.value);
            break
        case 'gender':
            searchUserByGender(searchKey.value);
            break
    }
}

const resetSearch = () => {
  filteredUserList.value = [...userList.value];
  searchKey.value = '';
}

const searchOptions = [
  {
    value: 'userName',
    label: '用户名',
  },
  {
    value: 'phone',
    label: '手机号',
  },
  {
    value: 'email',
    label: '邮箱',
  },
  {
    value: 'gender',
    label: '性别',
  },
  {
    value: 'region',
    label: '地区',
  },
]
const searchKind = ref('')

const autocompletePlaceHolder = ref('请选择筛选条件')

const updateAutoCompletePlaceHolder = () => {
    switch (searchKind.value) {
        case 'userName':
            autocompletePlaceHolder.value = '请输入用户名';
            break
        case 'phone':
            autocompletePlaceHolder.value = '请输入手机号';
            break
        case 'region':
            autocompletePlaceHolder.value = '请输入地区';
            break
        case 'email':
            autocompletePlaceHolder.value = '请输入邮箱';
            break
        case 'gender':
            autocompletePlaceHolder.value = '请输入性别';
            break
    }
}

</script>

<template>
    <h1>用户管理</h1>
    <el-space wrap direction="vertical">
        <el-space warp direction="horizontal">
            <el-select
                v-model="searchKind"
                placeholder="筛选条件"
                size="default"
                style="width: 100px"
                @change="updateAutoCompletePlaceHolder"
                >
                <el-option
                    v-for="item in searchOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                />
            </el-select>
            <el-autocomplete
                v-model="searchKey"
                :fetch-suggestions="querySearch"
                :trigger-on-focus="false"
                class="inline-input w-50"
                :placeholder="autocompletePlaceHolder"
                @select="handleSelect"
            />
            <el-button @click="search" type="primary">查询</el-button>
            <el-button @click="resetSearch" type="success">重置</el-button>
        </el-space>
        <div v-if="numberOfUsers == 0">
            <h1>没有用户记录</h1>
        </div>
        <div v-else>
            <el-space wrap direction="vertical">
                <div v-for="(user, index) in paginatedUsers" :key="user.userId">
                    <el-descriptions border size="default" :column="3" class="user-descriptions" :label-width="1000">
                        <el-descriptions-item
                        :rowspan="3"
                        :width="90"
                        label="Photo"
                        align="center"
                        >
                            <el-image
                                style="width: 50px; height: 50px"
                                :src="`http://localhost:8080/uploads/${user.userName}.jpg?t=${Date.now()}`"
                            >
                                <template #error>
                                    <div class="image-slot">
                                        <p>未上传</p>
                                    </div>
                                </template>
                            </el-image>
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
                <!-- <el-pagination v-model="currentPage" layout="prev, pager, next" :total="numberOfUsers*10/5" /> -->
                <el-pagination
                    v-model:current-page="currentPage"
                    :page-size="3"
                    layout="prev, pager, next"
                    :total="filteredUserList.length"
                    background
                />
            </el-space>
        </div>
    </el-space>
    <!-- <p>{{ userList }}</p> -->
</template>

<style>
.user-descriptions {
  width: 700px;
}
</style>