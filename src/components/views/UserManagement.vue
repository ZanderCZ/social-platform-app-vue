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

// 多条件搜索字段
const searchConditions = ref({
    userName: '',
    phone: '',
    email: '',
    gender: '',
    region: ''
});

// 自动提示选项
const userNameSuggestions = ref([]);
const phoneSuggestions = ref([]);
const emailSuggestions = ref([]);

// 地区选项
const regionOptions = ref([]);

// 完整的地区选项数据
const fullRegionOptions = [
  {
    value: 'asia',
    label: '亚洲',
    children: [
      {
        value: 'eastAsia',
        label: '东亚',
        children: [
          {
            value: 'china',
            label: '中国',
          },
          {
            value: 'japan',
            label: '日本',
          },
          {
            value: 'southKorea',
            label: '韩国',
          },
          {
            value: 'northKorea',
            label: '朝鲜',
          },
          {
            value: 'mengo',
            label: '蒙古',
          },
        ],
      },
      {
        value: 'southeastAsia',
        label: '东南亚',
        children: [
          {
            value: 'vietnam',
            label: '越南',
          },
          {
            value: 'mala',
            label: '马来西亚',
          },
          {
            value: 'singapore',
            label: '新加坡',
          },
          {
            value: 'tailand',
            label: '泰国',
          },
        ],
      },
      {
        value: 'southAsia',
        label: '南亚',
        children: [
          {
            value: 'india',
            label: '印度',
          },
          {
            value: 'pakistan',
            label: '巴基斯坦',
          },
        ],
      },
      {
        value: 'westAsia',
        label: '西亚',
        children: [
          {
            value: 'saudi',
            label: '沙特',
          },
          {
            value: 'iran',
            label: '伊朗',
          },
          {
            value: 'turkeia',
            label: '土耳其',
          },
        ],
      },
    ],
  },
  {
    value: 'america',
    label: '美洲',
    children: [
      {
        value: 'northAmarica',
        label: '北美',
        children: [
          {
            value: 'usa',
            label: '美国',
          },
          {
            value: 'canada',
            label: '加拿大',
          },
          {
            value: 'mexico',
            label: '墨西哥',
          },
        ],
      },
      {
        value: 'southAmerica',
        label: '南美',
        children: [
          {
            value: 'brazil',
            label: '巴西',
          },
          {
            value: 'argentina',
            label: '阿根廷',
          },
          {
            value: 'chile',
            label: '智利',
          },
          {
            value: 'colombia',
            label: '哥伦比亚',
          },
          {
            value: 'bolivia',
            label: '玻利维亚',
          },
        ],
      },
    ],
  },
  {
    value: 'euro',
    label: '欧洲',
    children: [
      {
        value: 'weatEuro',
        label: '西欧',
        children: [
          {
            value: 'england',
            label: '英国',
          },
          {
            value: 'france',
            label: '法国',
          },
          {
            value: 'germany',
            label: '德国',
          },
          {
            value: 'belgium',
            label: '比利时',
          },
          {
            value: 'switzerland',
            label: '瑞士',
          },
          {
            value: 'austria',
            label: '奥地利',
          },
        ],
      },
      {
        value: 'southEuro',
        label: '南欧',
        children: [
          {
            value: 'italy',
            label: '意大利',
          },
          {
            value: 'spain',
            label: '西班牙',
          },
          {
            value: 'portugal',
            label: '葡萄牙',
          },
          {
            value: 'greece',
            label: '希腊',
          },
          {
            value: 'croatia',
            label: '克罗地亚',
          },
        ],
      },
      {
        value: 'eastEuro',
        label: '东欧',
        children: [
          {
            value: 'russia',
            label: '俄罗斯',
          },
          {
            value: 'ukraine',
            label: '乌克兰',
          },
          {
            value: 'poland',
            label: '波兰',
          },
          {
            value: 'slovakia',
            label: '斯洛伐克',
          },
          {
            value: 'hungary',
            label: '匈牙利',
          },
        ],
      },
    ],
  },
];

// 级联选择器配置
const cascaderProps = {
  value: 'value',
  label: 'label',
  children: 'children',
  checkStrictly: false,
  emitPath: false,
  expandTrigger: 'hover'
};

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
    
    // 初始化自动提示选项
    updateSuggestions();
  } catch (error) {
    console.log('Failed', error);
    throw error;
  }
}

// 更新自动提示选项
const updateSuggestions = () => {
    // 用户名提示
    const uniqueUserNames = [...new Set(userList.value.map(user => user.userName))];
    userNameSuggestions.value = uniqueUserNames.map(name => ({ value: name }));
    
    // 手机号提示
    const uniquePhones = [...new Set(userList.value.map(user => user.phone))];
    phoneSuggestions.value = uniquePhones.map(phone => ({ value: phone }));
    
    // 邮箱提示
    const uniqueEmails = [...new Set(userList.value.map(user => user.email))];
    emailSuggestions.value = uniqueEmails.map(email => ({ value: email }));
    
    // 初始化地区选项
    regionOptions.value = fullRegionOptions;
}

// 过滤提示选项
const filterSuggestions = (queryString, suggestions) => {
    if (queryString === '') {
        return suggestions;
    }
    return suggestions.filter(item => 
        item.value.toLowerCase().includes(queryString.toLowerCase())
    );
}

// 用户名自动提示
const queryUserName = (queryString, cb) => {
    const results = filterSuggestions(queryString, userNameSuggestions.value);
    cb(results);
}

// 手机号自动提示
const queryPhone = (queryString, cb) => {
    const results = filterSuggestions(queryString, phoneSuggestions.value);
    cb(results);
}

// 邮箱自动提示
const queryEmail = (queryString, cb) => {
    const results = filterSuggestions(queryString, emailSuggestions.value);
    cb(results);
}

onMounted(async () => {
    getUserCount();
    getUserList();
})

const editInfoPressed = (userName) => {
    router.push({
        path: '/editUserInfo',
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

// 多条件搜索函数
const search = () => {
    // 检查是否有至少一个搜索条件
    const hasSearchCondition = Object.values(searchConditions.value).some(value => value.trim() !== '');
    
    if (!hasSearchCondition) {
        ElMessageBox.alert('请至少输入一个搜索条件', '提示', {
          confirmButtonText: 'OK',
          callback: (action) => {},
        })
        return;
    }

    filteredUserList.value = userList.value.filter(user => {
        // 用户名搜索
        if (searchConditions.value.userName && 
            !user.userName.toLowerCase().includes(searchConditions.value.userName.toLowerCase())) {
            return false;
        }
        
        // 手机号搜索
        if (searchConditions.value.phone && 
            !user.phone.includes(searchConditions.value.phone)) {
            return false;
        }
        
        // 邮箱搜索
        if (searchConditions.value.email && 
            !user.email.toLowerCase().includes(searchConditions.value.email.toLowerCase())) {
            return false;
        }
        
        // 性别搜索
        if (searchConditions.value.gender) {
            const genderText = user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '未知';
            if (!genderText.includes(searchConditions.value.gender)) {
                return false;
            }
        }
        
        // 地区搜索
        if (searchConditions.value.region && 
            user.region.toLowerCase() !== searchConditions.value.region.toLowerCase()) {
            return false;
        }
        
        return true;
    });
    
    // 重置分页到第一页
    currentPage.value = 1;
}

const resetSearch = () => {
  filteredUserList.value = [...userList.value];
  // 清空所有搜索条件
  searchConditions.value = {
      userName: '',
      phone: '',
      email: '',
      gender: '',
      region: ''
  };
  currentPage.value = 1;
}

const checkUserOrders = (userName) => {
    router.push({
        path: '/orders4SpecificUser',
        query: {
            userName: userName
        }
    })
}

const createUser = () => {
    router.push({
        path: '/createUser'
    })
}

// 将英文地区转换为中文显示
const getRegionDisplayName = (englishRegion) => {
  // 递归查找地区的中文名称
  const findRegionLabel = (regions, targetValue) => {
    for (const region of regions) {
      if (region.value === targetValue) {
        return region.label;
      }
      if (region.children) {
        const found = findRegionLabel(region.children, targetValue);
        if (found) return found;
      }
    }
    return englishRegion; // 如果找不到对应的中文名称，返回原值
  };
  
  return findRegionLabel(fullRegionOptions, englishRegion);
}

</script>

<template>
    <h1>用户管理</h1>
    <el-space wrap direction="vertical">
        <!-- 多条件搜索区域 -->
        <el-card class="search-card">
            <template #header>
                <div class="card-header">
                    <span>搜索条件</span>
                </div>
            </template>
            <el-form :model="searchConditions" label-width="80px" inline>
                <el-form-item label="用户名">
                    <el-autocomplete
                        v-model="searchConditions.userName"
                        :fetch-suggestions="queryUserName"
                        placeholder="请输入用户名"
                        clearable
                        style="width: 200px"
                        :trigger-on-focus="false"
                    />
                </el-form-item>
                <el-form-item label="手机号">
                    <el-autocomplete
                        v-model="searchConditions.phone"
                        :fetch-suggestions="queryPhone"
                        placeholder="请输入手机号"
                        clearable
                        style="width: 200px"
                        :trigger-on-focus="false"
                    />
                </el-form-item>
                <el-form-item label="邮箱">
                    <el-autocomplete
                        v-model="searchConditions.email"
                        :fetch-suggestions="queryEmail"
                        placeholder="请输入邮箱"
                        clearable
                        style="width: 200px"
                        :trigger-on-focus="false"
                    />
                </el-form-item>
                <el-form-item label="性别">
                    <el-select 
                        v-model="searchConditions.gender" 
                        placeholder="请选择性别"
                        clearable
                        style="width: 200px"
                    >
                        <el-option label="男" value="男" />
                        <el-option label="女" value="女" />
                        <el-option label="未知" value="未知" />
                    </el-select>
                </el-form-item>
                <el-form-item label="地区">
                    <el-cascader
                        v-model="searchConditions.region"
                        :options="regionOptions"
                        :props="cascaderProps"
                        placeholder="请选择地区"
                        clearable
                        style="width: 200px"
                    />
                </el-form-item>
                <el-form-item>
                    <el-button @click="search" type="primary">查询</el-button>
                    <el-button @click="resetSearch" type="success">重置</el-button>
                    <el-button @click="createUser" type="warning">新增</el-button>
                </el-form-item>
            </el-form>
        </el-card>
        
        <div v-if="numberOfUsers == 0">
            <h1>没有用户记录</h1>
        </div>
        <div v-else>
            <el-space wrap direction="vertical">
                <div v-for="(user, index) in paginatedUsers" :key="user.userId">
                    <el-descriptions border size="default" :column="3" class="user-descriptions" :label-width="100">
                        <el-descriptions-item
                        :rowspan="3"
                        :width="160"
                        label="头像"
                        align="center"
                        >
                            <el-image
                                style="width: 100px; height: 100px"
                                :src="`http://localhost:8080/uploads/userImage/${user.userName}.jpg?t=${Date.now()}`"
                            >
                                <template #error>
                                    <div class="image-slot">
                                        <p>未上传</p>
                                    </div>
                                </template>
                            </el-image>
                        </el-descriptions-item>
                        <el-descriptions-item label="用户名">{{ user.userName }}</el-descriptions-item>
                        <div v-if="user.gender == 'male'">
                            <el-descriptions-item label="性别">男</el-descriptions-item>
                        </div>
                        <div v-else-if="user.gender == 'female'">
                            <el-descriptions-item label="性别">女</el-descriptions-item>
                        </div>
                        <div v-else>
                            <el-descriptions-item label="性别">未知</el-descriptions-item>
                        </div>
                        <el-descriptions-item label="手机号">{{ user.phone }}</el-descriptions-item>
                        <el-descriptions-item label="地区">{{ getRegionDisplayName(user.region) }}</el-descriptions-item>
                        <el-descriptions-item label="邮箱">{{ user.email }}</el-descriptions-item>
                        <el-descriptions-item label="出生日期">{{ user.birthday }}</el-descriptions-item>
                        <el-descriptions-item label="修改信息">
                            <el-button @click="editInfoPressed(user.userName)" type="primary" plain>修改信息</el-button>
                        </el-descriptions-item>
                        <el-descriptions-item label="所有订单">
                            <el-button @click="checkUserOrders(user.userName)" type="primary" plain>查看订单</el-button>
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
  width: 1000px;
}

.search-card {
  width: 100%;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>