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
  goodName: '',
  goodCount: 1,
  totalAmount: 1.0,
  orderStatus: '',
  paymentMethod: '',
  createTime: '',
})

// 商品选择对话框相关
const productDialogVisible = ref(false);
const allProducts = ref([]);
const selectedProduct = ref(null);
const productSearchKeyword = ref('');
// 商品分类相关
const allCategories = ref([]);
const selectedCategory = ref('');

// 当前商品信息
const currentProductInfo = ref(null);

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
    // 表单验证
    if (!form.goodName) {
        ElMessage.error('请选择商品');
        return;
    }
    if (!form.orderStatus) {
        ElMessage.error('请选择订单状态');
        return;
    }
    if (!form.paymentMethod) {
        ElMessage.error('请选择支付方式');
        return;
    }
    
    // 验证总金额是否正确
    if (currentProductInfo.value) {
        const expectedAmount = parseFloat((form.goodCount * currentProductInfo.value.price).toFixed(2));
        if (Math.abs(form.totalAmount - expectedAmount) > 0.01) {
            ElMessage.warning('订单金额与商品数量和单价不匹配，正在重新计算...');
            form.totalAmount = expectedAmount;
        }
    }
    
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
        ElMessage.error('保存失败，请重试');
    }
}

const passedOrderName = route.query.orderName || ''

const statusOptions = [
  { value: 'UnPaid', label: '待付款', color: '#F56C6C' },
  { value: 'NotDispatched', label: '待发货', color: '#E6A23C' },
  { value: 'Delivering', label: '派送中', color: '#409EFF' },
  { value: 'Delivered', label: '已送达', color: '#67C23A' },
  { value: 'Done', label: '已完成', color: '#909399' },
]

const isEditing = ref(false)

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

// 打开商品选择对话框
const openProductDialog = () => {
  productDialogVisible.value = true;
  getAllProducts();
  getAllCategories();
}

// 选择商品
const selectProduct = (product) => {
  selectedProduct.value = product;
  form.goodName = product.productName;
  productDialogVisible.value = false;
  
  // 重置商品数量为1，然后更新总金额
  form.goodCount = 1;
  updateTotalAmount();
  
  ElMessage.success(`已选择商品：${product.productName}`);
}

// 更新总金额
const updateTotalAmount = async () => {
  const productName = form.goodName;
  let productPrice = 0.0;
  let productStock = 0;
  
  if (productName === '') {
    form.totalAmount = 0;
    currentProductInfo.value = null;
    return;
  }
  
  try {
    const response = await axios.get("http://localhost:8080/api/product/byProductName/" + encodeURIComponent(productName));
    console.log('Get product info:', response);
    
    if (response.data && response.data.data) {
      productPrice = response.data.data.productPrice || 0;
      productStock = response.data.data.productStock || 0;
      
      // 保存当前商品信息
      currentProductInfo.value = {
        price: productPrice,
        stock: productStock
      };
      
      // 检查库存
      if (form.goodCount > productStock) {
        form.goodCount = productStock;
        ElMessage.warning(`商品库存不足，已调整为最大库存数量：${productStock}件`);
      }
      
      // 计算总金额
      form.totalAmount = parseFloat((form.goodCount * productPrice).toFixed(2));
      console.log(`总金额计算: ${form.goodCount} × ${productPrice} = ${form.totalAmount}`);
    }
  } catch (error) {
    console.log('Failed to get product by productName', error);
    ElMessage.error('获取商品信息失败，无法计算总金额');
    form.totalAmount = 0;
    currentProductInfo.value = null;
  }
}

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
        
        // 设置选中的商品
        if (form.goodName) {
            selectedProduct.value = { productName: form.goodName };
        }
        
        // 验证总金额是否正确
        await updateTotalAmount();
    } catch (error) {
        console.log('Failed to get order info', error)
    }
})
</script>

<template>
  <div class="order-edit-container">
    <div class="header">
      <h1 class="title">订单详情</h1>
      <div class="order-number">订单编号: {{ passedOrderName }}</div>
      <el-divider class="divider"/>
    </div>
    
    <div class="form-container">
      <el-form :model="form" label-width="120px" label-position="top">
        <div class="form-grid">
          <div class="form-section">
            <el-form-item label="商品名称" class="form-item">
              <div style="display: flex; gap: 10px; align-items: center;">
                <el-input
                  v-model="form.goodName"
                  placeholder="已选择的商品"
                  readonly
                  style="flex: 1"
                  :disabled="!isEditing"
                />
                <el-button 
                  v-if="isEditing" 
                  @click="openProductDialog" 
                  type="primary" 
                  plain
                >
                  选择商品
                </el-button>
                <el-button 
                  v-if="isEditing && form.goodName" 
                  @click="form.goodName = ''" 
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
                :disabled="!isEditing"
                @change="updateTotalAmount"
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
              <div v-if="isEditing" style="margin-top: 8px; font-size: 12px; color: #909399;">
                <div v-if="currentProductInfo">
                  <el-icon><InfoFilled /></el-icon>
                  商品单价：{{ currentProductInfo.price }}元，库存：{{ currentProductInfo.stock }}件
                </div>
                <div style="margin-top: 4px;">
                  <el-icon><InfoFilled /></el-icon>
                  订单金额 = 商品数量 × 商品单价
                </div>
              </div>
            </el-form-item>
          </div>
          
          <div class="form-section">
            <el-form-item label="订单状态" class="form-item">
              <el-select
                v-model="form.orderStatus"
                placeholder="请选择订单状态"
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
              </el-select>
            </el-form-item>
            
            <el-form-item label="创建日期" class="form-item">
              <el-date-picker
                v-model="form.createTime"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                :disabled="!isEditing"
                format="YYYY/MM/DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            
            <el-form-item label="支付方式" class="form-item">
              <el-radio-group v-model="form.paymentMethod" :disabled="!isEditing">
                <el-radio-button value="WechatPay">微信支付</el-radio-button>
                <el-radio-button value="AliPay">支付宝支付</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </div>
        </div>
        
        <div class="form-actions">
          <template v-if="!isEditing">
            <el-button 
              type="primary" 
              size="large" 
              @click="clickEditButton"
              class="action-button"
              :icon="Edit"
            >
              编辑订单
            </el-button>
          </template>
          <template v-else>
            <el-button 
              type="success" 
              size="large" 
              @click="clickSaveButton"
              class="action-button"
              :icon="Check"
            >
              保存修改
            </el-button>
          </template>
          <el-button 
            @click="backButtonPressed" 
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