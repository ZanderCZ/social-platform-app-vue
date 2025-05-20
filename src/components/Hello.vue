<template>
  <div v-if="status == 'login'">
    <el-space wrap direction="vertical">
      <div>
        <img alt="Vue logo" class="logo" src="../assets/logo.svg" width="125" height="125" />
      </div>
      <div>
        <el-input v-model="userName" style="width: 240px" placeholder="请输入用户名" clearable />
      </div>
      <div>
        <el-input
          v-model="password"
          style="width: 240px"
          type="password"
          placeholder="请输入密码"
          show-password
        />
      </div>
    <el-space wrap>
      <el-button type="primary" :loading="loading" @click="login">登陆</el-button>
      <el-button type="primary"  @click="toRegist">注册</el-button>
    </el-space>
    </el-space>
  </div>
  <div v-else-if="status == 'regist'">
    <el-space wrap direction="vertical">
    <h1>注册</h1>
    <el-form
      ref="registFormRef"
      :model="registForm"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="用户名" prop="userName">
        <el-input v-model="registForm.userName" placeholder="请输入用户名" />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="registForm.password"
          type="password"
          placeholder="请输入密码"
          show-password
        />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input v-model="registForm.email" placeholder="请输入邮箱" />
      </el-form-item>

      <el-form-item label="出生日期" prop="birthdate">
        <el-date-picker
          v-model="registForm.birthdate"
          type="date"
          placeholder="选择日期"
          format="YYYY/MM/DD"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="性别" prop="gender">
        <el-select v-model="registForm.gender" placeholder="性别">
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
        />
      </el-form-item>

      <el-form-item label="地区" prop="region">
        <el-cascader
          v-model="registForm.region"
          :options="regionOptions"
          :show-all-levels="false"
          placeholder="选择地区"
        />
      </el-form-item>

      <el-form-item>
        <el-space>
          <el-button @click="back2Login">返回</el-button>
          <el-button type="primary" :loading="loading" @click="onSubmit">注册</el-button>
        </el-space>
      </el-form-item>
    </el-form>
  </el-space>
  </div>
</template>
  
<script setup>
  import axios from 'axios';
  import { ref } from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { reactive } from 'vue';
  import { useRouter } from 'vue-router'
  const router = useRouter()

  import { useUserStore } from '@/stores/user'
  const userStore = useUserStore()

  const registFormRef = ref(null);
  const registForm = reactive({
    userName: '',
    password: '',
    email: '',
    birthdate: '',
    gender: '',
    phone: '',
    region: []
  });
  const rules = {
    userName: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
    birthdate: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
    gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
    phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
    region: [{ type: 'array', required: true, message: '请选择地区', trigger: 'change' }]
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
            registForm.userName = ''
            registForm.password = ''
            registForm.email = ''
            registForm.birthdate = ''
            registForm.gender = ''
            registForm.phone = ''
            registForm.region = ''
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
  ]
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
  ]

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
      console.log("Success", response);
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
        })
      } else if (response.data.code == 508) {
        ElMessageBox.alert('信息不能为空', '提示', {
        // if you want to disable its autofocus
        // autofocus: false,
        confirmButtonText: 'OK',
        callback: (action) => {},
        })
      }
    } catch(error) {
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
        password: password.value
      });
      console.log("Success", response);
      if (response.data.code == 200) {
        console.log("Login success");
        returnedUserName.value = response.data.data.userInfo.userName;
        emit('emit-user-name', returnedUserName.value);
        router.push({
          path: '/index',
          query: {
            userName: userName.value
          }
        })
        userStore.login();
      } else if (response.data.code == 502) {
        ElMessageBox.alert('用户名或密码错误', '提示', {
        // if you want to disable its autofocus
        // autofocus: false,
        confirmButtonText: 'OK',
        callback: (action) => {},
        })
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
        })
      }
    } catch (error) {
      console.log("Failed", error);
    } finally {
        loading.value = false;
    }
  };
</script>