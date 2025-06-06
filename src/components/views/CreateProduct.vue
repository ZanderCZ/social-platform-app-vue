<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { reactive } from 'vue'
import { onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import axios from 'axios'

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

const getOrderIdByOrderName = async (orderName) => {
    try {
        const response = await axios.get('http://localhost:8080/api/order/byOrderName/' + orderName)
        console.log('Get order successfully', response)
        return response.data.data.orderId
    } catch (error) {
        console.log('Failed to get order by orderName', error)
    }
}
const clickCreateButton = async () => {
    try {
        const response = await axios.post('http://localhost:8080/api/product', {
            productName: form.productName,
            productPrice: form.productPrice,
            productStock: form.productStock,
            productDescription: form.productDescription,
            productCategoryId: form.productCategoryId,
            productIsOnSale: form.productIsOnSale,
            productCoverImageUrl: form.productName + '.jpg',
            productScore: form.productScore
        })
        console.log('Save successfully', response)
        ElMessageBox.alert('保存成功', '提示', {
          confirmButtonText: 'OK',
          callback: (action) => {
            // backButtonPressed()
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
    <h1>新增商品</h1>
    <!-- <p>{{ options }}</p> -->
     <!-- <p>{{ chosedCategoryName }}</p> -->
    <el-divider/>
    <!-- <p>{{ firstClassCategories }}</p>
    <p>{{ secondClassCategories }}</p>
    <p>{{ thirdClassCategories }}</p> -->
    <p>{{ form }}</p>
    <el-form :model="form" label-width="auto" style="max-width: 600px">
    <el-form-item label="商品名">
      <el-input style="width: 40%;" v-model="form.productName" />
    </el-form-item>
    <el-form-item label="商品图片">
        <el-space wrap>
            <el-image style="width: 200px; height: 200px" :src="imageUrl" fit="contain" />
            <el-upload
                ref="upload"
                class="upload-demo"
                :limit="1"
                :auto-upload="false"
                :on-change="handleFileChange"
                >
                <template #trigger>
                    <el-button type="primary">选择图片</el-button>
                </template>
                <el-button class="upload-button" type="success" @click="submitImage">
                    上传
                </el-button>
                <template #tip>
                    <div class="el-upload__tip text-red">
                    限制1个文件，重复选择将覆盖
                    </div>
                </template>
            </el-upload>

        </el-space>
    </el-form-item>
    <el-form-item label="商品库存">
        <!-- <el-input-number v-model="form.productStock" :min="0" style="width: 28%;">
            <template #suffix>
                <span>件</span>
            </template>
        </el-input-number> -->
        <el-slider v-model="form.productStock" show-input />
    </el-form-item>
    <el-form-item label="商品单价">
        <el-input-number v-model="form.productPrice" :precision="2" :min="0" style="width: 40%;">
            <template #suffix>
                <span>RMB</span>
            </template>
        </el-input-number>
    </el-form-item>
    <el-form-item label="商品类别">
        <el-cascader
            v-model="chosedCategoryName"
            :options="options"
            :props="props"
            @change="categoryNameChanged"
        />
    </el-form-item>
    <el-form-item label="是否上架">
        <el-switch
            v-model="form.productIsOnSale"
            class="ml-2"
            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
        />
    </el-form-item>
    <el-form-item label="评分">
        <el-rate
            v-model="form.productScore"
            :texts="['差评', '一般', '还行', '不错', '非常棒']"
            show-text
        />
    </el-form-item>
    <el-form-item label="商品描述">
        <el-input
            v-model="form.productDescription"
            style="width: 300px"
            :rows="3"
            type="textarea"
            placeholder="描述你的商品"
        />
    </el-form-item>

    <el-form-item>
      <el-space wrap>
        <el-button type="success" @click="clickCreateButton">创建</el-button>
        <el-button @click="backButtonPressed" type="danger">返回</el-button>
      </el-space>
    </el-form-item>
  </el-form>

</template>

<style scoped>

</style>