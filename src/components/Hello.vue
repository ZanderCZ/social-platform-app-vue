<template>
  <div class="auth-container">
    <div class="auth-wrapper" :class="status">
      <!-- 登录界面 -->
      <transition name="el-fade-in">
        <el-card v-if="status == 'login'" class="auth-card login-card">
          <div class="logo-container">
            <img alt="Vue logo" class="logo" src="../assets/logo.svg" />
          </div>
          <h2 class="auth-title">用户登录</h2>
          <el-space direction="vertical" alignment="center" :size="20" style="width: 100%">
            <el-input
              v-model="userName"
              style="width: 280px"
              placeholder="请输入用户名"
              clearable
              size="large"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
            <el-input
              v-model="password"
              style="width: 280px"
              type="password"
              placeholder="请输入密码"
              show-password
              size="large"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
            <el-space wrap :size="20">
              <el-button
                type="primary"
                :loading="loading"
                @click="login"
                size="large"
                style="width: 120px"
                >登录</el-button
              >
              <el-button
                type="success"
                @click="toRegist"
                size="large"
                style="width: 120px"
                >注册</el-button
              >
            </el-space>
          </el-space>
        </el-card>
      </transition>

      <!-- 注册界面 -->
      <transition name="el-fade-in">
        <el-card v-if="status == 'regist'" class="auth-card regist-card">
          <h2 class="auth-title">用户注册</h2>
          <el-form
            ref="registFormRef"
            :model="registForm"
            :rules="rules"
            label-width="100px"
            label-position="left"
            status-icon
          >
            <el-form-item label="用户名" prop="userName">
              <el-input
                v-model="registForm.userName"
                placeholder="请输入用户名"
                size="large"
              />
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="registForm.password"
                type="password"
                placeholder="请输入密码"
                show-password
                size="large"
              />
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="registForm.email"
                placeholder="请输入邮箱"
                size="large"
              />
            </el-form-item>

            <el-form-item label="出生日期" prop="birthdate">
              <el-date-picker
                v-model="registForm.birthdate"
                type="date"
                placeholder="选择日期"
                format="YYYY/MM/DD"
                value-format="YYYY-MM-DD"
                size="large"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item label="性别" prop="gender">
              <el-select
                v-model="registForm.gender"
                placeholder="性别"
                size="large"
                style="width: 100%"
              >
                <el-option
                  v-for="item in genderOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="手机号" prop="phone">
              <el-input
                v-model="registForm.phone"
                placeholder="请输入手机号"
                maxlength="11"
                show-word-limit
                clearable
                size="large"
              />
            </el-form-item>

            <el-form-item label="地区" prop="region">
              <el-cascader
                v-model="registForm.region"
                :options="regionOptions"
                :show-all-levels="false"
                placeholder="选择地区"
                size="large"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item>
              <el-space :size="20">
                <el-button @click="back2Login" size="large">返回</el-button>
                <el-button
                  type="primary"
                  :loading="loading"
                  @click="onSubmit"
                  size="large"
                  >注册</el-button
                >
              </el-space>
            </el-form-item>
          </el-form>
        </el-card>
      </transition>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios';
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock } from '@element-plus/icons-vue';
const router = useRouter();

import { useUserStore } from '@/stores/user';
const userStore = useUserStore();

const registFormRef = ref(null);
const registForm = reactive({
  userName: '',
  password: '',
  email: '',
  birthdate: '',
  gender: '',
  phone: '',
  region: [],
});
const rules = {
  userName: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  birthdate: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  region: [{ type: 'array', required: true, message: '请选择地区', trigger: 'change' }],
};

const onSubmit = () => {
  registFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await axios.post('http://localhost:8080/api/user', {
          userName: registForm.userName,
          password: registForm.password,
          email: registForm.email,
          birthday: registForm.birthdate,
          gender: registForm.gender,
          phone: registForm.phone,
          region: registForm.region[2],
        });
        if (response.data.code === 200) {
          ElMessage.success('注册成功！');
          status.value = 'login';
          registForm.userName = '';
          registForm.password = '';
          registForm.email = '';
          registForm.birthdate = '';
          registForm.gender = '';
          registForm.phone = '';
          registForm.region = '';
        } else if (response.data.code === 506) {
          ElMessageBox.alert('用户已存在', '提示');
        } else if (response.data.code === 508) {
          ElMessageBox.alert('信息不能为空', '提示');
        }
      } catch (err) {
        console.error(err);
        ElMessage.error('注册失败，请稍后再试');
      }
    }
  });
};

const userName = ref('');
const password = ref('');
const loading = ref(false); // 响应式 loading 状态
const returnedUserName = ref('');
const status = ref('login');

const inputUserName = ref('');
const inputPassword = ref('');
const inputEmail = ref('');
const inputBirthdate = ref('');
const inputGender = ref('');
const genderOptions = [
  {
    value: 'male',
    label: '男',
  },
  {
    value: 'female',
    label: '女',
  },
  {
    value: 'others',
    label: '其他',
  },
  {
    value: 'notWilling2Say',
    label: '不愿透露',
  },
];
const inputPhoneNumber = ref('');
const inputRegion = ref('');
const regionOptions = [
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

const emit = defineEmits(['emit-user-name']);

const regist = async () => {
  try {
    const response = await axios.post('http://localhost:8080/api/user', {
      userName: inputUserName.value,
      password: inputPassword.value,
      email: inputEmail.value,
      birthday: inputBirthdate.value,
      gender: inputGender.value,
      phone: inputPhoneNumber.value,
      region: inputRegion.value[2],
    });
    console.log('Success', response);
    if (response.data.code == 200) {
      status.value = 'login';
      inputUserName.value = '';
      inputPassword.value = '';
      inputEmail.value = '';
      inputBirthdate.value = '';
      inputGender.value = '';
      inputPhoneNumber.value = '';
      inputRegion.value = '';
    } else if (response.data.code == 506) {
      ElMessageBox.alert('用户已存在', '提示', {
        // if you want to disable its autofocus
        // autofocus: false,
        confirmButtonText: 'OK',
        callback: (action) => {},
      });
    } else if (response.data.code == 508) {
      ElMessageBox.alert('信息不能为空', '提示', {
        // if you want to disable its autofocus
        // autofocus: false,
        confirmButtonText: 'OK',
        callback: (action) => {},
      });
    }
  } catch (error) {
    console.log('Failed', error);
  }
};

const toRegist = () => {
  status.value = 'regist';
};

const back2Login = () => {
  status.value = 'login';
};

const login = async () => {
  loading.value = true;
  try {
    const response = await axios.post('http://localhost:8080/api/auth/login', {
      username: userName.value,
      password: password.value,
    });
    console.log('Success', response);
    if (response.data.code == 200) {
      console.log('Login success');
      returnedUserName.value = response.data.data.userInfo.userName;
      emit('emit-user-name', returnedUserName.value);
      router.push({
        path: '/index',
        query: {
          userName: userName.value,
          status: '1'
        },
      });
      userStore.login();
    } else if (response.data.code == 502) {
      ElMessageBox.alert('用户名或密码错误', '提示', {
        // if you want to disable its autofocus
        // autofocus: false,
        confirmButtonText: 'OK',
        callback: (action) => {},
      });
    } else {
      ElMessageBox.alert('登陆失败', '提示', {
        // if you want to disable its autofocus
        // autofocus: false,
        confirmButtonText: 'OK',
        // callback: (action) => {
        //   ElMessage({
        //     type: 'info',
        //     message: `action: ${action}`,
        //   })
        // },
      });
    }
  } catch (error) {
    console.log('Failed', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.auth-wrapper {
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: center;
  transition: all 0.3s ease;
}

.auth-card {
  width: 100%;
  max-width: 500px;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  background-color: rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease;
}

.login-card {
  text-align: center;
}

.regist-card {
  text-align: left;
}

.logo-container {
  margin-bottom: 20px;
}

.logo {
  width: 125px;
  height: 125px;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.auth-title {
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
  font-weight: 500;
}

.el-form-item {
  margin-bottom: 22px;
}

.el-button {
  transition: all 0.3s ease;
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .auth-card {
    padding: 30px 20px;
  }
  
  .auth-title {
    font-size: 20px;
    margin-bottom: 20px;
  }
}
</style>