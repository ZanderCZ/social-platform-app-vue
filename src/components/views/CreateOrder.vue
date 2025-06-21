<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { reactive } from 'vue'
import { onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import axios from 'axios'
import { Edit, Check, Back } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const form = reactive({
  goodName: '',
  goodCount: 1,
  totalAmount: 1.0,
  orderStatus: '',
  paymentMethod: '',
  createTime: '',
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
        const orderId = await getOrderIdByOrderName(passedOrderName)
        const response = await axios.post('http://localhost:8080/api/order', {
            userName: form.userName,
            totalAmount: form.totalAmount,
            orderStatus: 'UnPaid',
            paymentMethod: form.paymentMethod,
            createTime: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }),
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
    
})

const isAllowProductQuantityIncrease = ref(false)
const updateTotalAmount = async () => {
    var productName = form.goodName
    var productPrice = 0.0
    var productStock = 0
    if (productName != '') {
        isAllowProductQuantityIncrease.value = true
    }
    try {
        const response = await axios.get("http://localhost:8080/api/product/byProductName/" + productName)
        console.log(response);
        productPrice = response.data.data.productPrice
        productStock = response.data.data.productStock
        if (form.goodCount >= productStock) {
            form.goodCount = productStock
            ElMessage.error('商品库存不足')
        }
        form.totalAmount = form.goodCount * productPrice
    } catch (error) {
        console.log('Failed to get product by productName', error);
    }
}
</script>

<template>
    <div>{{ form.totalAmount }}</div>
  <div class="order-edit-container">
    <div class="header">
      <h1 class="title">创建订单</h1>
      <el-divider class="divider"/>
    </div>
    
    <div class="form-container">
      <el-form :model="form" label-width="120px" label-position="top">
        <div class="form-grid">
          <div class="form-section">
            <el-form-item label="买家名称" class="form-item">
              <el-input 
                v-model="form.userName" 
                placeholder="请输入买家名称"
                clearable
              />
            </el-form-item>
            
            <el-form-item label="商品数量" class="form-item">
              <el-input-number 
                v-model="form.goodCount" 
                :min="1" 
                controls-position="right"
                style="width: 100%"
                :disabled="!isAllowProductQuantityIncrease"
                @change="updateTotalAmount()"
              >
                <template #suffix>
                  <span class="suffix-text">件</span>
                </template>
              </el-input-number>
            </el-form-item>
            
            <el-form-item label="订单金额" class="form-item">
              <el-input-number 
                v-model="form.totalAmount" 
                :precision="2" 
                :min="0" 
                controls-position="right"
                style="width: 100%"
                disabled
              >
                <template #suffix>
                  <span class="suffix-text">元</span>
                </template>
              </el-input-number>
            </el-form-item>
          </div>
          
          <div class="form-section">
            <el-form-item label="商品名称" class="form-item">
                <el-input 
                    v-model="form.goodName" 
                    placeholder="请输入商品名称"
                    clearable
                    @change="updateTotalAmount()"
                />
              <!-- <el-select
                v-model="form.orderStatus"
                placeholder="请输入商品名称"
                style="width: 100%"
                :disabled="!isEditing"
              >
                <el-option
                  v-for="item in statusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                  :style="{ color: item.color }"
                />
              </el-select> -->
            </el-form-item>
            
            <!-- <el-form-item label="创建日期" class="form-item">
              <el-date-picker
                v-model="form.createTime"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                format="YYYY/MM/DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item> -->
            
            <el-form-item label="支付方式" class="form-item">
              <el-radio-group v-model="form.paymentMethod">
                <el-radio-button value="WechatPay">微信支付</el-radio-button>
                <el-radio-button value="AliPay">支付宝支付</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </div>
        </div>
        
        <div class="form-actions">
            <el-button 
              type="success" 
              size="large" 
              @click="clickCreateButton()"
              class="action-button"
              :icon="Check"
            >
              保存修改
            </el-button>
          <el-button 
            @click="backButtonPressed()" 
            size="large"
            class="action-button"
            :icon="Back"
          >
            返回
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.order-edit-container {
  max-width: 1000px;
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

.order-number {
  font-size: 14px;
  color: #909399;
  margin-bottom: 16px;
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
  
  .order-edit-container {
    padding: 16px;
  }
}
</style>