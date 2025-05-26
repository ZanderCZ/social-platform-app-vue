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
})

const clickEditButton = () => {
    isEditing.value = !isEditing.value
}
const getOrderIdByOrderName = async (orderName) => {
    try {
        const response = await axios.get('http://localhost:8080/api/order/byOrderName/' + orderName)
        console.log('Get order successfully', response)
        return response.data.data.orderId
    } catch (error) {
        console.log('Failed to get order by orderName', error)
    }
}
const clickSaveButton = async () => {
    try {
        const orderId = await getOrderIdByOrderName(passedOrderName)
        const response = await axios.put('http://localhost:8080/api/order/' + orderId, {
            productName: form.productName,
            productPrice: form.productPrice,
            productStock: form.productStock,
            productDescription: form.productDescription,
            productCategoryId: form.productCategoryId,
            productIsOnSale: form.productIsOnSale
        })
        console.log('Save successfully', response)
        ElMessageBox.alert('保存成功', '提示', {
          confirmButtonText: 'OK',
          callback: (action) => {
            isEditing.value = !isEditing.value
            backButtonPressed()
          },
          })
    } catch (error) {
        console.log('Failed to save order info', error);
        
    }
}

const passedOrderName = route.query.orderName || ''

const options = [
  {
    value: 'UnPaid',
    label: '待付款',
  },
  {
    value: 'NotDispatched',
    label: '待发货',
  },
  {
    value: 'Delivering',
    label: '派送中',
  },
  {
    value: 'Delivered',
    label: '已送达',
  },
  {
    value: 'Done',
    label: '已完成',
  },
]

const isEditing = ref(false)

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

onMounted(async () => {
    try {
        const response = await axios.get('http://localhost:8080/api/category/all')
        categoryList.value = response.data.data
        firstClassCategories.value = categoryList.value.filter((category) => category.categoryLevel == 0)
        secondClassCategories.value = categoryList.value.filter((category) => category.categoryLevel == 1)
        thirdClassCategories.value = categoryList.value.filter((category) => category.categoryLevel == 2)
        console.log('Get first class category success', response);
    } catch (error) {
        console.log('Failed', error);
    }
})
</script>


<template>
    <h1>新增商品</h1>
    <!-- <p>{{ firstClassCategories }}</p>
    <p>{{ secondClassCategories }}</p>
    <p>{{ thirdClassCategories }}</p> -->
    <el-form :model="form" label-width="auto" style="max-width: 600px">
    <el-form-item label="商品名">
      <el-input style="width: 40%;" v-model="form.productName" />
    </el-form-item>
    <el-form-item label="商品库存">
        <el-input-number v-model="form.productStock" :min="0" style="width: 28%;">
            <template #suffix>
                <span>件</span>
            </template>
        </el-input-number>
    </el-form-item>
    <el-form-item label="商品单价">
        <el-input-number v-model="form.productPrice" :precision="2" :min="0" style="width: 40%;">
            <template #suffix>
                <span>RMB</span>
            </template>
        </el-input-number>
    </el-form-item>
    <el-form-item label="商品类别">
        <el-select
        v-model="form.orderStatus"
        placeholder="Select"
        size="large"
        style="width: 40%"
        :disabled="!isEditing"
        >
            <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
        </el-select>
    </el-form-item>
    <el-form-item label="创建日期">
        <el-date-picker
          v-model="form.createTime"
          type="date"
          placeholder="Pick a date"
          style="width: 40%"
          :disabled="!isEditing"
        />
    </el-form-item>
    <el-form-item label="支付方式">
      <el-radio-group v-model="form.paymentMethod" :disabled="!isEditing">
        <el-radio value="WechatPay">微信支付</el-radio>
        <el-radio value="AliPay">支付宝支付</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item>
      <el-space wrap>
        <div v-if="!isEditing"><el-button type="primary" @click="clickEditButton">修改</el-button></div> 
        <div v-else><el-button type="primary" @click="clickSaveButton">保存</el-button></div>
        <el-button @click="backButtonPressed" type="danger">返回</el-button>
      </el-space>
    </el-form-item>
  </el-form>

</template>