<script setup>
import axios from 'axios';
import { onMounted, ref, computed, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
const router = useRouter()

const numberOfOrders = ref(0);
const orderList = ref([]);         // 原始订单列表
const filteredOrderList = ref([]); // 当前用于渲染的订单列表
const currentPage = ref(1);

// 多条件搜索字段
const searchConditions = ref({
    orderName: '',
    userName: '',
    goodName: '',
    orderStatus: '',
    paymentMethod: '',
    createTimeStart: '',
    createTimeEnd: ''
});

// 自动提示选项
const orderNameSuggestions = ref([]);

// 买家选项
const buyerOptions = ref([]);

// 买家选择对话框相关
const buyerDialogVisible = ref(false);
const allBuyers = ref([]);
const selectedBuyer = ref(null);
const buyerSearchKeyword = ref('');

// 多条件查询相关
const buyerSearchForm = reactive({
  userName: '',
  phone: '',
  email: '',
  region: '',
  createTimeRange: [],
  isAdvancedSearch: false
});

// 地区选项
const regionOptions = ref([]);

// 商品分类选择对话框相关
const categoryDialogVisible = ref(false);
const allCategories = ref([]);
const selectedCategory = ref(null);
const categorySearchKeyword = ref('');

// 商品选择对话框相关
const productDialogVisible = ref(false);
const allProducts = ref([]);
const selectedProduct = ref(null);
const productSearchKeyword = ref('');

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
    
    // 初始化自动提示选项
    updateSuggestions();
  } catch (error) {
    console.log('Failed', error);
    throw error;
  }
}

// 更新自动提示选项
const updateSuggestions = () => {
    // 订单号提示
    const uniqueOrderNames = [...new Set(orderList.value.map(order => order.orderName))];
    orderNameSuggestions.value = uniqueOrderNames.map(name => ({ value: name }));
    
    // 买家提示
    const uniqueUserNames = [...new Set(orderList.value.map(order => order.userName))];
    buyerOptions.value = uniqueUserNames.map(name => ({ value: name }));
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

// 订单号自动提示
const queryOrderName = (queryString, cb) => {
    const results = filterSuggestions(queryString, orderNameSuggestions.value);
    cb(results);
}

onMounted(async () => {
    getOrderCount();
    getOrderList();
})

const editInfoPressed = (orderName) => {
    router.push({
        path: '/editOrderInfo',
        query: {
            orderName: orderName
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
        console.log('Failed to get order by orderName or delete Order', error);
    }
  })
  .catch(() => {});
}

const pageSize = 4;
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredOrderList.value.slice(start, end);
});

// 多条件搜索函数
const search = async () => {
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

    // 如果有商品分类搜索条件，需要先获取所有商品的分类信息
    let productCategoryMap = new Map();
    if (searchConditions.value.goodName) {
        try {
            const response = await axios.get('http://localhost:8080/api/product/all');
            const products = response.data.data;
            products.forEach(product => {
                if (product.productCategory) {
                    productCategoryMap.set(product.productName, product.productCategory.categoryName);
                }
            });
        } catch (error) {
            console.log('Failed to get product categories', error);
        }
    }

    filteredOrderList.value = orderList.value.filter(order => {
        // 订单号搜索
        if (searchConditions.value.orderName && 
            !order.orderName.toLowerCase().includes(searchConditions.value.orderName.toLowerCase())) {
            return false;
        }
        
        // 买家搜索
        if (searchConditions.value.userName && 
            !order.userName.toLowerCase().includes(searchConditions.value.userName.toLowerCase())) {
            return false;
        }
        
        // 商品名称搜索
        if (searchConditions.value.goodName && 
            !order.goodName.toLowerCase().includes(searchConditions.value.goodName.toLowerCase())) {
            return false;
        }
        
        // 订单状态搜索
        if (searchConditions.value.orderStatus) {
            const orderStatusText = getOrderStatusText(order.orderStatus);
            if (!orderStatusText.includes(searchConditions.value.orderStatus)) {
                return false;
            }
        }
        
        // 支付方式搜索
        if (searchConditions.value.paymentMethod) {
            const paymentMethodText = getPaymentMethodText(order.paymentMethod);
            if (!paymentMethodText.includes(searchConditions.value.paymentMethod)) {
                return false;
            }
        }
        
        // 创建时间范围搜索
        if (searchConditions.value.createTimeStart || searchConditions.value.createTimeEnd) {
            const orderDate = order.createTime;
            if (searchConditions.value.createTimeStart) {
                if (orderDate < searchConditions.value.createTimeStart) {
                    return false;
                }
            }
            if (searchConditions.value.createTimeEnd) {
                if (orderDate > searchConditions.value.createTimeEnd) {
                    return false;
                }
            }
        }
        
        return true;
    });
    
    // 重置分页到第一页
    currentPage.value = 1;
}

const resetSearch = () => {
  filteredOrderList.value = [...orderList.value];
  // 清空所有搜索条件
  searchConditions.value = {
      orderName: '',
      userName: '',
      goodName: '',
      orderStatus: '',
      paymentMethod: '',
      createTimeStart: '',
      createTimeEnd: ''
  };
  currentPage.value = 1;
}

const createOrder = () => {
    router.push({
        path: '/createOrder'
    })
}

const dialogVisible = ref(false)
const currentProduct = ref(null)
const currentBuyer = ref(null) // 新增：存储当前查看的买家信息
const activeDialog = ref('')   // 新增：标识当前打开的对话框类型

// 修改后的 checkProductInfo 函数
const checkProductInfo = async (productName) => {
    try {
        const response = await axios.get('http://localhost:8080/api/product/byProductName/' + encodeURIComponent(productName))
        console.log('Successfully get product by productName', response);
        currentProduct.value = response.data.data;
        activeDialog.value = 'product';
        dialogVisible.value = true;
    } catch (error) {
        console.log('Failed to get product by productName', error);
        ElMessage({
            message: '获取商品信息失败',
            type: 'error',
        })
    }
}

// 修改后的 checkBuyerInfo 函数
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

// 修改后的显示商品对话框函数
const showProductDialog = (order) => {
    if (order.goodName) {
        checkProductInfo(order.goodName);
    } else {
        ElMessage({
            message: '该订单没有商品名称信息',
            type: 'warning',
        })
    }
}

// 新增：显示买家对话框函数
const showBuyerDialog = (order) => {
    if (order.userName) {
        checkBuyerInfo(order.userName);
    } else {
        ElMessage({
            message: '该订单没有买家信息',
            type: 'warning',
        })
    }
}

// 获取所有买家信息
const getAllBuyers = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/user/all');
    console.log('Get all buyers success', response);
    allBuyers.value = response.data.data;
    
    // 提取地区选项
    const regions = [...new Set(allBuyers.value.map(buyer => buyer.region).filter(region => region))];
    regionOptions.value = regions.map(region => ({ label: region, value: region }));
  } catch (error) {
    console.log('Failed to get buyers', error);
    throw error;
  }
}

// 重置买家搜索条件
const resetBuyerSearch = () => {
  buyerSearchForm.userName = '';
  buyerSearchForm.phone = '';
  buyerSearchForm.email = '';
  buyerSearchForm.region = '';
  buyerSearchForm.createTimeRange = [];
  buyerSearchKeyword.value = '';
}

// 切换高级搜索模式
const toggleAdvancedSearch = () => {
  buyerSearchForm.isAdvancedSearch = !buyerSearchForm.isAdvancedSearch;
  if (!buyerSearchForm.isAdvancedSearch) {
    resetBuyerSearch();
  }
}

// 分类数据转换为树形结构
function categoryListToTree(list) {
  const categoryMap = new Map();
  const rootCategories = [];

  // 首先创建所有分类的映射
  list.forEach(category => {
    categoryMap.set(category.categoryId, {
      ...category,
      value: category.categoryId,
      label: category.categoryName,
      children: []
    });
  });

  // 构建父子关系
  list.forEach(category => {
    const node = categoryMap.get(category.categoryId);
    
    if (category.categoryParentId === 0) {
      // 根分类
      rootCategories.push(node);
    } else {
      // 子分类
      const parent = categoryMap.get(category.categoryParentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return rootCategories;
}

// 获取所有商品分类信息
const getAllCategories = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/category/all');
    // 转换为树形结构
    allCategories.value = categoryListToTree(response.data.data);
  } catch (error) {
    console.log('Failed to get categories', error);
    throw error;
  }
}

// 获取所有商品信息
const getAllProducts = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/product/all');
    console.log('Get all products success', response);
    allProducts.value = response.data.data;
  } catch (error) {
    console.log('Failed to get products', error);
    throw error;
  }
}

// 打开买家选择对话框
const openBuyerDialog = () => {
  buyerDialogVisible.value = true;
  getAllBuyers();
}

// 打开商品选择对话框
const openProductDialog = () => {
  productDialogVisible.value = true;
  getAllProducts();
  getAllCategories();
}

// 选择买家
const selectBuyer = (buyer) => {
  selectedBuyer.value = buyer;
  searchConditions.value.userName = buyer.userName;
  buyerDialogVisible.value = false;
}

// 选择商品
const selectProduct = (product) => {
  selectedProduct.value = product;
  searchConditions.value.goodName = product.productName;
  productDialogVisible.value = false;
}

// 过滤买家列表
const filteredBuyers = computed(() => {
  let list = allBuyers.value;
  
  // 简单搜索模式
  if (!buyerSearchForm.isAdvancedSearch && buyerSearchKeyword.value) {
    const keyword = buyerSearchKeyword.value.toLowerCase();
    list = list.filter(buyer => 
      buyer.userName.toLowerCase().includes(keyword) ||
      buyer.phone.includes(keyword) ||
      buyer.email.toLowerCase().includes(keyword) ||
      (buyer.region && buyer.region.toLowerCase().includes(keyword))
    );
  }
  
  // 高级搜索模式
  if (buyerSearchForm.isAdvancedSearch) {
    // 用户名搜索
    if (buyerSearchForm.userName) {
      list = list.filter(buyer => 
        buyer.userName.toLowerCase().includes(buyerSearchForm.userName.toLowerCase())
      );
    }
    
    // 手机号搜索
    if (buyerSearchForm.phone) {
      list = list.filter(buyer => 
        buyer.phone.includes(buyerSearchForm.phone)
      );
    }
    
    // 邮箱搜索
    if (buyerSearchForm.email) {
      list = list.filter(buyer => 
        buyer.email.toLowerCase().includes(buyerSearchForm.email.toLowerCase())
      );
    }
    
    // 地区筛选
    if (buyerSearchForm.region) {
      list = list.filter(buyer => 
        buyer.region === buyerSearchForm.region
      );
    }
    
    // 注册时间范围筛选
    if (buyerSearchForm.createTimeRange && buyerSearchForm.createTimeRange.length === 2) {
      const startDate = new Date(buyerSearchForm.createTimeRange[0]);
      const endDate = new Date(buyerSearchForm.createTimeRange[1]);
      endDate.setHours(23, 59, 59, 999); // 设置为当天结束时间
      
      list = list.filter(buyer => {
        const createTime = new Date(buyer.createTime);
        return createTime >= startDate && createTime <= endDate;
      });
    }
  }
  
  return list;
});

// 过滤商品分类列表
const filteredCategories = computed(() => {
  if (!categorySearchKeyword.value) {
    return allCategories.value;
  }
  return allCategories.value.filter(category => 
    category.categoryName.toLowerCase().includes(categorySearchKeyword.value.toLowerCase()) ||
    (category.categoryDescription && category.categoryDescription.toLowerCase().includes(categorySearchKeyword.value.toLowerCase()))
  );
});

// 过滤商品列表
const filteredProducts = computed(() => {
  let list = allProducts.value;
  if (selectedCategory.value) {
    list = list.filter(product => product.productCategory && product.productCategory.categoryId === selectedCategory.value);
  }
  if (productSearchKeyword.value) {
    const kw = productSearchKeyword.value.toLowerCase();
    list = list.filter(product =>
      product.productName.toLowerCase().includes(kw) ||
      (product.productDescription && product.productDescription.toLowerCase().includes(kw)) ||
      (product.productCategory && product.productCategory.categoryName.toLowerCase().includes(kw))
    );
  }
  return list;
});

// 订单状态转换函数
const getOrderStatusText = (status) => {
  const statusMap = {
    'UnPaid': '待付款',
    'NotDispatched': '待发货',
    'Delivering': '派送中',
    'Delivered': '已送达',
    'Done': '已完成'
  };
  return statusMap[status] || status;
}

// 支付方式转换函数
const getPaymentMethodText = (method) => {
  const methodMap = {
    'AliPay': '支付宝支付',
    'WechatPay': '微信支付'
  };
  return methodMap[method] || method;
}

</script>

<template>
    <h1>订单管理</h1>
    <el-space wrap direction="vertical">
        <!-- 多条件搜索区域 -->
        <el-card class="search-card">
            <template #header>
                <div class="card-header">
                    <span>搜索条件</span>
                </div>
            </template>
            <el-form :model="searchConditions" label-width="80px" inline>
                <el-form-item label="订单号">
                    <el-autocomplete
                        v-model="searchConditions.orderName"
                        :fetch-suggestions="queryOrderName"
                        placeholder="请输入订单号"
                        clearable
                        style="width: 200px"
                        :trigger-on-focus="false"
                    />
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
                <el-form-item label="商品名称">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <el-input
                            v-model="searchConditions.goodName"
                            placeholder="已选择的商品名称"
                            readonly
                            style="width: 150px"
                        />
                        <el-button @click="openProductDialog" type="primary" plain>
                            选择商品
                        </el-button>
                        <el-button 
                            v-if="searchConditions.goodName" 
                            @click="searchConditions.goodName = ''" 
                            type="danger" 
                            plain
                        >
                            清空
                        </el-button>
                    </div>
                </el-form-item>
                <el-form-item label="订单状态">
                    <el-select 
                        v-model="searchConditions.orderStatus"
                        placeholder="请选择订单状态"
                        clearable
                        style="width: 200px"
                    >
                        <el-option label="待付款" value="待付款" />
                        <el-option label="待发货" value="待发货" />
                        <el-option label="派送中" value="派送中" />
                        <el-option label="已送达" value="已送达" />
                        <el-option label="已完成" value="已完成" />
                    </el-select>
                </el-form-item>
                <el-form-item label="支付方式">
                    <el-select 
                        v-model="searchConditions.paymentMethod"
                        placeholder="请选择支付方式"
                        clearable
                        style="width: 200px"
                    >
                        <el-option label="支付宝支付" value="支付宝支付" />
                        <el-option label="微信支付" value="微信支付" />
                    </el-select>
                </el-form-item>
                <el-form-item label="下单日期">
                    <el-date-picker
                        v-model="searchConditions.createTimeStart"
                        type="date"
                        placeholder="开始日期"
                        style="width: 200px"
                        value-format="YYYY-MM-DD"
                    />
                    <el-date-picker
                        v-model="searchConditions.createTimeEnd"
                        type="date"
                        placeholder="结束日期"
                        style="width: 200px"
                        value-format="YYYY-MM-DD"
                    />
                </el-form-item>
                <el-form-item>
                    <el-button @click="search" type="primary">查询</el-button>
                    <el-button @click="resetSearch" type="success">重置</el-button>
                    <el-button @click="createOrder()" type="warning">新增</el-button>
                </el-form-item>
            </el-form>
        </el-card>
        
        <div v-if="numberOfOrders == 0">
            <h1>没有订单记录</h1>
        </div>
        <div v-else>
            <el-space wrap direction="vertical">
                <div v-for="(order, index) in paginatedOrders" :key="order.orderId">
                    <!-- <p>{{ order }}</p> -->
                    <el-descriptions
                        class="order-descriptions"
                        :column="4"
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
                            {{ order.orderName }}
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                            <el-icon></el-icon>
                                买家
                            </div>
                        </template>
                            {{ order.userName }}
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                            <el-icon></el-icon>
                            商品名
                            </div>
                        </template>
                            {{ order.goodName }}
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                            <el-icon></el-icon>
                            商品数量
                            </div>
                        </template>
                            {{ order.goodQuantity }}
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                            <el-icon></el-icon>
                                总金额
                            </div>
                        </template>
                            {{ order.totalAmount }}
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                            <el-icon></el-icon>
                                订单状态
                            </div>
                        </template>
                        <div>
                            <div v-if="order.orderStatus == 'UnPaid'">
                                <el-tag size="danger">待付款</el-tag>
                            </div>
                            <div v-else-if="order.orderStatus == 'NotDispatched'">
                                <el-tag size="warning">待发货</el-tag>
                            </div>
                            <div v-else-if="order.orderStatus == 'Delivering'">
                                <el-tag size="default">派送中</el-tag>
                            </div>
                            <div v-else-if="order.orderStatus == 'Delivered'">
                                <el-tag size="success">已送达</el-tag>
                            </div>
                            <div v-else-if="order.orderStatus == 'Done'">
                                <el-tag size="info">已完成</el-tag>
                            </div>
                        </div>
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                            <el-icon></el-icon>
                                支付方式
                            </div>
                        </template>
                        <div>
                            <div v-if="order.paymentMethod == 'AliPay'">
                                <el-tag size="default">支付宝支付</el-tag>
                            </div>
                            <div v-else-if="order.paymentMethod == 'WechatPay'">
                                <el-tag size="success">微信支付</el-tag>
                            </div>
                        </div>
                        </el-descriptions-item>
                        <el-descriptions-item>
                        <template #label>
                            <div class="cell-item">
                            <el-icon></el-icon>
                                下单日期
                            </div>
                        </template>
                            {{ order.createTime }}
                        </el-descriptions-item>
                        <el-descriptions-item>
                            <template #label>
                                <div class="cell-item">
                                    <el-icon></el-icon>
                                    操作
                                </div>
                            </template>
                            <el-button @click="showProductDialog(order)" type="success" plain>查看商品</el-button>
                            <el-button @click="showBuyerDialog(order)" type="success" plain>查看买家</el-button>
                            <el-button @click="editInfoPressed(order.orderName)" type="primary" plain>修改</el-button>
                            <el-button @click="deleteButtonPressed(order.orderName)" type="danger" plain>删除</el-button>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
                <!-- <el-pagination v-model="currentPage" layout="prev, pager, next" :total="numberOfUsers*10/5" /> -->
                <el-pagination
                    v-model:current-page="currentPage"
                    :page-size="pageSize"
                    layout="prev, pager, next"
                    :total="filteredOrderList.length"
                    background
                />
            </el-space>
        </div>
    </el-space>
    
    <!-- 买家选择对话框 -->
    <el-dialog 
        title="选择买家" 
        v-model="buyerDialogVisible" 
        width="1000px"
        :before-close="() => buyerDialogVisible = false"
    >
        <!-- 搜索区域 -->
        <div style="margin-bottom: 20px;">
            <!-- 简单搜索模式 -->
            <div v-if="!buyerSearchForm.isAdvancedSearch" style="display: flex; gap: 16px; align-items: center;">
                <el-input
                    v-model="buyerSearchKeyword"
                    placeholder="快速搜索（用户名、手机号、邮箱、地区）"
                    clearable
                    style="flex: 1"
                >
                    <template #prefix>
                        <el-icon><Search /></el-icon>
                    </template>
                </el-input>
                <el-button @click="toggleAdvancedSearch" type="primary" plain>
                    高级搜索
                </el-button>
            </div>
            
            <!-- 高级搜索模式 -->
            <div v-if="buyerSearchForm.isAdvancedSearch">
                <el-form :model="buyerSearchForm" label-width="80px" inline>
                    <el-form-item label="用户名">
                        <el-input
                            v-model="buyerSearchForm.userName"
                            placeholder="请输入用户名"
                            clearable
                            style="width: 150px"
                        />
                    </el-form-item>
                    
                    <el-form-item label="手机号">
                        <el-input
                            v-model="buyerSearchForm.phone"
                            placeholder="请输入手机号"
                            clearable
                            style="width: 150px"
                        />
                    </el-form-item>
                    
                    <el-form-item label="邮箱">
                        <el-input
                            v-model="buyerSearchForm.email"
                            placeholder="请输入邮箱"
                            clearable
                            style="width: 180px"
                        />
                    </el-form-item>
                    
                    <el-form-item label="地区">
                        <el-select
                            v-model="buyerSearchForm.region"
                            placeholder="请选择地区"
                            clearable
                            style="width: 120px"
                        >
                            <el-option
                                v-for="option in regionOptions"
                                :key="option.value"
                                :label="option.label"
                                :value="option.value"
                            />
                        </el-select>
                    </el-form-item>
                    
                    <el-form-item label="注册时间">
                        <el-date-picker
                            v-model="buyerSearchForm.createTimeRange"
                            type="daterange"
                            range-separator="至"
                            start-placeholder="开始日期"
                            end-placeholder="结束日期"
                            format="YYYY-MM-DD"
                            value-format="YYYY-MM-DD"
                            style="width: 240px"
                        />
                    </el-form-item>
                </el-form>
                
                <div style="margin-top: 12px; display: flex; gap: 12px;">
                    <el-button @click="resetBuyerSearch" type="info" plain>
                        重置条件
                    </el-button>
                    <el-button @click="toggleAdvancedSearch" type="primary" plain>
                        简单搜索
                    </el-button>
                </div>
            </div>
        </div>
        
        <!-- 搜索结果统计 -->
        <div style="margin-bottom: 16px; color: #909399; font-size: 14px;">
            共找到 {{ filteredBuyers.length }} 个买家
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
    
    <!-- 商品选择对话框 -->
    <el-dialog 
        title="选择商品" 
        v-model="productDialogVisible" 
        width="900px"
        :before-close="() => productDialogVisible = false"
    >
        <div style="margin-bottom: 20px; display: flex; gap: 16px; align-items: center;">
            <el-cascader
                v-model="selectedCategory"
                :options="allCategories"
                placeholder="请选择商品分类"
                clearable
                :props="{ checkStrictly: false, emitPath: false, value: 'value', label: 'label', children: 'children' }"
                style="width: 250px"
            />
            <el-input
                v-model="productSearchKeyword"
                placeholder="搜索商品（名称、描述、类别）"
                clearable
                style="width: 300px"
            >
                <template #prefix>
                    <el-icon><Search /></el-icon>
                </template>
            </el-input>
        </div>
        
        <div style="max-height: 400px; overflow-y: auto;">
            <el-table 
                :data="filteredProducts" 
                style="width: 100%"
                @row-click="selectProduct"
                :row-class-name="() => 'clickable-row'"
            >
                <el-table-column prop="productName" label="商品名称" width="150" />
                <el-table-column prop="productDescription" label="商品描述" width="200" />
                <el-table-column prop="productPrice" label="价格" width="100">
                    <template #default="scope">
                        ¥{{ scope.row.productPrice }}
                    </template>
                </el-table-column>
                <el-table-column prop="productStock" label="库存" width="80" />
                <el-table-column prop="productCategory.categoryName" label="类别" width="120" />
                <el-table-column prop="createTime" label="创建时间" width="120" />
                <el-table-column label="操作" width="100" fixed="right">
                    <template #default="{ row }">
                        <el-button 
                            @click.stop="selectProduct(row)" 
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
                <el-button @click="productDialogVisible = false">取消</el-button>
            </div>
        </template>
    </el-dialog>
    
    <!-- 商品和买家详情对话框 -->
    <el-dialog 
        v-model="dialogVisible"
        :title="activeDialog === 'product' ? '商品详情' : '买家信息'"
        width="500"
    >
        <div v-if="activeDialog === 'product' && currentProduct">
            <el-descriptions :column="1" border>
                <el-descriptions-item label="商品名称">{{ currentProduct.productName }}</el-descriptions-item>
                <el-descriptions-item label="商品描述">{{ currentProduct.productDescription }}</el-descriptions-item>
                <el-descriptions-item label="商品价格">{{ currentProduct.productPrice }}元</el-descriptions-item>
                <el-descriptions-item label="库存数量">{{ currentProduct.productStock }}</el-descriptions-item>
                <el-descriptions-item label="是否在售">
                    <el-tag :type="currentProduct.productIsOnSale ? 'success' : 'danger'">
                        {{ currentProduct.productIsOnSale ? '在售' : '下架' }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="商品评分">
                    <el-rate v-model="currentProduct.productScore" disabled show-score />
                </el-descriptions-item>
                <el-descriptions-item label="商品分类">
                    {{ currentProduct.productCategory?.categoryName || '无分类' }}
                </el-descriptions-item>
            </el-descriptions>
            <div style="margin-top: 20px; text-align: center;">
                <el-image 
                    style="width: 200px; height: 200px"
                    :src="`http://localhost:8080/uploads/productImage/${currentProduct.productCoverImageUrl}.jpg`" 
                    fit="contain"
                />
            </div>
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
    
    <!-- <p>{{ userList }}</p> -->
</template>

<style>
    .order-descriptions {
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