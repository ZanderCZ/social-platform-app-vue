<template>
  <div id="app">
    <!-- Header -->
    <el-header class="app-header">
      <div class="container">
        <div class="header-content">
          <router-link class="logo">
            <el-icon><Shop /></el-icon>
            <span>ShopVue</span>
          </router-link>
          
          <div class="search-container">
            <el-input
              v-model="searchQuery"
              placeholder="搜索商品名称、描述或分类..."
              clearable
              @keyup.enter="searchProducts"
            >
              <template #append>
                <el-button type="info" @click="searchProducts">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>
          
          <div class="header-actions">
            <!-- <el-button type="primary">
              <el-icon><User /></el-icon>
              <span>我的账户</span>
            </el-button> -->
            <el-badge :value="cartCount" :max="99" class="cart-badge">
              <el-button type="accent" @click="toggleCart">
                <el-space wrap>
                  <el-icon><ShoppingCart /></el-icon>
                  购物车
                </el-space>
              </el-button>
            </el-badge>
          </div>
        </div>
      </div>
    </el-header>
    
    <div class="container">
      <el-main class="main-content">
        <!-- Sidebar -->
        <el-aside class="sidebar">
          <el-card shadow="hover">
            <template #header>
              <div class="sidebar-header">
                <el-icon><List /></el-icon>
                <span>商品分类</span>
              </div>
            </template>
            <el-cascader
              v-model="selectedCategory"
              :options="categoryOptions"
              :props="cascaderProps"
              placeholder="请选择商品分类"
              clearable
              style="width: 100%"
              @change="selectCategory"
            />
            <div class="category-info" v-if="selectedCategory">
              <el-tag type="primary" effect="plain">
                已选择: {{ selectedCategory }} ({{ getCategoryProductCount(selectedCategory) }}件商品)
              </el-tag>
            </div>
          </el-card>
          
          <el-card shadow="hover" class="mt-20">
            <template #header>
              <div class="sidebar-header">
                <el-icon><Filter /></el-icon>
                <span>价格范围</span>
              </div>
            </template>
            <el-slider
              v-model="priceRange"
              range
              :max="maxPrice"
              :format-tooltip="formatPrice"
            />
            <div class="price-values">
              <span>¥{{ priceRange[0] }}</span>
              <span>¥{{ priceRange[1] }}</span>
            </div>
          </el-card>
          
          <el-card shadow="hover" class="mt-20">
            <template #header>
              <div class="sidebar-header">
                <el-icon><PriceTag /></el-icon>
                <span>筛选条件</span>
              </div>
            </template>
            <div class="filter-options">
              <el-checkbox v-model="showOnSale">仅显示促销商品</el-checkbox>
              <el-checkbox v-model="showInStock">仅显示有货商品</el-checkbox>
              <el-checkbox v-model="showHighRating">4.0+ 高评分商品</el-checkbox>
            </div>
          </el-card>
        </el-aside>
        
        <!-- Products Section -->
        <el-main class="products-section">
          <el-card shadow="hover">
            <div class="section-header">
              <div>
                <h2 class="section-title">精选商品</h2>
                <p class="section-subtitle">发现适合您的完美产品</p>
              </div>
            </div>
            
            <div class="controls">
              <div class="results-count">找到 <strong>{{ filteredProducts.length }}</strong> 件商品</div>
              <div class="sort-container">
                <el-select v-model="sortOption" placeholder="排序方式">
                  <el-option label="默认排序" value="default"></el-option>
                  <el-option label="价格从低到高" value="price_asc"></el-option>
                  <el-option label="价格从高到低" value="price_desc"></el-option>
                  <el-option label="评价最高" value="rating"></el-option>
                  <el-option label="库存最多" value="stock"></el-option>
                </el-select>
              </div>
            </div>
            
            <el-row :gutter="20">
              <el-col
                v-if="loading"
                :span="24"
                style="text-align: center; padding: 40px;"
              >
                <el-loading-spinner />
                <p style="margin-top: 20px; color: #909399;">正在加载商品信息...</p>
              </el-col>
              
              <el-col
                v-else-if="sortedProducts.length === 0"
                :span="24"
                style="text-align: center; padding: 40px;"
              >
                <el-empty description="暂无商品信息" />
              </el-col>
              
              <el-col
                v-else
                v-for="product in sortedProducts"
                :key="product.productId"
                :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
              >
                <el-card
                  class="product-card"
                  shadow="hover"
                  :body-style="{ padding: '0px' }"
                  @click="showProductDetail(product)"
                >
                  <div class="product-image-container">
                    <el-image
                      :src="`http://localhost:8080/uploads/productImage/${product.productCoverImageUrl}.jpg`"
                      :alt="product.productName"
                      class="product-image"
                      fit="cover"
                    />
                    <div class="badges">
                      <el-tag v-if="product.productIsOnSale" type="danger" effect="dark" class="sale-badge">促销中</el-tag>
                      <el-tag v-if="product.productStock > 0" type="success" effect="dark" class="stock-badge">
                        库存: {{ product.productStock }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="product-info">
                    <div class="product-category">
                      <el-icon><PriceTag /></el-icon>
                      {{ product.productCategory ? product.productCategory.categoryName : '未分类' }}
                    </div>
                    <h3 class="product-title">{{ product.productName }}</h3>
                    <p class="product-description">{{ product.productDescription }}</p>
                    
                    <div class="product-rating">
                      <el-rate
                        v-model="product.productScore"
                        disabled
                        show-score
                        score-template="{value}"
                        :max="5"
                      />
                    </div>
                    
                    <div class="product-price">¥{{ product.productPrice.toFixed(2) }}</div>
                    
                    <div class="product-actions">
                      <el-button class="btn-outline" @click.stop="addToWishlist(product)">
                        <el-icon><Star /></el-icon>
                        <span>收藏</span>
                      </el-button>
                      <el-button type="accent" @click.stop="addToCart(product, 1)">
                        <el-icon><ShoppingCart /></el-icon>
                        <span>加入购物车</span>
                      </el-button>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-card>
        </el-main>
      </el-main>
    </div>
    
    <!-- Shopping Cart Sidebar -->
    <el-drawer
      v-model="cartOpen"
      title="购物车"
      direction="rtl"
      size="380px"
      :before-close="toggleCart"
    >
      <div class="cart-content">
        <div v-if="cartItems.length === 0" class="empty-cart">
          <el-empty description="您的购物车是空的">
            <el-button type="accent" @click="toggleCart">去逛逛</el-button>
          </el-empty>
        </div>
        
        <div v-else>
          <div class="cart-items">
            <div class="cart-item" v-for="item in cartItems" :key="item.productId">
              <el-image
                :src="item.productCoverImageUrl"
                :alt="item.productName"
                class="cart-item-image"
                fit="cover"
              />
              <div class="cart-item-details">
                <div class="cart-item-title">{{ item.productName }}</div>
                <div class="cart-item-price">¥{{ (item.productPrice * item.quantity).toFixed(2) }}</div>
                <div class="cart-item-actions">
                  <div class="quantity-control">
                    <el-button
                      :disabled="item.quantity <= 1"
                      @click="updateCartItem(item, item.quantity - 1)"
                    >
                      <el-icon><Minus /></el-icon>
                    </el-button>
                    <el-input-number
                      v-model="item.quantity"
                      :min="1"
                      :max="99"
                      controls-position="right"
                      size="small"
                      @change="(val) => updateCartItem(item, val)"
                    />
                    <el-button @click="updateCartItem(item, item.quantity + 1)">
                      <el-icon><Plus /></el-icon>
                    </el-button>
                  </div>
                  <el-button type="danger" text @click="removeFromCart(item)">
                    <el-icon><Delete /></el-icon>
                    <span>删除</span>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="cart-footer">
            <div class="cart-summary">
              <div class="cart-summary-row">
                <span>商品总计:</span>
                <span>¥{{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="cart-summary-row">
                <span>运费:</span>
                <span>¥{{ shippingFee.toFixed(2) }}</span>
              </div>
              <div class="cart-summary-row cart-total">
                <span>总计:</span>
                <span>¥{{ cartTotal.toFixed(2) }}</span>
              </div>
            </div>
            <el-button
              type="success"
              class="checkout-btn"
              :disabled="cartItems.length === 0"
              @click="checkout"
            >
              <el-icon><CreditCard /></el-icon>
              <span>结算订单</span>
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Shop, Search, User, ShoppingCart, List, Folder,
  Filter, PriceTag, Star, Delete, Minus, Plus,
  CreditCard, DeleteFilled
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 分类数据
const categories = ref([])
// 分类选项（树形结构）
const categoryOptions = ref([])

// 级联选择器配置
const cascaderProps = {
  value: 'categoryName',
  label: 'categoryName',
  children: 'children',
  checkStrictly: false, // 只能选择叶子节点
  emitPath: false, // 只返回选中节点的值，不返回完整路径
  expandTrigger: 'hover' // 鼠标悬停展开子菜单
}

// 加载状态
const loading = ref(false)

// 获取所有分类信息
const getAllCategories = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/category/all');
    console.log('Get all categories success', response);
    categories.value = response.data.data;
    
    // 将扁平数据转换为树形结构
    categoryOptions.value = buildCategoryTree(categories.value);
  } catch (error) {
    console.log('Failed to get categories', error);
    ElMessage.error('获取分类信息失败');
  }
}

// 构建分类树形结构
const buildCategoryTree = (flatCategories) => {
  const categoryMap = new Map();
  const rootCategories = [];

  // 首先创建所有分类的映射
  flatCategories.forEach(category => {
    categoryMap.set(category.categoryId, {
      ...category,
      children: []
    });
  });

  // 构建父子关系
  flatCategories.forEach(category => {
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

// 商品数据
const products = ref([])

// 获取所有商品信息
const getAllProducts = async () => {
  loading.value = true;
  try {
    const response = await axios.get('http://localhost:8080/api/product/all');
    console.log('Get all products success', response);
    products.value = response.data.data;
  } catch (error) {
    console.log('Failed to get products', error);
    ElMessage.error('获取商品信息失败');
  } finally {
    loading.value = false;
  }
}

// 用户交互状态
const selectedCategory = ref(null)
const searchQuery = ref("")
const sortOption = ref("default")
const cartOpen = ref(false)
const cartItems = ref([])
const priceRange = ref([0, 5000])

// 筛选条件
const showOnSale = ref(false)
const showInStock = ref(false)
const showHighRating = ref(false)

// 最大价格
const maxPrice = computed(() => {
  if (products.value.length === 0) return 1000;
  return Math.max(...products.value.map(p => p.productPrice))
})

// 格式化价格显示
const formatPrice = (val) => {
  return `¥${val}`
}

// 获取分类商品数量
const getCategoryProductCount = (categoryName) => {
  return products.value.filter(p => p.productCategory && p.productCategory.categoryName === categoryName).length
}

// 选择分类
const selectCategory = (categoryName) => {
  selectedCategory.value = categoryName
  console.log('选择分类:', categoryName)
}

// 搜索产品
const searchProducts = () => {
  console.log("搜索:", searchQuery.value)
}

// 添加到购物车
const addToCart = (product, qty) => {
  const existingItem = cartItems.value.find(item => item.productId === product.productId)
  
  if (existingItem) {
    existingItem.quantity += qty
  } else {
    cartItems.value.push({
      ...product,
      quantity: qty
    })
  }
  
  // 显示成功消息
  ElMessage.success(`${qty}件 ${product.productName} 已加入购物车`)
}

// 更新购物车项目
const updateCartItem = (item, newQuantity) => {
  if (newQuantity < 1) {
    removeFromCart(item)
    return
  }
  
  item.quantity = newQuantity
}

// 从购物车移除
const removeFromCart = (item) => {
  cartItems.value = cartItems.value.filter(i => i.productId !== item.productId)
  ElMessage.warning(`${item.productName} 已从购物车移除`)
}

// 添加到收藏夹
const addToWishlist = (product) => {
  ElMessage.success(`${product.productName} 已添加到收藏夹`)
}

// 切换购物车
const toggleCart = () => {
  cartOpen.value = !cartOpen.value
}

// 结算订单
const checkout = () => {
  ElMessage.success('订单已提交，正在处理中...')
  cartItems.value = []
  cartOpen.value = false
}

// 购物车商品数量
const cartCount = computed(() => {
  return cartItems.value.reduce((total, item) => total + item.quantity, 0)
})

// 购物车小计
const subtotal = computed(() => {
  return cartItems.value.reduce((total, item) => total + (item.productPrice * item.quantity), 0)
})

// 运费
const shippingFee = computed(() => {
  return subtotal.value > 0 ? (subtotal.value > 199 ? 0 : 15) : 0
})

// 购物车总价
const cartTotal = computed(() => {
  return subtotal.value + shippingFee.value
})

// 过滤产品
const filteredProducts = computed(() => {
  return products.value.filter(product => {
    // 按分类过滤
    if (selectedCategory.value && product.productCategory && product.productCategory.categoryName !== selectedCategory.value) {
      return false
    }
    
    // 按价格范围过滤
    if (product.productPrice < priceRange.value[0] || product.productPrice > priceRange.value[1]) {
      return false
    }
    
    // 按促销过滤
    if (showOnSale.value && !product.productIsOnSale) {
      return false
    }
    
    // 按库存过滤
    if (showInStock.value && product.productStock <= 0) {
      return false
    }
    
    // 按评分过滤
    if (showHighRating.value && product.productScore < 4.0) {
      return false
    }
    
    // 按搜索词过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      if (!product.productName.toLowerCase().includes(query) && 
          !product.productDescription.toLowerCase().includes(query) &&
          !(product.productCategory && product.productCategory.categoryName.toLowerCase().includes(query))) {
        return false
      }
    }
    
    return true
  })
})

// 排序产品
const sortedProducts = computed(() => {
  const products = [...filteredProducts.value]
  
  switch (sortOption.value) {
    case "price_asc":
      return products.sort((a, b) => a.productPrice - b.productPrice)
    case "price_desc":
      return products.sort((a, b) => b.productPrice - a.productPrice)
    case "rating":
      return products.sort((a, b) => b.productScore - a.productScore)
    case "stock":
      return products.sort((a, b) => b.productStock - a.productStock)
    default:
      return products
  }
})

// 显示产品详情
const showProductDetail = (product) => {
  console.log("查看产品详情:", product)
}

// 页面加载时获取数据
onMounted(async () => {
  try {
    await Promise.all([
      getAllCategories(),
      getAllProducts()
    ]);
    
    // 设置价格范围
    if (products.value.length > 0) {
      const maxPriceValue = Math.max(...products.value.map(p => p.productPrice));
      priceRange.value = [0, Math.ceil(maxPriceValue * 1.1)]; // 设置价格范围略高于最高价格
    }
  } catch (error) {
    console.log('Failed to load initial data', error);
  }
})
</script>

<style scoped>
/* 保留所有 CSS 变量定义 */
:root {
  --primary: #667eea;
  --primary-dark: #5a6fd8;
  --primary-light: #a3bffa;
  --secondary: #f093fb;
  --secondary-dark: #e91e63;
  --accent: #4facfe;
  --accent-dark: #00f2fe;
  --success: #43e97b;
  --success-dark: #38f9d7;
  --warning: #fa709a;
  --warning-dark: #fee140;
  --danger: #ff6b6b;
  --danger-dark: #ee5a52;
  --info: #a8edea;
  --info-dark: #fed6e3;
  --sale: #ff9a9e;
  --light: #f8f9fa;
  --dark: #2d3748;
  --gray: #718096;
  --light-gray: #e2e8f0;
  --border: #e2e8f0;
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-hover: 0 8px 25px rgba(0, 0, 0, 0.12);
  --transition: all 0.3s ease;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.mt-20 {
  margin-top: 20px;
}

/* Header Styles */
.app-header {
  background: linear-gradient(135deg, var(--primary), #3a0ca3);
  color: white;
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 15px 0;
  height: auto;
}

.app-header .header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header .logo {
  font-size: 1.8rem;
  font-weight: 700;
  color: rgb(0, 0, 0);
  text-decoration: none;
  display: flex;
  align-items: center;
}

.app-header .logo .el-icon {
  margin-right: 10px;
  color: var(--warning);
  font-size: 1.5em;
}

.app-header .search-container {
  flex: 1;
  max-width: 600px;
  margin: 0 20px;
}

.app-header .header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.app-header .header-actions .action-btn {
  color: white;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 8px;
  padding: 8px 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-header .header-actions .action-btn .el-icon {
  font-size: 1.3rem;
}

.app-header .header-actions .action-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.app-header .header-actions .cart-badge .cart-btn {
  color: white;
  font-size: 1.3rem;
  padding: 8px;
}

.app-header .header-actions .cart-badge .cart-btn .el-icon {
  font-size: 1.3em;
}

/* Main Content */
.main-content {
  display: flex;
  margin-top: 30px;
  gap: 30px;
  padding: 0;
  min-height: calc(100vh - 120px);
}

.main-content .sidebar {
  width: 300px;
  flex-shrink: 0;
}

.main-content .sidebar .sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.main-content .sidebar .sidebar-header .el-icon {
  color: var(--primary);
}

.main-content .sidebar .price-values {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  color: var(--gray);
  margin-top: 10px;
}

.main-content .sidebar .filter-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.main-content .products-section {
  flex: 1;
  padding: 0;
  min-width: 0; /* 防止flex子项溢出 */
}

.main-content .products-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.main-content .products-section .section-title {
  font-size: 2rem;
  color: var(--dark);
  font-weight: 700;
  margin: 0;
}

.main-content .products-section .section-subtitle {
  color: var(--gray);
  margin-top: 8px;
  margin-bottom: 0;
}

.main-content .products-section .controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px 25px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.main-content .products-section .results-count {
  font-weight: 500;
  color: var(--gray);
  font-size: 1rem;
}

.main-content .products-section .results-count strong {
  color: var(--primary);
  font-size: 1.1rem;
}

.main-content .products-section .sort-container {
  min-width: 150px;
}

.main-content .products-section .product-card {
  margin-bottom: 25px;
  transition: var(--transition);
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-content .products-section .product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.12);
}

.main-content .products-section .product-card .product-image-container {
  height: 240px;
  overflow: hidden;
  position: relative;
  border-radius: 8px 8px 0 0;
}

.main-content .products-section .product-card .product-image-container .product-image {
  width: 100%;
  height: 100%;
  transition: transform 0.5s ease;
}

.main-content .products-section .product-card .product-image-container .badges {
  position: absolute;
  top: 15px;
  left: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main-content .products-section .product-card .product-image-container .badges .sale-badge,
.main-content .products-section .product-card .product-image-container .badges .stock-badge {
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
}

.main-content .products-section .product-card:hover .product-image {
  transform: scale(1.05);
}

.main-content .products-section .product-card .product-info {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.main-content .products-section .product-card .product-category {
  color: var(--primary);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.main-content .products-section .product-card .product-category .el-icon {
  font-size: 0.9em;
}

.main-content .products-section .product-card .product-title {
  font-weight: 700;
  margin-bottom: 12px;
  font-size: 1.25rem;
  color: var(--dark);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.main-content .products-section .product-card .product-description {
  color: var(--gray);
  font-size: 0.95rem;
  margin-bottom: 15px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.main-content .products-section .product-card .product-price {
  font-weight: 800;
  font-size: 1.5rem;
  color: var(--primary);
  margin: 12px 0;
}

.main-content .products-section .product-card .product-rating {
  margin: 12px 0;
}

.main-content .products-section .product-card .product-actions {
  display: flex;
  margin-top: 15px;
  gap: 10px;
}

.main-content .products-section .product-card .product-actions .btn-outline {
  flex: 1;
  border: 2px solid var(--primary);
  color: var(--primary);
  background: transparent;
  font-weight: 600;
  transition: var(--transition);
  height: 40px;
}

.main-content .products-section .product-card .product-actions .btn-outline:hover {
  background: var(--primary);
  color: white;
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.main-content .products-section .product-card .product-actions .el-button {
  height: 40px;
}

/* Shopping Cart Sidebar */
.cart-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cart-content .empty-cart {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.cart-content .cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.cart-content .cart-items .cart-item {
  display: flex;
  padding: 18px 0;
  border-bottom: 1px solid var(--border);
}

.cart-content .cart-items .cart-item .cart-item-image {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 15px;
}

.cart-content .cart-items .cart-item .cart-item-details {
  flex: 1;
}

.cart-content .cart-items .cart-item .cart-item-title {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 1.1rem;
}

.cart-content .cart-items .cart-item .cart-item-price {
  color: var(--primary);
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 5px;
}

.cart-content .cart-items .cart-item .cart-item-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.cart-content .cart-items .cart-item .cart-item-actions .quantity-control {
  display: flex;
  align-items: center;
  gap: 5px;
}

.cart-content .cart-items .cart-item .cart-item-actions .quantity-control .el-button {
  background: var(--light-gray);
  border-color: var(--border);
  color: var(--gray);
  width: 36px;
  height: 36px;
}

.cart-content .cart-items .cart-item .cart-item-actions .quantity-control .el-button:hover {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
}

.cart-content .cart-items .cart-item .cart-item-actions .quantity-control .el-button:disabled {
  background: var(--light-gray);
  border-color: var(--border);
  color: var(--light-gray);
  cursor: not-allowed;
}

.cart-content .cart-items .cart-item .cart-item-actions .quantity-control :deep(.el-input-number) {
  width: 100px;
}

.cart-content .cart-footer {
  padding: 25px;
  border-top: 1px solid var(--border);
  background: #f8f9fa;
}

.cart-content .cart-footer .cart-summary {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 25px;
}

.cart-content .cart-footer .cart-summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 1.05rem;
}

.cart-content .cart-footer .cart-total {
  font-weight: 800;
  font-size: 1.4rem;
  color: var(--primary);
}

.cart-content .cart-footer .checkout-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, var(--success), var(--success-dark));
  border: none;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  border-radius: 12px;
  transition: var(--transition);
}

.cart-content .cart-footer .checkout-btn:hover {
  background: linear-gradient(135deg, var(--success-dark), var(--success));
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.cart-content .cart-footer .checkout-btn:disabled {
  background: var(--light-gray);
  color: var(--gray);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cart-content .cart-footer .checkout-btn .el-icon {
  font-size: 1.1em;
}

/* Responsive */
@media (max-width: 1200px) {
  .main-content .sidebar {
    width: 280px;
  }
  
  .main-content {
    gap: 25px;
  }
}

@media (max-width: 992px) {
  .main-content {
    flex-direction: column;
    gap: 20px;
  }
  
  .main-content .sidebar {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .main-content .products-section .section-header {
    margin-bottom: 25px;
  }
  
  .main-content .products-section .controls {
    margin-bottom: 25px;
  }
}

@media (max-width: 768px) {
  .app-header .header-content {
    flex-wrap: wrap;
  }
  
  .app-header .search-container {
    order: 3;
    margin: 15px 0 0;
    max-width: 100%;
  }
  
  .main-content .products-section .controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    padding: 15px 20px;
  }
  
  .main-content .products-section .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .main-content .products-section .section-title {
    font-size: 1.8rem;
  }
  
  .main-content .sidebar {
    max-width: 100%;
  }
}

@media (max-width: 576px) {
  .main-content .products-section .product-card .product-actions {
    flex-direction: column;
  }
  
  .main-content .products-section .product-card .product-actions .el-button {
    width: 100%;
  }
  
  .app-header .header-actions {
    gap: 10px;
  }
  
  .app-header .header-actions .action-btn span {
    display: none;
  }
  
  .main-content .products-section .product-card .product-image-container {
    height: 200px;
  }
  
  .main-content .products-section .product-card .product-info {
    padding: 15px;
  }
  
  .main-content .products-section .product-card .product-title {
    font-size: 1.1rem;
  }
  
  .main-content .products-section .product-card .product-price {
    font-size: 1.3rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 15px;
  }
  
  .main-content {
    margin-top: 20px;
  }
  
  .main-content .products-section .controls {
    padding: 12px 15px;
  }
  
  .main-content .products-section .product-card .product-image-container {
    height: 180px;
  }
}

/* 级联选择器和分类信息样式 */
.category-info {
  margin-top: 15px;
  text-align: center;
}

.category-info .el-tag {
  width: 100%;
  justify-content: center;
  padding: 8px 12px;
  font-size: 0.9rem;
}

/* 级联选择器样式优化 */
.sidebar .el-cascader {
  margin-bottom: 10px;
}

.sidebar .el-cascader :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sidebar .el-cascader :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.sidebar .el-cascader :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--primary);
}

/* 侧边栏卡片样式优化 */
.sidebar .el-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: var(--transition);
}

.sidebar .el-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.sidebar .el-card :deep(.el-card__header) {
  padding: 18px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
}

.sidebar .el-card :deep(.el-card__body) {
  padding: 20px;
}

/* 价格滑块样式优化 */
.sidebar .el-slider {
  margin: 15px 0;
}

.sidebar .el-slider :deep(.el-slider__runway) {
  height: 6px;
  border-radius: 3px;
}

.sidebar .el-slider :deep(.el-slider__bar) {
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  border-radius: 3px;
}

.sidebar .el-slider :deep(.el-slider__button) {
  width: 20px;
  height: 20px;
  border: 3px solid var(--primary);
  background: white;
}

/* 筛选条件样式优化 */
.sidebar .filter-options .el-checkbox {
  margin-bottom: 8px;
}

.sidebar .filter-options .el-checkbox :deep(.el-checkbox__label) {
  font-size: 0.95rem;
  color: var(--dark);
}

.sidebar .filter-options .el-checkbox :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--primary);
  border-color: var(--primary);
}

/* 商品网格间距优化 */
.main-content .products-section .el-row {
  margin: 0 -10px;
}

.main-content .products-section .el-col {
  padding: 0 10px;
}

/* 加载和空状态样式优化 */
.main-content .products-section .el-loading-spinner {
  margin: 0 auto;
}

.main-content .products-section .el-empty {
  padding: 60px 20px;
}

/* 购物车徽章样式优化 */
.app-header .cart-badge :deep(.el-badge__content) {
  background-color: var(--secondary);
  border: 2px solid white;
}

.app-header .cart-badge .el-button {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
}

.app-header .cart-badge .el-button:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.3);
}

/* 自定义按钮颜色样式 */
:deep(.el-button--accent) {
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  border-color: var(--accent);
  color: white;
}

:deep(.el-button--accent:hover) {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent));
  border-color: var(--accent-dark);
  color: white;
}

:deep(.el-button--accent:active) {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
}

:deep(.el-button--info) {
  background: linear-gradient(135deg, var(--info), var(--info-dark));
  border-color: var(--info);
  color: var(--dark);
}

:deep(.el-button--info:hover) {
  background: linear-gradient(135deg, var(--info-dark), var(--info));
  border-color: var(--info-dark);
  color: var(--dark);
}

:deep(.el-button--success) {
  background: linear-gradient(135deg, var(--success), var(--success-dark));
  border-color: var(--success);
  color: white;
}

:deep(.el-button--success:hover) {
  background: linear-gradient(135deg, var(--success-dark), var(--success));
  border-color: var(--success-dark);
  color: white;
}

:deep(.el-button--warning) {
  background: linear-gradient(135deg, var(--warning), var(--warning-dark));
  border-color: var(--warning);
  color: white;
}

:deep(.el-button--warning:hover) {
  background: linear-gradient(135deg, var(--warning-dark), var(--warning));
  border-color: var(--warning-dark);
  color: white;
}

:deep(.el-button--danger) {
  background: linear-gradient(135deg, var(--danger), var(--danger-dark));
  border-color: var(--danger);
  color: white;
}

:deep(.el-button--danger:hover) {
  background: linear-gradient(135deg, var(--danger-dark), var(--danger));
  border-color: var(--danger-dark);
  color: white;
}

/* 商品卡片按钮样式优化 */
.main-content .products-section .product-card .product-actions .btn-outline {
  flex: 1;
  border: 2px solid var(--primary);
  color: var(--primary);
  background: transparent;
  font-weight: 600;
  transition: var(--transition);
}

.main-content .products-section .product-card .product-actions .btn-outline:hover {
  background: var(--primary);
  color: white;
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

/* 购物车按钮样式优化 */
.cart-content .cart-items .cart-item .cart-item-actions .quantity-control .el-button {
  background: var(--light-gray);
  border-color: var(--border);
  color: var(--gray);
  width: 36px;
  height: 36px;
}

.cart-content .cart-items .cart-item .cart-item-actions .quantity-control .el-button:hover {
  background: var(--primary-light);
  border-color: var(--primary);
  color: var(--primary);
}

.cart-content .cart-items .cart-item .cart-item-actions .quantity-control .el-button:disabled {
  background: var(--light-gray);
  border-color: var(--border);
  color: var(--light-gray);
  cursor: not-allowed;
}

/* 结算按钮样式优化 */
.cart-content .cart-footer .checkout-btn {
  background: linear-gradient(135deg, var(--success), var(--success-dark));
  border: none;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  border-radius: 12px;
  transition: var(--transition);
}

.cart-content .cart-footer .checkout-btn:hover {
  background: linear-gradient(135deg, var(--success-dark), var(--success));
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.cart-content .cart-footer .checkout-btn:disabled {
  background: var(--light-gray);
  color: var(--gray);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>