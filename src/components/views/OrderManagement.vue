<script setup>
import axios from 'axios';
import { onMounted, ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
const router = useRouter()

const numberOfOrders = ref(0);
const orderList = ref([]);         // 原始用户列表
const filteredOrderList = ref([]); // 当前用于渲染的用户列表
const currentPage = ref(1);

const getOrderCount = async () => {
    // 获取用户数量
    try {
        const response = await axios.get('http://localhost:8080/api/order/count')
        console.log('Get order count success', response);
        numberOfOrders.value = response.data.data;
    } catch (error) {
        console.log('Failed', error);
        throw error;
    }
}

const getOrderList = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/order/all')
    orderList.value = response.data.data;
    filteredOrderList.value = [...orderList.value]; // 拷贝初始数据用于渲染
  } catch (error) {
    console.log('Failed', error);
    throw error;
  }
}

onMounted(async () => {
    getOrderCount();
    getOrderList();
})

const editInfoPressed = (orderName) => {
    router.push({
        path: '/editOrderInfo',
        query: {
        userName: orderName
        }
    })
}

const deleteById = async (orderId) => {
    try {
        const response = await axios.delete('http://localhost:8080/api/order/' + orderId)
        console.log('Successfully delete order by orderId', response);
        ElMessage({
            message: '删除成功',
            type: 'success',
        })
    } catch (error) {
        console.log('Failed to delete order by orderId', error);
        throw error;
    }
}

const deleteButtonPressed = async (orderName) => {
  ElMessageBox.confirm(
    '你确定要删除该订单吗?\n此操作不可恢复',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
  .then(async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/order/byOrderName/' + orderName);
    console.log('Successfully get order by orderName', response);
    
    // 等待删除完成再刷新列表
    await deleteById(response.data.data.orderId);  
    await getOrderList();  // 这里也加上 await

    // 更新用户数量
    await getOrderCount();

    } catch (error) {
        console.log('Failed to get user by orderName or delete Order', error);
    }
  })
  .catch(() => {});
}

const pageSize = 3;
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredOrderList.value.slice(start, end);
});

var searchKey = ref('')

const querySearch = (queryString, cb) => {
    var results = queryString
        ? orderList.value.filter(createFilter(queryString)).map(order => ({
            value: order.orderName
        }))
        : orderList.value.map(order => ({
            value: order.orderName
        }));
    switch (searchKind.value) {
        case 'orderName':
            results = queryString
                ? orderList.value.filter(createFilter(queryString)).map(order => ({
                    value: order.orderName
                }))
                : orderList.value.map(order => ({
                    value: order.orderName
                }))
            cb(results)
            break
        case 'userName':
            results = queryString
                ? orderList.value.filter(createFilter(queryString)).map(order => ({
                    value: order.userName
                }))
                : orderList.value.map(order => ({
                    value: order.userName
                }))
            cb(results)
            break
        case 'orderStatus':
            results = queryString
                ? orderList.value.filter(createFilter(queryString)).map(order => ({
                    value: order.orderStatus
                }))
                : orderList.value.map(order => ({
                    value: order.orderStatus
                }))
            cb(results)
            break
        case 'paymentMethod':
            results = queryString
                ? orderList.value.filter(createFilter(queryString)).map(order => ({
                    value: order.paymentMethod
                }))
                : orderList.value.map(order => ({
                    value: order.paymentMethod
                }))
            cb(results)
            break
        case 'createTime':
            results = queryString
                ? orderList.value.filter(createFilter(queryString)).map(order => ({
                    value: order.createTime
                }))
                : orderList.value.map(order => ({
                    value: order.createTime
                }))
            cb(results)
            break
    }
}
const createFilter = (queryString) => {
  return (order) => {
    switch (searchKind.value) {
        case 'orderName':
            return (
                order.orderName.toLowerCase().indexOf(queryString.toLowerCase()) === 0
            )
        case 'userName':
            return (
                order.userName.toLowerCase().indexOf(queryString.toLowerCase()) === 0
            )
        case 'orderStatus':
            return (
                order.orderStatus.toLowerCase().indexOf(queryString.toLowerCase()) === 0
            )
        case 'paymentMethod':
            return (
                order.paymentMethod.toLowerCase().indexOf(queryString.toLowerCase()) === 0
            )
        case 'createTime':
            return (
                order.createTime.toLowerCase().indexOf(queryString.toLowerCase()) === 0
            )
    }

  }
}
const handleSelect = (item) => {
  console.log(item)
}

const searchOrderByOrderName = () => {
  filteredOrderList.value = orderList.value.filter(
    order => order.orderName === searchKey.value
  );
}
const searchOrderByUserName = () => {
    filteredOrderList.value = orderList.value.filter(
        order => order.userName === searchKey.value
    );
}
const searchOrderByOrderStatus = () => {
    filteredOrderList.value = orderList.value.filter(
        order => order.orderStatus === searchKey.value
    );
}
const searchOrderByPaymentMethod = () => {
    filteredOrderList.value = orderList.value.filter(
        order => order.paymentMethod === searchKey.value
    );
}
const searchOrderByCreateTime = () => {
    filteredOrderList.value = orderList.value.filter(
        order => order.createTime === searchKey.value
    );
}
const search = () => {
    switch (searchKind.value) {
        case 'orderName':
            searchOrderByOrderName(searchKey.value);
            break
        case 'userName':
            searchOrderByUserName(searchKey.value);
            break
        case 'createTime':
            searchOrderByCreateTime(searchKey.value);
            break
        case 'orderStatus':
            searchOrderByOrderStatus(searchKey.value);
            break
        case 'paymentMethod':
            searchOrderByPaymentMethod(searchKey.value);
            break
    }
}

const resetSearch = () => {
  filteredOrderList.value = [...orderList.value];
  searchKey.value = '';
}

const searchOptions = [
  {
    value: 'orderName',
    label: '订单号',
  },
  {
    value: 'userName',
    label: '买家',
  },
  {
    value: 'orderStatus',
    label: '订单状态',
  },
  {
    value: 'paymentMethod',
    label: '支付方式',
  },
  {
    value: 'createTime',
    label: '下单日期',
  },
]
const searchKind = ref('')

const autocompletePlaceHolder = ref('请选择筛选条件')

const updateAutoCompletePlaceHolder = () => {
    switch (searchKind.value) {
        case 'userName':
            autocompletePlaceHolder.value = '请输入买家';
            break
        case 'ordername':
            autocompletePlaceHolder.value = '请输入订单号';
            break
        case 'orderStatus':
            autocompletePlaceHolder.value = '请输入订单状态';
            break
        case 'paymentMethod':
            autocompletePlaceHolder.value = '请输入支付方式';
            break
        case 'createTime':
            autocompletePlaceHolder.value = '请输入下单日期';
            break
    }
}

</script>

<template>
    <h1>用户管理</h1>
    <el-space wrap direction="vertical">
        <el-space warp direction="horizontal">
            <el-select
                v-model="searchKind"
                placeholder="筛选条件"
                size="default"
                style="width: 100px"
                @change="updateAutoCompletePlaceHolder"
                >
                <el-option
                    v-for="item in searchOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                />
            </el-select>
            <el-autocomplete
                v-model="searchKey"
                :fetch-suggestions="querySearch"
                :trigger-on-focus="false"
                class="inline-input w-50"
                :placeholder="autocompletePlaceHolder"
                @select="handleSelect"
            />
            <el-button @click="search" type="primary">查询</el-button>
            <el-button @click="resetSearch" type="success">重置</el-button>
        </el-space>
        <div v-if="numberOfOrders == 0">
            <h1>没有订单记录</h1>
        </div>
        <div v-else>
            <el-space wrap direction="vertical">
                <div v-for="(order, index) in paginatedOrders" :key="order.orderId">
                    <el-descriptions
                        class="margin-top"
                        :column="5"
                        size="default"
                        border
                    >
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                            <el-icon></el-icon>
                            订单号
                            </div>
                        </template>
                            ORD12345678
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                            <el-icon></el-icon>
                                买家
                            </div>
                        </template>
                            admin
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                            <el-icon></el-icon>
                            商品名
                            </div>
                        </template>
                            goodName
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                            <el-icon></el-icon>
                            商品数量
                            </div>
                        </template>
                            2
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                                修改
                            </div>
                        </template>
                        <el-button type="primary" plain>修改</el-button>
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                            <el-icon></el-icon>
                                总金额
                            </div>
                        </template>
                            32.7
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                            <el-icon></el-icon>
                                订单状态
                            </div>
                        </template>
                        <el-tag size="default">Delivering</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                            <el-icon></el-icon>
                                支付方式
                            </div>
                        </template>
                            支付宝支付
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                            <el-icon></el-icon>
                                下单日期
                            </div>
                        </template>
                            2025-05-20
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                                删除
                            </div>
                        </template>
                        <el-button @click="deleteButtonPressed(order.orderName)" type="danger" plain>删除</el-button>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
                <!-- <el-pagination v-model="currentPage" layout="prev, pager, next" :total="numberOfUsers*10/5" /> -->
                <el-pagination
                    v-model:current-page="currentPage"
                    :page-size="3"
                    layout="prev, pager, next"
                    :total="filteredOrderList.length"
                    background
                />
            </el-space>
        </div>
    </el-space>
    <!-- <p>{{ userList }}</p> -->
</template>