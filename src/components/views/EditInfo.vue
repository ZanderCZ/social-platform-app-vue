<template>
  <div class="personal-info-container">
    <div class="header">
      <h1 class="title">个人资料</h1>
    </div>
    
    <div class="form-container">
      <el-form :model="formData" label-width="120px" label-position="top">
        <div class="avatar-section">
          <el-form-item label="头像" class="avatar-item">
            <div class="avatar-wrapper">
              <el-avatar :src="imageSrc" :size="120" class="avatar" />
              <div v-if="isEditing" class="upload-btn">
                <el-upload
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="handleFileChange"
                >
                  <el-button type="primary" size="small" plain>更换头像</el-button>
                </el-upload>
              </div>
            </div>
          </el-form-item>
        </div>

        <div class="form-grid">
          <el-form-item label="用户名" class="form-item">
            <el-input 
              v-model="formData.userName" 
              :disabled="!isEditing" 
              placeholder="请输入用户名"
            />
          </el-form-item>

          <el-form-item label="密码" class="form-item">
            <el-input 
              v-model="formData.password" 
              :disabled="!isEditing" 
              show-password 
              placeholder="请输入密码"
            />
          </el-form-item>

          <el-form-item label="邮箱" class="form-item">
            <el-input 
              v-model="formData.email" 
              :disabled="!isEditing" 
              placeholder="请输入邮箱"
            />
          </el-form-item>

          <el-form-item label="出生日期" class="form-item">
            <el-date-picker 
              v-model="formData.birthday" 
              type="date" 
              placeholder="选择日期" 
              :disabled="!isEditing" 
              format="YYYY/MM/DD" 
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="手机号" class="form-item">
            <el-input 
              v-model="formData.phone" 
              :disabled="!isEditing" 
              placeholder="请输入手机号"
            />
          </el-form-item>

          <el-form-item label="地区" class="form-item">
            <el-cascader
              v-model="formData.region"
              :options="regionOptions"
              :disabled="!isEditing"
              :show-all-levels="false"
              placeholder="请选择地区"
              style="width: 100%"
            />
          </el-form-item>
        </div>

        <div class="action-buttons">
          <el-button 
            v-if="!isEditing" 
            @click="clickEditButton" 
            type="primary" 
            size="large"
            class="edit-btn"
          >
            <el-icon><Edit /></el-icon>
            <span>编辑资料</span>
          </el-button>
          <el-button 
            v-else 
            @click="finishEditing" 
            type="primary" 
            size="large"
            class="save-btn"
          >
            <el-icon><Check /></el-icon>
            <span>保存修改</span>
          </el-button>
            <el-button 
            @click="goBack()" 
            type="danger" 
            size="large"
            class="save-btn"
          >
            <span>返回</span>
          </el-button>
          
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios';
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { Edit, Check } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter();
const passedUserName = route.query.userName // 获取 URL 中的 ?userName=xxx

import { useUserStore } from'@/stores/user'
const userStore = useUserStore()

const goBack = () => {
  router.push({
      path: '/index',
      query: {
      status: '3-1',
      userName: 'admin'
      }
  })
}

const formData = ref({
  userName: '',
  password: '',
  email: '',
  birthday: '',
  phone: '',
  region: '',
  gender: '',
});

const clickEditButton = () => {
    isEditing.value = true;
};

const finishEditing = async () => {
    isEditing.value = false;
    var submitRegion = ''
    if (typeof formData.value.region == 'string') {
      submitRegion = formData.value.region
    } else {
      submitRegion = formData.value.region?.[2]
    }
    try {
        const response = await axios.put('http://localhost:8080/api/user', {
            userName: currentUserName.value,
            phone: formData.value.phone,
            birthday: formData.value.birthday,
            gender: formData.value.gender,
            email: formData.value.email,
            password: formData.value.password,
            region: submitRegion,  // 取最后一级区域名
        })
        console.log('Success', response);
        ElMessageBox.alert('保存成功', '提示', {
        confirmButtonText: 'OK',
        callback: (action) => {
          goBack();
        },
        })
    } catch (error) {
        console.log(error);
        ElMessageBox.alert('保存失败！', '提示', {
        confirmButtonText: 'OK',
        callback: (action) => {},
        })
        throw error;
    }
}

const userInfo = ref();

const imageSrc = ref('https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png');

onMounted(async () => {
    currentUserName.value = passedUserName;
    imageSrc.value = 'http://localhost:8080/uploads/userImage/' + currentUserName.value + '.jpg?t=' + Date.now();
    console.log('onMounted: imageSrc.value:', imageSrc.value);

    try {
        const response = await getUserInfo(currentUserName.value);
        userInfo.value = response;
        formData.value.email = userInfo.value.email;
        formData.value.userName = currentUserName.value;
        formData.value.region = userInfo.value.region;
        formData.value.phone = userInfo.value.phone;
        formData.value.birthday = userInfo.value.birthday;
        formData.value.gender = userInfo.value.gender;
        formData.value.password = userInfo.value.password;
    } catch (error) {
        console.error('获取用户信息失败:', error);
    }
});

const getUserInfo = async (userName) => {
    try {
        const response = await axios.get('http://localhost:8080/api/user/byUserName/' + userName);
        console.log('Success', response);
        return response.data.data;
    } catch (error) {
        console.log('Failed', error);
        throw error;
    }
}

const selectedFile = ref(null);
const currentUserName = ref(passedUserName || '');

const handleFileChange = (file) => {
  selectedFile.value = file.raw; // 获取选中的文件
  submitImage();
};

const submitImage = async () => {
    if (!selectedFile.value) {
        ElMessageBox.alert('请选择一个图片', '提示', {
        confirmButtonText: 'OK',
        callback: (action) => {},
        })
        return;
    }
    try {
        const imageData = await changeImage(currentUserName.value, selectedFile.value);
        imageSrc.value = imageData.data;
        console.log('imageSrc: ' + imageSrc);
        ElMessageBox.alert('图片上传成功', '提示', {
        confirmButtonText: 'OK',
        callback: (action) => {
        },
        })
    } catch (error) {
        console.log(error);
        ElMessageBox.alert('上传失败', '提示', {
        confirmButtonText: 'OK',
        callback: (action) => {},
        })
    }
}

const changeImage = async (userName, imageFile) => {
    console.log('Uploading image for user:', userName);
    try {
        // 1. 创建 FormData 对象
        const formData = new FormData();
        
        // 2. 添加 userName 和 image 文件
        formData.append('userName', userName);  // 文本字段
        formData.append('photo', imageFile);    // 文件字段

        // 3. 发送 POST 请求（注意 headers 要设置 'Content-Type': 'multipart/form-data'）
        const response = await axios.post(
            'http://localhost:8080/api/upload/userImage',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data', // 必须设置
                },
            }
        );

        console.log('Upload success:', response.data);
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

const isEditing = ref(false);

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

</script>

<style scoped>
.personal-info-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.title {
  font-size: 24px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.form-container {
  padding: 0 20px;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.avatar {
  border: 2px solid #f2f6fc;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.upload-btn {
  margin-top: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.form-item {
  margin-bottom: 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.edit-btn, .save-btn {
  width: 200px;
}

.edit-btn {
  background-color: #409eff;
  border-color: #409eff;
}

.save-btn {
  background-color: #67c23a;
  border-color: #67c23a;
}

.el-form-item__label {
  font-weight: 500;
  color: #606266;
  padding-bottom: 8px !important;
}

.el-input, .el-date-editor, .el-cascader {
  width: 100%;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .personal-info-container {
    padding: 16px;
  }
}
</style>