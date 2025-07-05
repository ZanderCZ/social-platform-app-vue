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
  userName: '',
  goodName: '',
  goodCount: 1,
  totalAmount: 1.0,
  orderStatus: '',
  paymentMethod: '',
  createTime: '',
})

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

// 商品选择对话框相关
const productDialogVisible = ref(false);
const allProducts = ref([]);
const selectedProduct = ref(null);
const productSearchKeyword = ref('');
// 商品分类相关
const allCategories = ref([]);
const selectedCategory = ref('');

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
  form.userName = buyer.userName;
  buyerDialogVisible.value = false;
}

// 选择商品
const selectProduct = (product) => {
  selectedProduct.value = product;
  form.goodName = product.productName;
  productDialogVisible.value = false;
  // 更新商品数量和总金额
  updateTotalAmount();
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
              <div style="display: flex; gap: 10px; align-items: center;">
                <el-input
                  v-model="form.userName"
                  placeholder="已选择的买家"
                  readonly
                  style="flex: 1"
                />
                <el-button @click="openBuyerDialog" type="primary" plain>
                  选择买家
                </el-button>
                <el-button 
                  v-if="form.userName" 
                  @click="form.userName = ''" 
                  type="danger" 
                  plain
                >
                  清空
                </el-button>
              </div>
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
              <div style="display: flex; gap: 10px; align-items: center;">
                <el-input
                  v-model="form.goodName"
                  placeholder="已选择的商品"
                  readonly
                  style="flex: 1"
                />
                <el-button @click="openProductDialog" type="primary" plain>
                  选择商品
                </el-button>
                <el-button 
                  v-if="form.goodName" 
                  @click="form.goodName = ''" 
                  type="danger" 
                  plain
                >
                  清空
                </el-button>
              </div>
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

  <!-- 买家选择对话框 -->
  <el-dialog
    v-model="buyerDialogVisible"
    title="选择买家"
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
    
    <el-table
      :data="filteredBuyers"
      style="width: 100%"
      max-height="400"
      @row-click="selectBuyer"
      highlight-current-row
    >
      <el-table-column prop="userName" label="用户名" width="120" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="email" label="邮箱" width="180" />
      <el-table-column prop="region" label="地区" width="120" />
      <el-table-column prop="createTime" label="注册时间" width="120" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
          <el-button
            size="small"
            type="primary"
            @click.stop="selectBuyer(scope.row)"
          >
            选择
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="buyerDialogVisible = false">取消</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 商品选择对话框 -->
  <el-dialog
    v-model="productDialogVisible"
    title="选择商品"
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
    
    <el-table
      :data="filteredProducts"
      style="width: 100%"
      max-height="400"
      @row-click="selectProduct"
      highlight-current-row
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
        <template #default="scope">
          <el-button
            size="small"
            type="primary"
            @click.stop="selectProduct(scope.row)"
          >
            选择
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="productDialogVisible = false">取消</el-button>
      </span>
    </template>
  </el-dialog>
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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