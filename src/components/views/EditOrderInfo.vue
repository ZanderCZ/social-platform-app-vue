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
  goodName: '',
  goodCount: 1,
  totalAmount: 1.0,
  orderStatus: '',
  paymentMethod: '',
  createTime: '',
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
            totalAmount: form.totalAmount,
            orderStatus: form.orderStatus,
            paymentMethod: form.paymentMethod,
            createTime: form.createTime,
            goodName: form.goodName,
            goodQuantity: form.goodCount
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
        status: '3-2',
        userName: 'admin'
        }
    })
}

onMounted(async () => {
    try {
        const response = await axios.get('http://localhost:8080/api/order/byOrderName/' + passedOrderName)
        console.log('Get order info successfully', response)
        const orderInfo = response.data.data
        form.createTime = orderInfo.createTime
        form.goodName = orderInfo.goodName
        form.goodCount = orderInfo.goodQuantity
        form.orderStatus = orderInfo.orderStatus
        form.paymentMethod = orderInfo.paymentMethod
        form.totalAmount = orderInfo.totalAmount
    } catch (error) {
        console.log('Failed to get order info', error)
    }

})
</script>


<template>
    <h1>修改订单信息</h1>
    <h3> 订单号：{{ passedOrderName }}</h3>
    <el-form :model="form" label-width="auto" style="max-width: 600px">
    <el-form-item label="商品名">
      <el-input style="width: 40%;" v-model="form.goodName" :disabled="!isEditing" />
    </el-form-item>
    <el-form-item label="商品数量">
        <el-input-number v-model="form.goodCount" :min="0" style="width: 28%;" :disabled="!isEditing">
            <template #suffix>
                <span>件</span>
            </template>
        </el-input-number>
    </el-form-item>
    <el-form-item label="订单金额">
        <el-input-number v-model="form.totalAmount" :precision="2" :min="0" style="width: 40%;" :disabled="!isEditing">
            <template #suffix>
                <span>RMB</span>
            </template>
        </el-input-number>
    </el-form-item>
    <el-form-item label="订单状态">
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