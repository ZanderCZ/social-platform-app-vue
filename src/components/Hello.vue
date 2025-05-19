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
      <div>
        <span class="demonstration">用户名  </span>
        <el-input v-model="inputUserName" style="width: 240px" placeholder="请输入用户名" />
      </div>
      <div>
        <span class="demonstration">密码  </span>
        <el-input
            v-model="inputPassword"
            style="width: 240px"
            type="password"
            placeholder="请输入密码"
            show-password
        />
      </div>
      <div>
        <span class="demonstration">邮箱  </span>
        <el-input v-model="inputEmail" style="width: 240px" placeholder="请输入邮箱" />
        <div class="block">
          <span class="demonstration">出生日期  </span>
          <el-date-picker
            v-model="inputBirthdate"
            type="date"x
            placeholder="选择日期"
            format="YYYY/MM/DD"
            value-format="YYYY-MM-DD"
          />
        </div>
      </div>
      <div>
        <span class="demonstration">性别  </span>
        <el-select v-model="inputGender" placeholder="性别" style="width: 100px">
          <el-option
            v-for="item in genderOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      <div>
        <span class="demonstration">手机号  </span>
        <el-input
          v-model="inputPhoneNumber"
          style="width: 240px"
          placeholder="请输入手机号"
          maxlength="11"
          minlength="11"
          show-word-limit
          clearable
        />
      </div>
      <div>
        <span class="demonstration">地区  </span>
        <el-cascader v-model="inputRegion" :options="regionOptions" :show-all-levels="false" plcaeholder="选择地区" />
      </div>
      <el-space wrap>
        <el-button type="primary"  @click="back2Login">返回</el-button>
        <el-button type="primary" :loading="loading" @click="regist">注册</el-button>
      </el-space>
    </el-space>
  </div>
</template>
  
<script setup>
  import axios from 'axios';
  import { ref } from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus'

  import { useUserStore } from '@/stores/user'
  const userStore = useUserStore()
  
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