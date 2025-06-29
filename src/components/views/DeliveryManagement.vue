<script setup>
import axios from 'axios';
import { onMounted, ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
const router = useRouter()

const numberOfDeliveries = ref(0);
const deliveryList = ref([]);         // 原始物流列表
const filteredDeliveryList = ref([]); // 当前用于渲染的物流列表
const currentPage = ref(1);

// 多条件搜索字段
const searchConditions = ref({
    deliveryId: '',
    orderName: '',
    userName: '',
    expressCompany: ''
});

// 自动提示选项
const deliveryIdSuggestions = ref([]);
const expressCompanySuggestions = ref([]);

// 订单选择对话框相关
const orderDialogVisible = ref(false);
const allOrders = ref([]);
const selectedOrder = ref(null);
const orderSearchKeyword = ref('');

// 买家选择对话框相关
const buyerDialogVisible = ref(false);
const allBuyers = ref([]);
const selectedBuyer = ref(null);
const buyerSearchKeyword = ref('');

const getDeliveryCount = async () => {
    // 获取物流数量
    try {
        const response = await axios.get('http://localhost:8080/api/delivery/count')
        console.log('Get delivery count success', response);
        numberOfDeliveries.value = response.data.data;
    } catch (error) {
        console.log('Failed', error);
        throw error;
    }
}

const getDeliveryList = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/delivery/all')
    deliveryList.value = response.data.data;
    filteredDeliveryList.value = [...deliveryList.value]; // 拷贝初始数据用于渲染
    
    // 初始化自动提示选项
    updateSuggestions();
  } catch (error) {
    console.log('Failed', error);
    throw error;
  }
}

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

// 获取所有买家信息
const getAllBuyers = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/user/all');
    console.log('Get all buyers success', response);
    allBuyers.value = response.data.data;
  } catch (error) {
    console.log('Failed to get buyers', error);
    throw error;
  }
}

// 更新自动提示选项
const updateSuggestions = () => {
    // 物流ID提示
    const uniqueDeliveryIds = [...new Set(deliveryList.value.map(delivery => delivery.deliveryId))];
    deliveryIdSuggestions.value = uniqueDeliveryIds.map(id => ({ value: id.toString() }));
    
    // 快递公司提示
    const uniqueExpressCompanies = [...new Set(deliveryList.value.map(delivery => delivery.expressCompany))];
    expressCompanySuggestions.value = uniqueExpressCompanies.map(company => ({ value: company }));
}

// 过滤提示选项
const filterSuggestions = (queryString, suggestions) => {
    if (queryString === '') {
        return suggestions;
    }
    return suggestions.filter(item => 
        item.value.toLowerCase().includes(queryString.toLowerCase())
    );
}

// 物流ID自动提示
const queryDeliveryId = (queryString, cb) => {
    const results = filterSuggestions(queryString, deliveryIdSuggestions.value);
    cb(results);
}

// 快递公司自动提示
const queryExpressCompany = (queryString, cb) => {
    const results = filterSuggestions(queryString, expressCompanySuggestions.value);
    cb(results);
}

onMounted(async () => {
    getDeliveryCount();
    getDeliveryList();
})

const editInfoPressed = (deliveryId) => {
    router.push({
        path: '/editDelivery',
        query: {
            deliveryId: deliveryId
        }
    })
}

const deleteById = async (deliveryId) => {
    try {
        const response = await axios.delete('http://localhost:8080/api/delivery/' + deliveryId)
        console.log('Successfully delete delivery by deliveryId', response);
        ElMessage({
            message: '删除成功',
            type: 'success',
        })
    } catch (error) {
        console.log('Failed to delete delivery by deliveryId', error);
        throw error;
    }
}

const deleteButtonPressed = async (deliveryId) => {
  ElMessageBox.confirm(
    '你确定要删除该物流信息吗?\n此操作不可恢复',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
  .then(async () => {
    await deleteById(deliveryId);  
    await getDeliveryList();
    await getDeliveryCount();
  })
  .catch(() => {});
}

const pageSize = 4;
const paginatedDeliveries = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredDeliveryList.value.slice(start, end);
});

// 多条件搜索函数
const search = () => {
    // 检查是否有至少一个搜索条件
    const hasSearchCondition = Object.values(searchConditions.value).some(value => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim() !== '';
        return value !== '';
    });
    
    // 如果没有搜索条件，直接返回，不进行搜索
    if (!hasSearchCondition) {
        return;
    }

    filteredDeliveryList.value = deliveryList.value.filter(delivery => {
        // 物流ID搜索
        if (searchConditions.value.deliveryId && 
            !delivery.deliveryId.toString().includes(searchConditions.value.deliveryId)) {
            return false;
        }
        
        // 订单号搜索
        if (searchConditions.value.orderName && 
            !delivery.order.orderName.toLowerCase().includes(searchConditions.value.orderName.toLowerCase())) {
            return false;
        }
        
        // 买家搜索
        if (searchConditions.value.userName && 
            !delivery.order.userName.toLowerCase().includes(searchConditions.value.userName.toLowerCase())) {
            return false;
        }
        
        // 快递公司搜索
        if (searchConditions.value.expressCompany && 
            !delivery.expressCompany.toLowerCase().includes(searchConditions.value.expressCompany.toLowerCase())) {
            return false;
        }
        
        return true;
    });
    
    // 重置分页到第一页
    currentPage.value = 1;
}

const resetSearch = () => {
  filteredDeliveryList.value = [...deliveryList.value];
  // 清空所有搜索条件
  searchConditions.value = {
      deliveryId: '',
      orderName: '',
      userName: '',
      expressCompany: ''
  };
  currentPage.value = 1;
}

const createDelivery = () => {
    router.push({
        path: '/createDelivery'
    })
}

const dialogVisible = ref(false)
const currentOrder = ref(null)
const currentBuyer = ref(null)
const activeDialog = ref('')

const checkOrderInfo = async (orderName) => {
    try {
        const response = await axios.get('http://localhost:8080/api/order/byOrderName/' + encodeURIComponent(orderName))
        console.log('Successfully get order by orderName', response);
        currentOrder.value = response.data.data;
        activeDialog.value = 'order';
        dialogVisible.value = true;
    } catch (error) {
        console.log('Failed to get order by orderName', error);
        ElMessage({
            message: '获取订单信息失败',
            type: 'error',
        })
    }
}

const checkBuyerInfo = async (userName) => {
    try {
        const response = await axios.get('http://localhost:8080/api/user/byUserName/' + encodeURIComponent(userName))
        console.log('Successfully get buyer by userName', response);
        currentBuyer.value = response.data.data;
        activeDialog.value = 'buyer';
        dialogVisible.value = true;
    } catch (error) {
        console.log('Failed to get buyer by userName', error);
        ElMessage({
            message: '获取买家信息失败',
            type: 'error',
        })
    }
}

const showOrderDialog = (delivery) => {
    if (delivery.order && delivery.order.orderName) {
        checkOrderInfo(delivery.order.orderName);
    } else {
        ElMessage({
            message: '该物流没有订单信息',
            type: 'warning',
        })
    }
}

const showBuyerDialog = (delivery) => {
    if (delivery.order && delivery.order.userName) {
        checkBuyerInfo(delivery.order.userName);
    } else {
        ElMessage({
            message: '该物流没有买家信息',
            type: 'warning',
        })
    }
}

const formatTime = (time) => {
    return time || '未记录';
}

// 打开订单选择对话框
const openOrderDialog = () => {
  orderDialogVisible.value = true;
  getAllOrders();
}

// 打开买家选择对话框
const openBuyerDialog = () => {
  buyerDialogVisible.value = true;
  getAllBuyers();
}

// 选择订单
const selectOrder = (order) => {
  selectedOrder.value = order;
  searchConditions.value.orderName = order.orderName;
  orderDialogVisible.value = false;
}

// 选择买家
const selectBuyer = (buyer) => {
  selectedBuyer.value = buyer;
  searchConditions.value.userName = buyer.userName;
  buyerDialogVisible.value = false;
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

// 过滤买家列表
const filteredBuyers = computed(() => {
  if (!buyerSearchKeyword.value) {
    return allBuyers.value;
  }
  return allBuyers.value.filter(buyer => 
    buyer.userName.toLowerCase().includes(buyerSearchKeyword.value.toLowerCase()) ||
    buyer.phone.includes(buyerSearchKeyword.value) ||
    buyer.email.toLowerCase().includes(buyerSearchKeyword.value.toLowerCase())
  );
});

</script>

<template>
    <h1>物流管理</h1>
    <el-space wrap direction="vertical">
        <!-- 多条件搜索区域 -->
        <el-card class="search-card">
            <template #header>
                <div class="card-header">
                    <span>搜索条件</span>
                </div>
            </template>
            <el-form :model="searchConditions" label-width="80px" inline>
                <el-form-item label="物流ID">
                    <el-autocomplete
                        v-model="searchConditions.deliveryId"
                        :fetch-suggestions="queryDeliveryId"
                        placeholder="请输入物流ID"
                        clearable
                        style="width: 200px"
                        :trigger-on-focus="false"
                    />
                </el-form-item>
                <el-form-item label="订单号">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <el-input
                            v-model="searchConditions.orderName"
                            placeholder="已选择的订单"
                            readonly
                            style="width: 150px"
                        />
                        <el-button @click="openOrderDialog" type="primary" plain>
                            选择订单
                        </el-button>
                        <el-button 
                            v-if="searchConditions.orderName" 
                            @click="searchConditions.orderName = ''" 
                            type="danger" 
                            plain
                        >
                            清空
                        </el-button>
                    </div>
                </el-form-item>
                <el-form-item label="买家">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <el-input
                            v-model="searchConditions.userName"
                            placeholder="已选择的买家"
                            readonly
                            style="width: 150px"
                        />
                        <el-button @click="openBuyerDialog" type="primary" plain>
                            选择买家
                        </el-button>
                        <el-button 
                            v-if="searchConditions.userName" 
                            @click="searchConditions.userName = ''" 
                            type="danger" 
                            plain
                        >
                            清空
                        </el-button>
                    </div>
                </el-form-item>
                <el-form-item label="快递公司">
                    <el-autocomplete
                        v-model="searchConditions.expressCompany"
                        :fetch-suggestions="queryExpressCompany"
                        placeholder="请输入快递公司"
                        clearable
                        style="width: 200px"
                        :trigger-on-focus="false"
                    />
                </el-form-item>
                <el-form-item>
                    <el-button @click="search" type="primary">查询</el-button>
                    <el-button @click="resetSearch" type="success">重置</el-button>
                    <el-button @click="createDelivery()" type="warning">新增</el-button>
                </el-form-item>
            </el-form>
        </el-card>
        
        <div v-if="numberOfDeliveries == 0">
            <h1>没有物流记录</h1>
        </div>
        <div v-else>
            <el-space wrap direction="vertical">
                <div v-for="(delivery, index) in paginatedDeliveries" :key="delivery.deliveryId">
                    <!-- <p>{{ delivery }}</p> -->
                    <el-descriptions
                        class="delivery-descriptions"
                        :column="4"
                        size="default"
                        border
                    >
                        <el-descriptions-item>
                            <template #label>
                                <div class="cell-item">
                                    <el-icon></el-icon>
                                    物流ID
                                </div>
                            </template>
                            {{ delivery.deliveryId }}
                        </el-descriptions-item>
                        <el-descriptions-item>
                            <template #label>
                                <div class="cell-item">
                                    <el-icon></el-icon>
                                    订单号
                                </div>
                            </template>
                            {{ delivery.order.orderName }}
                        </el-descriptions-item>
                        <el-descriptions-item>
                            <template #label>
                                <div class="cell-item">
                                    <el-icon></el-icon>
                                    买家
                                </div>
                            </template>
                            {{ delivery.order.userName }}
                        </el-descriptions-item>
                        <el-descriptions-item>
                            <template #label>
                                <div class="cell-item">
                                    <el-icon></el-icon>
                                    快递公司
                                </div>
                            </template>
                            {{ delivery.expressCompany }}
                        </el-descriptions-item>
                        <el-descriptions-item>
                            <template #label>
                                <div class="cell-item">
                                    <el-icon></el-icon>
                                    发货时间
                                </div>
                            </template>
                            {{ formatTime(delivery.shippedTime) }}
                        </el-descriptions-item>
                        <el-descriptions-item>
                            <template #label>
                                <div class="cell-item">
                                    <el-icon></el-icon>
                                    送达时间
                                </div>
                            </template>
                            {{ formatTime(delivery.deliveredTime) }}
                        </el-descriptions-item>
                        <el-descriptions-item>
                            <template #label>
                                <div class="cell-item">
                                    <el-icon></el-icon>
                                    商品信息
                                </div>
                            </template>
                            {{ delivery.order.goodName }} × {{ delivery.order.goodQuantity }}
                        </el-descriptions-item>
                        <el-descriptions-item>
                            <template #label>
                                <div class="cell-item">
                                    <el-icon></el-icon>
                                    订单状态
                                </div>
                            </template>
                            <div>
                                <div v-if="delivery.order.orderStatus == 'UnPaid'">
                                    <el-tag size="danger">待付款</el-tag>
                                </div>
                                <div v-else-if="delivery.order.orderStatus == 'NotDispatched'">
                                    <el-tag size="warning">待发货</el-tag>
                                </div>
                                <div v-else-if="delivery.order.orderStatus == 'Delivering'">
                                    <el-tag size="default">派送中</el-tag>
                                </div>
                                <div v-else-if="delivery.order.orderStatus == 'Delivered'">
                                    <el-tag size="success">已送达</el-tag>
                                </div>
                                <div v-else-if="delivery.order.orderStatus == 'Done'">
                                    <el-tag size="info">已完成</el-tag>
                                </div>
                            </div>
                        </el-descriptions-item>
                        <el-descriptions-item>
                            <template #label>
                                <div class="cell-item">
                                    <el-icon></el-icon>
                                    操作
                                </div>
                            </template>
                            <el-button @click="showOrderDialog(delivery)" type="success" plain>查看订单</el-button>
                            <el-button @click="showBuyerDialog(delivery)" type="success" plain>查看买家</el-button>
                            <el-button @click="editInfoPressed(delivery.deliveryId)" type="primary" plain>修改</el-button>
                            <el-button @click="deleteButtonPressed(delivery.deliveryId)" type="danger" plain>删除</el-button>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
                <el-pagination
                    v-model:current-page="currentPage"
                    :page-size="pageSize"
                    layout="prev, pager, next"
                    :total="filteredDeliveryList.length"
                    background
                />
            </el-space>
        </div>
    </el-space>

    <!-- 订单选择对话框 -->
    <el-dialog 
        title="选择订单" 
        v-model="orderDialogVisible" 
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
                    <el-icon><search /></el-icon>
                </template>
            </el-input>
        </div>
        
        <div style="max-height: 400px; overflow-y: auto;">
            <el-table 
                :data="filteredOrders" 
                style="width: 100%"
                @row-click="selectOrder"
                :row-class-name="() => 'clickable-row'"
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
                    <template #default="{ row }">
                        <el-button 
                            @click.stop="selectOrder(row)" 
                            type="primary" 
                            size="small"
                        >
                            选择
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
        
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="orderDialogVisible = false">取消</el-button>
            </div>
        </template>
    </el-dialog>
    
    <!-- 买家选择对话框 -->
    <el-dialog 
        title="选择买家" 
        v-model="buyerDialogVisible" 
        width="800px"
        :before-close="() => buyerDialogVisible = false"
    >
        <div style="margin-bottom: 20px;">
            <el-input
                v-model="buyerSearchKeyword"
                placeholder="搜索买家（用户名、手机号、邮箱）"
                clearable
                style="width: 100%"
            >
                <template #prefix>
                    <el-icon><search /></el-icon>
                </template>
            </el-input>
        </div>
        
        <div style="max-height: 400px; overflow-y: auto;">
            <el-table 
                :data="filteredBuyers" 
                style="width: 100%"
                @row-click="selectBuyer"
                :row-class-name="() => 'clickable-row'"
            >
                <el-table-column prop="userName" label="用户名" width="120" />
                <el-table-column prop="phone" label="手机号" width="130" />
                <el-table-column prop="email" label="邮箱" width="180" />
                <el-table-column prop="region" label="地区" width="100" />
                <el-table-column label="性别" width="80">
                    <template #default="{ row }">
                        <span v-if="row.gender === 'male'">男</span>
                        <span v-else-if="row.gender === 'female'">女</span>
                        <span v-else>未知</span>
                    </template>
                </el-table-column>
                <el-table-column prop="birthday" label="生日" width="100" />
                <el-table-column label="操作" width="100" fixed="right">
                    <template #default="{ row }">
                        <el-button 
                            @click.stop="selectBuyer(row)" 
                            type="primary" 
                            size="small"
                        >
                            选择
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
        
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="buyerDialogVisible = false">取消</el-button>
            </div>
        </template>
    </el-dialog>
    
    <!-- 订单和买家详情对话框 -->
    <el-dialog 
        v-model="dialogVisible"
        :title="activeDialog === 'order' ? '订单详情' : '买家信息'"
        width="500"
    >
        <div v-if="activeDialog === 'order' && currentOrder">
            <el-descriptions :column="1" border>
                <el-descriptions-item label="订单号">{{ currentOrder.orderName }}</el-descriptions-item>
                <el-descriptions-item label="买家">{{ currentOrder.userName }}</el-descriptions-item>
                <el-descriptions-item label="商品名">{{ currentOrder.goodName }}</el-descriptions-item>
                <el-descriptions-item label="商品数量">{{ currentOrder.goodQuantity }}</el-descriptions-item>
                <el-descriptions-item label="总金额">{{ currentOrder.totalAmount }}元</el-descriptions-item>
                <el-descriptions-item label="订单状态">
                    <el-tag 
                        :type="currentOrder.orderStatus === 'UnPaid' ? 'danger' : 
                               currentOrder.orderStatus === 'NotDispatched' ? 'warning' : 
                               currentOrder.orderStatus === 'Delivering' ? 'default' : 
                               currentOrder.orderStatus === 'Delivered' ? 'success' : 'info'"
                    >
                        {{ currentOrder.orderStatus === 'UnPaid' ? '待付款' : 
                           currentOrder.orderStatus === 'NotDispatched' ? '待发货' : 
                           currentOrder.orderStatus === 'Delivering' ? '派送中' : 
                           currentOrder.orderStatus === 'Delivered' ? '已送达' : '已完成' }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="支付方式">
                    <el-tag :type="currentOrder.paymentMethod === 'AliPay' ? 'default' : 'success'">
                        {{ currentOrder.paymentMethod === 'AliPay' ? '支付宝支付' : '微信支付' }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="下单时间">{{ currentOrder.createTime }}</el-descriptions-item>
            </el-descriptions>
        </div>
        
        <div v-else-if="activeDialog === 'buyer' && currentBuyer">
            <el-descriptions :column="1" border>
                <el-descriptions-item label="用户ID">{{ currentBuyer.userId }}</el-descriptions-item>
                <el-descriptions-item label="用户名">{{ currentBuyer.userName }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">
                    <el-link type="primary" :href="'mailto:' + currentBuyer.email">
                        {{ currentBuyer.email }}
                    </el-link>
                </el-descriptions-item>
                <el-descriptions-item label="性别">
                    <el-tag :type="currentBuyer.gender === 'male' ? 'primary' : (currentBuyer.gender === 'female' ? 'danger' : 'info')">
                        {{ currentBuyer.gender === 'male' ? '男' : currentBuyer.gender === 'female' ? '女' : '未知' }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="生日">{{ currentBuyer.birthday || '未设置' }}</el-descriptions-item>
                <el-descriptions-item label="手机号">
                    <el-link type="primary" :href="'tel:' + currentBuyer.phone">
                        {{ currentBuyer.phone }}
                    </el-link>
                </el-descriptions-item>
                <el-descriptions-item label="地区">{{ currentBuyer.region || '未设置' }}</el-descriptions-item>
                <el-descriptions-item label="角色">
                    <el-tag :type="currentBuyer.role ? 'success' : 'warning'">
                        {{ currentBuyer.role || '普通用户' }}
                    </el-tag>
                </el-descriptions-item>
            </el-descriptions>
            <div style="margin-top: 20px; text-align: center;">
                <el-image 
                    style="width: 200px; height: 200px"
                    :src="`http://localhost:8080/uploads/userImage/${currentBuyer.userName}.jpg`" 
                    fit="contain"
                />
            </div>
        </div>
        
        <div v-else>
            正在加载信息...
        </div>
        
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="dialogVisible = false">关闭</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<style>
    .delivery-descriptions {
        width: 1000px;
    }
    
    .search-card {
        width: 100%;
        margin-bottom: 20px;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .clickable-row {
        cursor: pointer;
    }
    
    .clickable-row:hover {
        background-color: #f5f7fa;
    }
    
    .dialog-footer {
        text-align: right;
    }
</style>