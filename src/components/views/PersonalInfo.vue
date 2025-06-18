<template>
  <div class="personal-info-container">
    <el-card class="profile-card">
      <div class="header">
        <h1 class="title">个人信息中心</h1>
        <el-tag type="success" v-if="!isEditing">查看模式</el-tag>
        <el-tag type="warning" v-else>编辑模式</el-tag>
      </div>

      <el-form :model="formData" label-width="100px" class="profile-form">
        <el-form-item label="头像" class="avatar-item">
          <div class="avatar-container">
            <el-avatar :src="imageSrc" :size="120" class="user-avatar" />
            <transition name="el-fade-in">
              <div v-if="isEditing" class="avatar-upload">
                <el-upload
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="handleFileChange"
                  accept="image/*"
                >
                  <el-button type="primary" size="small" plain>
                    <el-icon><Upload /></el-icon>
                    更换头像
                  </el-button>
                </el-upload>
                <div class="upload-tip">支持 JPG/PNG 格式，大小不超过 2MB</div>
              </div>
            </transition>
          </div>
        </el-form-item>

        <el-form-item label="用户名">
          <el-input 
            v-model="formData.userName" 
            :disabled="!isEditing" 
            placeholder="请输入用户名"
            clearable
          />
        </el-form-item>

        <el-form-item label="密码">
          <el-input 
            v-model="formData.password" 
            :disabled="!isEditing" 
            show-password 
            placeholder="请输入密码"
          />
        </el-form-item>

        <el-form-item label="邮箱">
          <el-input 
            v-model="formData.email" 
            :disabled="!isEditing" 
            placeholder="请输入邮箱"
          />
        </el-form-item>

        <el-form-item label="出生日期">
          <el-date-picker 
            v-model="formData.birthday" 
            type="date" 
            placeholder="选择日期"
            :disabled="!isEditing"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="手机号">
          <el-input 
            v-model="formData.phone" 
            :disabled="!isEditing" 
            placeholder="请输入手机号"
            maxlength="11"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="地区">
          <el-cascader
            v-model="formData.region"
            :options="regionOptions"
            :disabled="!isEditing"
            :show-all-levels="false"
            placeholder="选择地区"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="性别">
          <el-select
            v-model="formData.gender"
            :disabled="!isEditing"
            placeholder="请选择性别"
            style="width: 100%"
          >
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item class="action-buttons">
          <el-space :size="20">
            <el-button 
              v-if="!isEditing" 
              @click="clickEditButton" 
              type="primary"
              size="large"
            >
              <el-icon><Edit /></el-icon>
              修改信息
            </el-button>
            <el-button 
              v-else 
              @click="finishEditing" 
              type="success"
              size="large"
            >
              <el-icon><Check /></el-icon>
              保存信息
            </el-button>
            <el-button 
              @click="exitLogin" 
              type="danger"
              size="large"
            >
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-button>
          </el-space>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import axios from 'axios';
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Check, SwitchButton, Upload } from '@element-plus/icons-vue'
const props = defineProps({
    passedUserName: String,
})
import { useUserStore } from'@/stores/user'
const userStore = useUserStore()
import { useRouter } from 'vue-router'
const router = useRouter()

const formData = ref({
  userName: '',
  password: '',
  email: '',
  birthday: '',
  phone: '',
  region: '',
  gender: '',
});

const exitLogin = () => {
  ElMessageBox.confirm(
      '确定要退出登录吗?',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    .then(() => {
      userStore.logout()
      router.push({
          path: '/',
        })
    })
    .catch(() => {})
};

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
        ElMessage.success('保存成功')
    } catch (error) {
        console.log(error);
        ElMessage.error('保存失败！')
        throw error;
    }
}

const userInfo = ref();

const imageSrc = ref('https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png');

onMounted(async () => {
    currentUserName.value = props.passedUserName;
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

const currentUserName = ref(props.passedUserName || '');

const selectedFile = ref(null);
const handleFileChange = (file) => {
  selectedFile.value = file.raw; // 获取选中的文件
  submitImage();
};
const submitImage = async () => {
    if (!selectedFile.value) {
        ElMessage.warning('请选择一个图片')
        return;
    }
    
    // 检查文件大小
    if (selectedFile.value.size > 2 * 1024 * 1024) {
        ElMessage.error('图片大小不能超过2MB')
        return;
    }
    
    try {
        await changeImage(currentUserName.value, selectedFile.value);
        ElMessage.success('图片上传成功')
        // 更新头像显示，添加时间戳避免缓存
        imageSrc.value = 'http://localhost:8080/uploads/userImage/' + currentUserName.value + '.jpg?t=' + Date.now();
    } catch (error) {
        console.log(error);
        ElMessage.error('上传失败')
    }
}
const changeImage = async (userName, imageFile) => {
    console.log('Uploading image for user:', userName);
    try {
        const formData = new FormData();
        formData.append('userName', userName);
        formData.append('photo', imageFile);

        const response = await axios.post(
            'http://localhost:8080/api/upload/userImage',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        console.log('Upload success:', response.data);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
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
  padding: 20px;
}

.profile-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.title {
  margin: 0;
  font-size: 24px;
  color: var(--el-text-color-primary);
}

.profile-form {
  padding: 20px;
}

.avatar-item {
  margin-bottom: 30px;
}

.avatar-container {
  display: flex;
  align-items: center;
  gap: 30px;
}

.user-avatar {
  border: 3px solid var(--el-color-primary);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.el-form-item {
  margin-bottom: 22px;
}

.action-buttons {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .avatar-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .profile-form {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .action-buttons {
    margin-top: 30px;
  }
  
  .el-form-item {
    margin-bottom: 18px;
  }
}
</style>