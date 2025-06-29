<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { reactive } from 'vue'
import { onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import axios from 'axios'
import { Edit, Check, Back, Search, InfoFilled } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const form = reactive({
  orderId: '',
  expressCompany: '',
  shippedTime: '',
  deliveredTime: '',
  orderStatus: ''
})

// 订单选择对话框相关
const orderDialogVisible = ref(false);
const allOrders = ref([]);
const selectedOrder = ref(null);
const orderSearchKeyword = ref('');

// 快递公司选项
const expressCompanyOptions = ref([
  { value: '顺丰速运', label: '顺丰速运' },
  { value: '圆通速递', label: '圆通速递' },
  { value: '中通快递', label: '中通快递' },
  { value: '申通快递', label: '申通快递' },
  { value: '韵达快递', label: '韵达快递' },
  { value: '百世快递', label: '百世快递' },
  { value: '德邦快递', label: '德邦快递' },
  { value: '京东物流', label: '京东物流' },
  { value: 'EMS', label: 'EMS' },
  { value: '天天快递', label: '天天快递' }
]);

// 订单状态选项
const orderStatusOptions = ref([
  { value: 'UnPaid', label: '待付款' },
  { value: 'NotDispatched', label: '待发货' },
  { value: 'Delivering', label: '派送中' },
  { value: 'Delivered', label: '已送达' },
  { value: 'Done', label: '已完成' }
]);

const passedDeliveryId = route.query.deliveryId || ''

const clickEditButton = () => {
    isEditing.value = !isEditing.value
}

const clickSaveButton = async () => {
    // 表单验证
    if (!form.orderId) {
        ElMessage.error('请选择订单');
        return;
    }
    if (!form.expressCompany) {
        ElMessage.error('请选择快递公司');
        return;
    }
    if (!form.orderStatus) {
        ElMessage.error('请选择订单状态');
        return;
    }
    
    // 时间逻辑验证
    const timeErrors = validateTimeLogic();
    if (timeErrors.length > 0) {
        ElMessage.error(timeErrors[0]);
        return;
    }
    
    // 逻辑验证
    if (form.shippedTime && ['UnPaid', 'NotDispatched'].includes(form.orderStatus)) {
        ElMessage.error('已设置发货时间，订单状态不能是待付款或待发货');
        return;
    }
    if (form.deliveredTime && !['Delivered', 'Done'].includes(form.orderStatus)) {
        ElMessage.error('已设置送达时间，订单状态必须是已送达或已完成');
        return;
    }
    
    try {
        // 先更新物流信息
        const deliveryResponse = await axios.put('http://localhost:8080/api/delivery/' + passedDeliveryId, {
            orderId: form.orderId,
            expressCompany: form.expressCompany,
            shippedTime: form.shippedTime,
            deliveredTime: form.deliveredTime
        })
        console.log('Save delivery successfully', deliveryResponse);
        
        // 再更新订单状态
        const orderResponse = await axios.put('http://localhost:8080/api/order/' + form.orderId, {
            orderStatus: form.orderStatus
        })
        console.log('Update order status successfully', orderResponse);
        
        ElMessageBox.alert('保存成功', '提示', {
          confirmButtonText: 'OK',
          callback: (action) => {
            isEditing.value = !isEditing.value
            backButtonPressed()
          },
        })
    } catch (error) {
        console.log('Failed to save delivery or order', error);
        ElMessage.error('保存失败，请重试');
    }
}

const backButtonPressed = () => {
    router.push({
        path: '/index',
        query: {
        status: '3-4',
        userName: 'admin'
        }
    })
}

const isEditing = ref(false)

// 获取所有订单信息
const getAllOrders = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/order/all');
    console.log('Get all orders success', response);
    allOrders.value = response.data.data;
  } catch (error) {
    console.log('Failed to get orders', error);
    throw error;
  }
}

// 打开订单选择对话框
const openOrderDialog = () => {
  orderDialogVisible.value = true;
  getAllOrders();
}

// 选择订单
const selectOrder = (order) => {
  selectedOrder.value = order;
  form.orderId = order.orderId;
  orderDialogVisible.value = false;
}

// 过滤订单列表
const filteredOrders = computed(() => {
  if (!orderSearchKeyword.value) {
    return allOrders.value;
  }
  return allOrders.value.filter(order => 
    order.orderName.toLowerCase().includes(orderSearchKeyword.value.toLowerCase()) ||
    order.userName.toLowerCase().includes(orderSearchKeyword.value.toLowerCase()) ||
    order.goodName.toLowerCase().includes(orderSearchKeyword.value.toLowerCase())
  );
});

// 根据时间状态过滤订单状态选项
const filteredOrderStatusOptions = computed(() => {
  let options = [...orderStatusOptions.value];
  
  // 如果发货时间不为空，则订单状态不能是待付款或待发货
  if (form.shippedTime) {
    options = options.filter(option => 
      option.value !== 'UnPaid' && option.value !== 'NotDispatched'
    );
  }
  
  // 如果送达时间不为空，则订单状态必须是已送达或已完成
  if (form.deliveredTime) {
    options = options.filter(option => 
      option.value === 'Delivered' || option.value === 'Done'
    );
  }
  
  return options;
});

// 监听发货时间变化
const handleShippedTimeChange = (value) => {
  form.shippedTime = value;
  
  // 如果发货时间不为空，且当前订单状态是待付款或待发货，则自动更新为派送中
  if (value && (form.orderStatus === 'UnPaid' || form.orderStatus === 'NotDispatched')) {
    form.orderStatus = 'Delivering';
  }
  
  // 如果发货时间为空，且送达时间也为空，则订单状态不能是派送中、已送达、已完成
  if (!value && !form.deliveredTime && ['Delivering', 'Delivered', 'Done'].includes(form.orderStatus)) {
    form.orderStatus = 'NotDispatched';
  }
};

// 监听送达时间变化
const handleDeliveredTimeChange = (value) => {
  form.deliveredTime = value;
  
  // 如果送达时间不为空，则订单状态自动更新为已送达
  if (value) {
    form.orderStatus = 'Delivered';
  } else {
    // 如果送达时间为空，且发货时间不为空，则订单状态为派送中
    if (form.shippedTime) {
      form.orderStatus = 'Delivering';
    } else {
      // 如果发货时间也为空，则订单状态为待发货
      form.orderStatus = 'NotDispatched';
    }
  }
};

// 验证时间逻辑
const validateTimeLogic = () => {
  const errors = [];
  
  // 如果送达时间不为空，发货时间必须不为空
  if (form.deliveredTime && !form.shippedTime) {
    errors.push('送达时间不能早于发货时间');
  }
  
  // 如果发货时间和送达时间都不为空，送达时间必须晚于发货时间
  if (form.shippedTime && form.deliveredTime) {
    const shippedTime = new Date(form.shippedTime);
    const deliveredTime = new Date(form.deliveredTime);
    if (deliveredTime <= shippedTime) {
      errors.push('送达时间必须晚于发货时间');
    }
  }
  
  return errors;
};

// 获取当前状态提示
const getStatusHint = computed(() => {
  if (form.deliveredTime) {
    return '已设置送达时间，订单状态应为已送达或已完成';
  } else if (form.shippedTime) {
    return '已设置发货时间，订单状态应为派送中、已送达或已完成';
  } else {
    return '未设置发货时间，订单状态可以是待付款、待发货';
  }
});

onMounted(async () => {
    try {
        const response = await axios.get('http://localhost:8080/api/delivery/byDeliveryId/' + passedDeliveryId)
        console.log('Get delivery info successfully', response)
        const deliveryInfo = response.data.data
        form.orderId = deliveryInfo.order.orderId
        form.expressCompany = deliveryInfo.expressCompany
        form.shippedTime = deliveryInfo.shippedTime
        form.deliveredTime = deliveryInfo.deliveredTime
        form.orderStatus = deliveryInfo.order.orderStatus
        
        // 设置选中的订单
        selectedOrder.value = deliveryInfo.order
    } catch (error) {
        console.log('Failed to get delivery info', error)
    }
})
</script>

<template>
  <div class="delivery-edit-container">
    <div class="header">
      <h1 class="title">编辑物流信息</h1>
      <div class="delivery-id">物流号：{{ passedDeliveryId }}</div>
      <el-divider class="divider"/>
    </div>
    
    <div class="form-container">
      <el-form :model="form" label-width="120px" label-position="top">
        <div class="form-grid">
          <div class="form-section">
            <el-form-item label="订单选择" class="form-item">
              <div style="display: flex; gap: 10px; align-items: center;">
                <el-input
                  :model-value="selectedOrder ? selectedOrder.orderName : ''"
                  placeholder="已选择的订单"
                  readonly
                  style="flex: 1"
                />
                <el-button 
                  @click="openOrderDialog" 
                  type="primary" 
                  plain
                  :disabled="!isEditing"
                >
                  选择订单
                </el-button>
                <el-button 
                  v-if="selectedOrder && isEditing" 
                  @click="selectedOrder = null; form.orderId = ''" 
                  type="danger" 
                  plain
                >
                  清空
                </el-button>
              </div>
            </el-form-item>
            
            <el-form-item label="快递公司" class="form-item">
              <el-select
                v-model="form.expressCompany"
                placeholder="请选择快递公司"
                style="width: 100%"
                :disabled="!isEditing"
              >
                <el-option
                  v-for="company in expressCompanyOptions"
                  :key="company.value"
                  :label="company.label"
                  :value="company.value"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="订单状态" class="form-item">
              <el-select
                v-model="form.orderStatus"
                placeholder="请选择订单状态"
                style="width: 100%"
                :disabled="!isEditing"
              >
                <el-option
                  v-for="option in filteredOrderStatusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
              <div v-if="isEditing" class="status-hint">
                <div style="margin-bottom: 4px;">
                  <el-icon><InfoFilled /></el-icon>
                  {{ getStatusHint }}
                </div>
                <div v-if="form.shippedTime && !form.deliveredTime">
                  <el-icon><InfoFilled /></el-icon>
                  已设置发货时间，订单状态将自动调整为派送中
                </div>
                <div v-if="form.deliveredTime">
                  <el-icon><InfoFilled /></el-icon>
                  已设置送达时间，订单状态将自动调整为已送达
                </div>
              </div>
            </el-form-item>
          </div>
          
          <div class="form-section">
            <el-form-item label="发货时间" class="form-item">
              <el-date-picker
                v-model="form.shippedTime"
                type="datetime"
                placeholder="选择发货时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                :disabled="!isEditing"
                @change="handleShippedTimeChange"
              />
            </el-form-item>
            
            <el-form-item label="送达时间" class="form-item">
              <el-date-picker
                v-model="form.deliveredTime"
                type="datetime"
                placeholder="选择送达时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                :disabled="!isEditing"
                @change="handleDeliveredTimeChange"
              />
            </el-form-item>
          </div>
        </div>
        
        <div class="form-actions">
          <el-button 
            v-if="!isEditing"
            type="primary" 
            size="large" 
            @click="clickEditButton()"
            class="action-button"
            :icon="Edit"
          >
            修改
          </el-button>
          <el-button 
            v-else
            type="success" 
            size="large" 
            @click="clickSaveButton()"
            class="action-button"
            :icon="Check"
          >
            保存
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

  <!-- 订单选择对话框 -->
  <el-dialog
    v-model="orderDialogVisible"
    title="选择订单"
    width="900px"
    :before-close="() => orderDialogVisible = false"
  >
    <div style="margin-bottom: 20px;">
      <el-input
        v-model="orderSearchKeyword"
        placeholder="搜索订单（订单号、买家、商品名）"
        clearable
        style="width: 100%"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>
    
    <el-table
      :data="filteredOrders"
      style="width: 100%"
      max-height="400"
      @row-click="selectOrder"
      highlight-current-row
    >
      <el-table-column prop="orderName" label="订单号" width="150" />
      <el-table-column prop="userName" label="买家" width="120" />
      <el-table-column prop="goodName" label="商品名" width="150" />
      <el-table-column prop="goodQuantity" label="数量" width="80" />
      <el-table-column prop="totalAmount" label="总金额" width="100" />
      <el-table-column label="订单状态" width="100">
        <template #default="{ row }">
          <el-tag 
            :type="row.orderStatus === 'UnPaid' ? 'danger' : 
                   row.orderStatus === 'NotDispatched' ? 'warning' : 
                   row.orderStatus === 'Delivering' ? 'default' : 
                   row.orderStatus === 'Delivered' ? 'success' : 'info'"
          >
            {{ row.orderStatus === 'UnPaid' ? '待付款' : 
               row.orderStatus === 'NotDispatched' ? '待发货' : 
               row.orderStatus === 'Delivering' ? '派送中' : 
               row.orderStatus === 'Delivered' ? '已送达' : '已完成' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="下单时间" width="120" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
          <el-button
            size="small"
            type="primary"
            @click.stop="selectOrder(scope.row)"
          >
            选择
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="orderDialogVisible = false">取消</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.delivery-edit-container {
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

.delivery-id {
  font-size: 16px;
  color: #606266;
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

.form-actions {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 40px;
}

.action-button {
  width: 180px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 状态提示样式 */
.status-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.status-hint .el-icon {
  margin-right: 4px;
  vertical-align: middle;
}

/* 确保对话框内容正确显示 */
:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-table) {
  width: 100%;
}

:deep(.el-table__body-wrapper) {
  max-height: 400px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .delivery-edit-container {
    padding: 16px;
  }
}
</style>
