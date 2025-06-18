<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { reactive } from 'vue'
import { onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import axios from 'axios'
import { UploadFilled, Plus } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// do not use same name with ref
const form = reactive({
  productName: '',
  productPrice: 1.0,
  productCategoryId: 1,
  productStock: 1,
  productDescription: '',
  productIsOnSale: false,
  productScore: 0,
})

const clickCreateButton = async () => {
    try {
        const response = await axios.post('http://localhost:8080/api/product', {
            productName: form.productName,
            productPrice: form.productPrice,
            productStock: form.productStock,
            productDescription: form.productDescription,
            productCategoryId: form.productCategoryId,
            productIsOnSale: form.productIsOnSale,
            productCoverImageUrl: form.productName,
            productScore: form.productScore
        })
        console.log('Save successfully', response)
        ElMessageBox.alert('保存成功', '提示', {
          confirmButtonText: 'OK',
          callback: (action) => {
            backButtonPressed()
          },
          })
    } catch (error) {
        console.log('Failed to save order info', error);
    }
}

const backButtonPressed = () => {
    router.push({
        path: '/index',
        query: {
        status: '3-3',
        userName: 'admin'
        }
    })
}

const categoryList = ref([])
const firstClassCategories = ref([])
const secondClassCategories = ref([])
const thirdClassCategories = ref([])

const getAllCategories = async () => {
    try {
        const response = await axios.get('http://localhost:8080/api/category/all')
        categoryList.value = response.data.data
        firstClassCategories.value = categoryList.value.filter((category) => category.categoryLevel == 0)
        secondClassCategories.value = categoryList.value.filter((category) => category.categoryLevel == 1)
        thirdClassCategories.value = categoryList.value.filter((category) => category.categoryLevel == 2)
        console.log('Get categories success', response);
    } catch (error) {
        console.log('Failed', error);
    }
}

const options = ref([])

// 这个函数纯手敲，完全没有AI，相当复杂
const setCategoryOptions = async () => {
    // 对于每一个一级类别
    for (const firstClassCategory of firstClassCategories.value) {
        const secondCategoryOptions = []
        try {
            const response = await axios.get('http://localhost:8080/api/category/getChildById/' + firstClassCategory.categoryId)
            console.log(response)
            const childrenCategoriesOfFirstClass = response.data.data
            // 对于每一个二级类别
            for (const secondClassCategory of childrenCategoriesOfFirstClass) {
                const thirdCategoryOptions = []
                try {
                    const response = await axios.get('http://localhost:8080/api/category/getChildById/' + secondClassCategory.categoryId)
                    console.log(response)
                    const childrenCategoriesOfSecondClass = response.data.data
                    // 对于每一个三级分类，添加进选项中
                    for (const thirdCategory of childrenCategoriesOfSecondClass) {
                        thirdCategoryOptions.push({
                            value: thirdCategory.categoryName,
                            label: thirdCategory.categoryName
                        })
                    }
                } catch (error) {
                    console.log('Failed to get child categories', error);
                }
                // 将二级分类添加进选项中
                secondCategoryOptions.push({
                    value: secondClassCategory.categoryName,
                    label: secondClassCategory.categoryName,
                    children: thirdCategoryOptions
                })
            }
        } catch (error) {
            console.log('Failed to get child categories', error)
        }
        // 将一级分类添加进选项中
        options.value.push({
            value: firstClassCategory.categoryName,
            label: firstClassCategory.categoryName,
            children: secondCategoryOptions
        })
    }
}

onMounted(async () => {
    await getAllCategories()
    await setCategoryOptions()
})

const props = {
  expandTrigger: 'hover',
}
const chosedCategoryName = ref([])
const categoryNameChanged = async () => {
    const targetCategoryName = chosedCategoryName.value[2]
    try {
        const response = await axios.get('http://localhost:8080/api/category/byCategoryName/' + targetCategoryName)
        console.log(response);
        const category = response.data.data
        form.productCategoryId = category.categoryId
    } catch (error) {
        console.log('Failed to get category by categoryName', error);
    }
}

const imageUrl = ref('')
const selectedFile = ref(null);
const handleFileChange = (file) => {
  if (!form.productName) {
    ElMessageBox.alert('请先填写商品名', '提示', {
      confirmButtonText: 'OK'
    })
    return
  }
  selectedFile.value = file.raw // 获取原始文件
}

const submitImage = async () => {
  if (!selectedFile.value) {
    ElMessageBox.alert('请选择一张图片', '提示', {
      confirmButtonText: 'OK'
    })
    return
  }
  try {
    const imageData = await changeImage(form.productName, selectedFile.value);
    imageUrl.value = 'http://localhost:8080/uploads/productImage/' + form.productName + '.jpg?t=' + Date.now();
    ElMessageBox.alert('图片上传成功', '提示', {
      confirmButtonText: 'OK'
    });
  } catch (error) {
    console.log(error);
    ElMessageBox.alert('上传失败', '提示', {
      confirmButtonText: 'OK'
    });
  }
};

const changeImage = async (productName, imageFile) => {
    console.log('Uploading image for product:', productName);
    try {
        // 1. 创建 FormData 对象
        const formData = new FormData();
        
        // 2. 添加 userName 和 image 文件
        formData.append('productName', productName);  // 文本字段
        formData.append('photo', imageFile);    // 文件字段

        // 3. 发送 POST 请求（注意 headers 要设置 'Content-Type': 'multipart/form-data'）
        const response = await axios.post(
            'http://localhost:8080/api/upload/productImage',
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
const upload = ref()
// 超出限制
const handleExceed = (files) => {
  upload.value.clearFiles()
  const file = files[0]
  file.uid = genFileId()
  upload.value.handleStart(file)
}
</script>

<template>
  <div class="product-create-container">
    <div class="header">
      <h1 class="title">新增商品</h1>
      <el-divider class="divider"/>
    </div>
    
    <div class="form-container">
      <el-form :model="form" label-width="120px" label-position="top">
        <div class="form-grid">
          <div class="form-section">
            <el-form-item label="商品名称" class="form-item">
              <el-input 
                v-model="form.productName" 
                placeholder="请输入商品名称"
                clearable
              />
            </el-form-item>
            
            <el-form-item label="商品类别" class="form-item">
              <el-cascader
                v-model="chosedCategoryName"
                :options="options"
                :props="props"
                @change="categoryNameChanged"
                placeholder="请选择商品类别"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="商品单价" class="form-item">
              <el-input-number 
                v-model="form.productPrice" 
                :precision="2" 
                :min="0" 
                controls-position="right"
                style="width: 100%"
              >
                <template #suffix>
                  <span class="suffix-text">元</span>
                </template>
              </el-input-number>
            </el-form-item>
            
            <el-form-item label="商品库存" class="form-item">
              <el-slider 
                v-model="form.productStock" 
                show-input 
                :min="0" 
                :max="1000"
              />
            </el-form-item>
          </div>
          
          <div class="form-section">
            <el-form-item label="商品图片" class="form-item">
              <div class="image-uploader">
                <el-image 
                  v-if="imageUrl" 
                  :src="imageUrl" 
                  fit="cover" 
                  class="product-image"
                  :preview-src-list="[imageUrl]"
                />
                <div v-else class="image-placeholder">
                  <el-icon :size="50"><Plus /></el-icon>
                  <span>商品图片</span>
                </div>
                
                <div class="upload-actions">
                  <el-upload
                    ref="upload"
                    class="upload-demo"
                    :limit="1"
                    :auto-upload="false"
                    :on-change="handleFileChange"
                  >
                    <template #trigger>
                      <el-button type="primary" :icon="UploadFilled">选择图片</el-button>
                    </template>
                    <el-button 
                      type="success" 
                      class="upload-button" 
                      @click="submitImage"
                      :disabled="!selectedFile"
                    >
                      上传图片
                    </el-button>
                  </el-upload>
                  <div class="upload-tip">
                    支持JPG/PNG格式，大小不超过5MB
                  </div>
                </div>
              </div>
            </el-form-item>
          </div>
        </div>
        
        <div class="form-section">
          <el-form-item label="商品描述" class="form-item">
            <el-input
              v-model="form.productDescription"
              type="textarea"
              :rows="4"
              placeholder="请输入商品详细描述"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
          
          <div class="form-row">
            <el-form-item label="是否上架" class="form-item">
              <el-switch
                v-model="form.productIsOnSale"
                active-text="立即上架"
                inactive-text="暂不上架"
                style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
              />
            </el-form-item>
            
            <el-form-item label="商品评分" class="form-item">
              <el-rate
                v-model="form.productScore"
                :texts="['差评', '一般', '还行', '不错', '非常棒']"
                show-text
              />
            </el-form-item>
          </div>
        </div>
        
        <div class="form-actions">
          <el-button 
            type="success" 
            size="large" 
            @click="clickCreateButton"
            class="action-button"
          >
            创建商品
          </el-button>
          <el-button 
            @click="backButtonPressed" 
            size="large"
            class="action-button"
          >
            返回
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.product-create-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header {
  margin-bottom: 24px;
}

.title {
  font-size: 24px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.divider {
  margin: 16px 0;
}

.form-container {
  padding: 0 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 24px;
}

.form-section {
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 24px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 40px;
}

.image-uploader {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-image {
  width: 100%;
  height: 300px;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
  object-fit: contain;
  background-color: #f5f7fa;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 300px;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
  background-color: #f5f7fa;
  color: #8c939d;
  font-size: 14px;
  cursor: pointer;
}

.upload-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-button {
  width: 100%;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.suffix-text {
  color: #909399;
  margin-left: 5px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 40px;
}

.action-button {
  width: 180px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  
  .product-create-container {
    padding: 16px;
  }
}
</style>