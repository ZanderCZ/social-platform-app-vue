<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { reactive } from 'vue'
import { onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import axios from 'axios'
import { Edit, Check, Back, Search } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const form = reactive({
  orderId: '',
  expressCompany: ''
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

const clickCreateButton = async () => {
    // 表单验证
    if (!form.orderId) {
        ElMessage.error('请选择订单');
        return;
    }
    if (!form.expressCompany) {
        ElMessage.error('请选择快递公司');
        return;
    }
    
    try {
        const response = await axios.post('http://localhost:8080/api/delivery', {
            orderId: form.orderId,
            expressCompany: form.expressCompany
        })
        console.log('Create delivery successfully', response)
        ElMessageBox.alert('创建成功', '提示', {
          confirmButtonText: 'OK',
          callback: (action) => {
            backButtonPressed()
          },
        })
    } catch (error) {
        console.log('Failed to create delivery', error);
        ElMessage.error('创建失败，请重试');
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

// 获取所有订单信息
const getAllOrders = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/order/all');
    console.log('Get all orders success', response);
    allOrders.value = response.data.data;
  } catch (error) {
    console.log('Failed to get orders', error);
    ElMessage.error('获取订单信息失败');
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

onMounted(() => {
  console.log('创建物流页面已加载');
  console.log('快递公司选项:', expressCompanyOptions.value);
});
</script>

<template>
  <div class="delivery-create-container">
    <div class="header">
      <h1 class="title">创建物流信息</h1>
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
                <el-button @click="openOrderDialog" type="primary" plain>
                  选择订单
                </el-button>
                <el-button 
                  v-if="selectedOrder" 
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
              >
                <el-option
                  v-for="company in expressCompanyOptions"
                  :key="company.value"
                  :label="company.label"
                  :value="company.value"
                />
              </el-select>
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
            创建物流
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
.delivery-create-container {
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

.divider {
  margin: 16px 0;
}

.form-container {
  padding: 0 20px;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 24px;
}

.form-section {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
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
  
  .delivery-create-container {
    padding: 16px;
  }
}
</style>