<script setup>
import axios from 'axios';
import { onMounted, ref, computed } from 'vue';
import { ElMessage, ElMessageBox, formEmits } from 'element-plus'
import { useRouter } from 'vue-router'
const router = useRouter()

const numberOfDelivery = ref(0);
const deliveryList = ref([]);         // 原始用户列表
const filteredDeliveryList = ref([]); // 当前用于渲染的用户列表
const currentPage = ref(1);

const getDeliveryCount = async () => {
    try {
        const response = await axios.get('http://localhost:8080/api/delivery/count')
        console.log('Get delivery count success', response);
        numberOfDelivery.value = response.data.data;
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
  } catch (error) {
    console.log('Failed', error);
    throw error;
  }
}

onMounted(async () => {
    getDeliveryCount();
    getDeliveryList();
})

const editInfoPressed = (orderName) => {
    router.push({
        path: '/editOrderInfo',
        query: {
            orderName: orderName
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
    '你确定要删除该商品吗?\n此操作不可恢复',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
  .then(async () => {
  try {
    // const response = await axios.get('http://localhost:8080/api/product/byProductName/' + deliveryId);
    // console.log('Successfully get product by productName', response);
    
    // 等待删除完成再刷新列表
    await deleteById(deliveryId);  
    await getDeliveryList();  // 这里也加上 await

    // 更新用户数量
    await getDeliveryCount();

    } catch (error) {
        // console.log('Failed to get user by productName or delete Product', error);
    }
  })
  .catch(() => {});
}

const pageSize = 3;
const paginatedDeliveries = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredDeliveryList.value.slice(start, end);
});

var searchKey = ref('')

const querySearch = (queryString, cb) => {
    var results = queryString
        ? deliveryList.value.filter(createFilter(queryString)).map(product => ({
            value: product.productName
        }))
        : deliveryList.value.map(product => ({
            value: product.productName
        }));
    switch (searchKind.value) {
        case 'productName':
            results = queryString
                ? deliveryList.value.filter(createFilter(queryString)).map(product => ({
                    value: product.productName
                }))
                : deliveryList.value.map(product => ({
                    value: product.productName
                }))
            cb(results)
            break
        case 'productPrice':
            results = queryString
                ? deliveryList.value.filter(createFilter(queryString)).map(product => ({
                    value: product.productPrice
                }))
                : deliveryList.value.map(product => ({
                    value: product.productPrice
                }))
            cb(results)
            break
        case 'productStock':
            results = queryString
                ? deliveryList.value.filter(createFilter(queryString)).map(product => ({
                    value: product.productStock
                }))
                : deliveryList.value.map(product => ({
                    value: product.productStock
                }))
            cb(results)
            break
        case 'productIsOnSale':
            results = queryString
                ? deliveryList.value.filter(createFilter(queryString)).map(product => ({
                    value: product.productIsOnSale
                }))
                : deliveryList.value.map(product => ({
                    value: product.productIsOnSale
                }))
            cb(results)
            break
        case 'productCategory':
            results = queryString
                ? deliveryList.value.filter(createFilter(queryString)).map(product => ({
                    value: product.productCategory
                }))
                : deliveryList.value.map(product => ({
                    value: product.productCategory
                }))
            cb(results)
            break
    }
}
const createFilter = (queryString) => {
  return (product) => {
    const lowerQuery = queryString.toLowerCase()
    switch (searchKind.value) {
      case 'productName':
        return product.productName.toLowerCase().includes(lowerQuery)
      case 'productPrice':
        return String(product.productPrice).toLowerCase().includes(lowerQuery)
      case 'productStock':
        return String(product.productStock).toLowerCase().includes(lowerQuery)
      case 'productIsOnSale':
        const saleStatus = product.productIsOnSale ? '是' : '否'
        return saleStatus.includes(queryString)
      case 'productCategory':
        return String(product.productCategory.categoryName).toLowerCase().includes(lowerQuery)
      default:
        return false
    }
  }
}

const handleSelect = (item) => {
  console.log(item)
}

const searchProductByProductName = () => {
  filteredDeliveryList.value = deliveryList.value.filter(
    product => product.productName === searchKey.value
  );
}
const searchProductByProductPrice = () => {
    filteredDeliveryList.value = deliveryList.value.filter(
        product => product.productPrice === searchKey.value
    );
}
const searchProductByProductStock = () => {
    filteredDeliveryList.value = deliveryList.value.filter(
        product => product.productStock === searchKey.value
    );
}
const searchProductByProductIsOnSale = () => {
    filteredDeliveryList.value = deliveryList.value.filter(
        product => product.productIsOnSale === searchKey.value
    );
}
const searchProductByProductCategory = () => {
    filteredDeliveryList.value = deliveryList.value.filter(
        product => product.productCategory === searchKey.value
    );
}
const search = () => {
    if (searchKind.value == '') {
        ElMessageBox.alert('请选择筛选条件', '提示', {
          confirmButtonText: 'OK',
          callback: (action) => {},
          })
        return
    } else if (searchKey.value == '') {
        ElMessageBox.alert('检索不能为空', '提示', {
          confirmButtonText: 'OK',
          callback: (action) => {},
          })
        return
    }
    switch (searchKind.value) {
        case 'productName':
            searchProductByProductName(searchKey.value);
            break
        case 'productPrice':
            searchProductByProductPrice(searchKey.value);
            break
        case 'productCategory':
            searchProductByProductCategory(searchKey.value);
            break
        case 'productStock':
            searchProductByProductStock(searchKey.value);
            break
        case 'productIsOnSale':
            searchProductByProductIsOnSale(searchKey.value);
            break
    }
}

const resetSearch = () => {
  filteredDeliveryList.value = [...deliveryList.value];
  searchKey.value = '';
}

const searchOptions = [
  {
    value: 'productName',
    label: '商品名',
  },
  {
    value: 'productPrice',
    label: '商品单价',
  },
  {
    value: 'productCategory',
    label: '商品类别',
  },
  {
    value: 'productStock',
    label: '库存数量',
  },
  {
    value: 'productIsOnSale',
    label: '是否上架',
  },
]
const searchKind = ref('')

const autocompletePlaceHolder = ref('请选择筛选条件')

const updateAutoCompletePlaceHolder = () => {
    switch (searchKind.value) {
        case 'productName':
            autocompletePlaceHolder.value = '请输入商品名';
            break
        case 'productPrice':
            autocompletePlaceHolder.value = '请输入商品单价';
            break
        case 'productCategory':
            autocompletePlaceHolder.value = '请输入商品类别';
            break
        case 'productStock':
            autocompletePlaceHolder.value = '请输入库存数量';
            break
        case 'productIsOnSale':
            autocompletePlaceHolder.value = '请输入是否上架';
            break
    }
}
const createProduct = () => {
    router.push({
        path: '/createProduct',
    })
}

const editButtonPressed = (deliveryId) => {
    router.push({
        path: '/editDelivery',
        query: {
            deliveryId: deliveryId
        }
    })
}

const form = ref({
  orderName: '',
  userName: '',
  totalAmount: 0.0,
  orderStatus: '',
  paymentMethod: '',
  createTime: '',
  goodName: '',
  goodQuantity: 0
})
const dialog = ref(false)
const cancelForm = () => {
  dialog.value = false
}

const checkOrderInfo = (order) => {
    form.value.orderName = order.orderName
    form.value.userName = order.userName
    form.value.totalAmount = order.totalAmount
    form.value.orderStatus = order.orderStatus
    form.value.paymentMethod = order.paymentMethod
    form.value.createTime = order.createTime
    form.value.goodName = order.goodName
    form.value.goodQuantity = order.goodQuantity
    dialog.value = true
}

</script>

<template>
        <p>{{ form }}</p>
    <h1>配送管理</h1>
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
            <el-button @click="createProduct" type="warning">新增</el-button>
        </el-space>
        <div v-if="numberOfDelivery == 0">
            <h1>没有物流记录</h1>
        </div>
        <div v-else>
            <el-space wrap direction="vertical">
                <div v-for="(delivery, index) in paginatedDeliveries" :key="delivery.deliveryId">
                    <p>{{ delivery }}</p>
                    <el-descriptions
                        direction="vertical"
                        border
                        style="margin-top: 20px"
                        :column="5"
                        class="product-descriptions"
                    >
                        <el-descriptions-item
                        :rowspan="3"
                        :width="140"
                        label="承运公司"
                        align="center"
                        >
                        <el-image
                            style="width: 100px; height: 100px"
                            :src="`http://localhost:8080/uploads/userImage/${delivery.expressCompany}.jpg?t=${Date.now()}`"
                        >
                        <template #error>
                            <br><br>
                            未上传
                        </template>
                        </el-image>
                        </el-descriptions-item>
                        <el-descriptions-item label="物流号">{{ delivery.deliveryId }}</el-descriptions-item>
                        <el-descriptions-item label="承运订单">
                            {{ delivery.order.orderName }}
                            <el-button @click="checkOrderInfo(delivery.order)" type="primary" plain size="small">
                                点击查看
                            </el-button>
                        </el-descriptions-item>
                        <el-descriptions-item label="物流状态">
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
                        <el-descriptions-item label="发货日期">
                            <div v-if="delivery.shippedTime == null">
                                未发货
                            </div>
                            <div v-else>
                                {{ delivery.shippedTime }}
                            </div>
                        </el-descriptions-item>
                        <el-descriptions-item label="签收日期">
                            <div v-if="delivery.deliveredTime == null">
                                未签收
                            </div>
                            <div v-else>
                                {{ delivery.deliveredTime }}
                            </div>
                        </el-descriptions-item>
                        <el-descriptions-item label="操作">
                            <el-button type="primary" plain @click="editButtonPressed(delivery.deliveryId)">修改</el-button>
                            <el-button type="danger" plain @click="deleteButtonPressed(delivery.productName)">删除</el-button>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
                <el-pagination
                    v-model:current-page="currentPage"
                    :page-size="3"
                    layout="prev, pager, next"
                    :total="filteredDeliveryList.length"
                    background
                />
            </el-space>
        </div>
    </el-space>
    
    <el-drawer
    v-model="dialog"
    title="订单信息"
    direction="ltr"
    class="demo-drawer"
    size="22%"
    >
        <div class="demo-drawer__content">
        <el-form :model="form" size="default">
            <el-form-item label="订单号" label-width="70px">
                {{ form.orderName }}
            </el-form-item>
            <el-form-item label="买方" label-width="70px">
                {{ form.userName }}
            </el-form-item>
            <el-form-item label="商品名" label-width="70px">
                {{ form.goodName }}
            </el-form-item>
            <el-form-item label="商品数量" label-width="70px">
                {{ form.goodQuantity }}
            </el-form-item>
            <el-form-item label="总金额" label-width="70px">
                {{ form.totalAmount }}
            </el-form-item>
            <el-form-item label="下单日期" label-width="70px">
                {{ form.createTime }}
            </el-form-item>
            <el-form-item label="支付方式" label-width="70px">
                <div>
                    <div v-if="form.paymentMethod == 'AliPay'">
                        <el-tag size="default">支付宝支付</el-tag>
                    </div>
                    <div v-else-if="form.paymentMethod == 'WechatPay'">
                        <el-tag size="success">微信支付</el-tag>
                    </div>
                </div>
            </el-form-item>
            <el-form-item label="订单状态" label-width="70px">
                <div>
                    <div v-if="form.orderStatus == 'UnPaid'">
                        <el-tag size="danger">待付款</el-tag>
                    </div>
                    <div v-else-if="form.orderStatus == 'NotDispatched'">
                        <el-tag size="warning">待发货</el-tag>
                    </div>
                    <div v-else-if="form.orderStatus == 'Delivering'">
                        <el-tag size="default">派送中</el-tag>
                    </div>
                    <div v-else-if="form.orderStatus == 'Delivered'">
                        <el-tag size="success">已送达</el-tag>
                    </div>
                    <div v-else-if="form.orderStatus == 'Done'">
                        <el-tag size="info">已完成</el-tag>
                    </div>
                </div>
            </el-form-item>
        </el-form>
        <div class="demo-drawer__footer">
            <el-button type="primary" plain @click="cancelForm">返回</el-button>
        </div>
        </div>
    </el-drawer>
</template>

<style>
    .product-descriptions {
        width: 1000px;
    }
    /* .demo-drawer__content {
        width: 1000px;
    } */
    .demo-drawer__footer {
        margin-left: 50px;
    }
</style>