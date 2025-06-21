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
                <el-button type="primary" @click="searchProducts">
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
              <el-button type="success" @click="toggleCart">
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
        <el-aside class="sidebar" width="280px">
          <el-card shadow="hover">
            <template #header>
              <div class="sidebar-header">
                <el-icon><List /></el-icon>
                <span>商品分类</span>
              </div>
            </template>
            <el-menu
              :default-active="selectedCategory"
              @select="selectCategory"
            >
              <el-menu-item
                v-for="category in categories"
                :key="category.categoryId"
                :index="category.categoryId"
              >
                <template #title>
                  <el-icon><Folder /></el-icon>
                  <span>{{ category.categoryName }} ({{ getCategoryProductCount(category.categoryId) }})</span>
                </template>
              </el-menu-item>
            </el-menu>
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
                v-for="product in sortedProducts"
                :key="product.productId"
                :xs="24" :sm="12" :md="8" :lg="6"
              >
                <el-card
                  class="product-card"
                  shadow="hover"
                  :body-style="{ padding: '0px' }"
                  @click="showProductDetail(product)"
                >
                  <div class="product-image-container">
                    <el-image
                      :src="product.productCoverImageUrl"
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
                      {{ product.category.categoryName }}
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
                      <el-button type="primary" @click.stop="addToCart(product, 1)">
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
            <el-button type="primary" @click="toggleCart">去逛逛</el-button>
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
              type="primary"
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
import { ref, computed } from 'vue'
import {
  Shop, Search, User, ShoppingCart, List, Folder,
  Filter, PriceTag, Star, Delete, Minus, Plus,
  CreditCard, DeleteFilled
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 分类数据
const categories = ref([
  { categoryId: 1, categoryName: "电子产品" },
  { categoryId: 2, categoryName: "服装鞋帽" },
  { categoryId: 3, categoryName: "家居生活" },
  { categoryId: 4, categoryName: "家用电器" },
  { categoryId: 5, categoryName: "美妆个护" },
  { categoryId: 6, categoryName: "食品生鲜" }
])

// 商品数据
const products = ref([
  { 
    productId: 101, 
    productName: "无线蓝牙降噪耳机", 
    productDescription: "高品质无线蓝牙耳机，支持主动降噪，长达30小时续航时间，舒适佩戴体验。", 
    productPrice: 299.00, 
    productStock: 15, 
    productIsOnSale: true, 
    category: { categoryId: 1, categoryName: "电子产品" }, 
    productCoverImageUrl: "https://images.unsplash.com/photo-1606220588915-1a8b8f1b1c1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", 
    productScore: 4.5 
  },
  { 
    productId: 102, 
    productName: "旗舰智能手机", 
    productDescription: "6.7英寸AMOLED屏幕，高性能处理器，4800万像素三摄系统，支持5G网络。", 
    productPrice: 3999.00, 
    productStock: 8, 
    productIsOnSale: false, 
    category: { categoryId: 1, categoryName: "电子产品" }, 
    productCoverImageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", 
    productScore: 4.8 
  },
  { 
    productId: 103, 
    productName: "轻薄便携笔记本电脑", 
    productDescription: "超轻薄设计笔记本电脑，14英寸2K显示屏，强劲性能，超长续航。", 
    productPrice: 6999.00, 
    productStock: 5, 
    productIsOnSale: true, 
    category: { categoryId: 1, categoryName: "电子产品" }, 
    productCoverImageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", 
    productScore: 4.7 
  },
  { 
    productId: 201, 
    productName: "男士纯棉简约T恤", 
    productDescription: "100%纯棉材质，舒适透气，多种颜色可选，简约时尚设计。", 
    productPrice: 89.00, 
    productStock: 42, 
    productIsOnSale: false, 
    category: { categoryId: 2, categoryName: "服装鞋帽" }, 
    productCoverImageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", 
    productScore: 4.2 
  },
  { 
    productId: 202, 
    productName: "女士时尚休闲鞋", 
    productDescription: "时尚百搭女士休闲鞋，轻便舒适，防滑耐磨鞋底，适合各种场合。", 
    productPrice: 259.00, 
    productStock: 0, 
    productIsOnSale: true, 
    category: { categoryId: 2, categoryName: "服装鞋帽" }, 
    productCoverImageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", 
    productScore: 4.6 
  },
  { 
    productId: 301, 
    productName: "智能手表 Pro", 
    productDescription: "多功能智能手表，支持心率监测、睡眠分析、运动追踪等功能，长达7天续航。", 
    productPrice: 1299.00, 
    productStock: 12, 
    productIsOnSale: false, 
    category: { categoryId: 1, categoryName: "电子产品" }, 
    productCoverImageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", 
    productScore: 4.4 
  },
  { 
    productId: 401, 
    productName: "不锈钢保温杯", 
    productDescription: "高品质不锈钢保温杯，双层真空设计，24小时保温保冷，便携实用。", 
    productPrice: 129.00, 
    productStock: 36, 
    productIsOnSale: true, 
    category: { categoryId: 3, categoryName: "家居生活" }, 
    productCoverImageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", 
    productScore: 4.3 
  },
  { 
    productId: 501, 
    productName: "家用空气净化器", 
    productDescription: "高效空气净化器，四重过滤系统，智能空气质量监测，静音设计。", 
    productPrice: 1599.00, 
    productStock: 7, 
    productIsOnSale: false, 
    category: { categoryId: 4, categoryName: "家用电器" }, 
    productCoverImageUrl: "https://images.unsplash.com/photo-1581578024907-5b7d7a5b9e4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", 
    productScore: 4.9 
  }
])

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
  return Math.max(...products.value.map(p => p.productPrice))
})

// 格式化价格显示
const formatPrice = (val) => {
  return `¥${val}`
}

// 获取分类商品数量
const getCategoryProductCount = (categoryId) => {
  return products.value.filter(p => p.category.categoryId === categoryId).length
}

// 选择分类
const selectCategory = (categoryId) => {
  selectedCategory.value = selectedCategory.value === categoryId ? null : categoryId
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
    if (selectedCategory.value && product.category.categoryId !== selectedCategory.value) {
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
          !product.category.categoryName.toLowerCase().includes(query)) {
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
</script>

<style scoped>
/* 保留所有 CSS 变量定义 */
:root {
  --primary: #4361ee;
  --primary-dark: #3a56d4;
  --secondary: #f72585;
  --secondary-dark: #e11575;
  --sale: #ff5722;
  --light: #f8f9fa;
  --dark: #212529;
  --gray: #6c757d;
  --light-gray: #e9ecef;
  --success: #4cc9f0;
  --warning: #ffd166;
  --border: #dee2e6;
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
  gap: 25px;
  padding: 0;
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
}

.main-content .products-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.main-content .products-section .section-title {
  font-size: 1.8rem;
  color: var(--dark);
  font-weight: 700;
}

.main-content .products-section .section-subtitle {
  color: var(--gray);
  margin-top: 5px;
}

.main-content .products-section .controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 15px 25px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  margin-bottom: 25px;
}

.main-content .products-section .results-count {
  font-weight: 500;
  color: var(--gray);
}

.main-content .products-section .results-count strong {
  color: var(--primary);
}

.main-content .products-section .product-card {
  margin-bottom: 20px;
  transition: var(--transition);
  cursor: pointer;
}

.main-content .products-section .product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.12);
}

.main-content .products-section .product-card .product-image-container {
  height: 220px;
  overflow: hidden;
  position: relative;
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
  padding: 5px 12px;
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
}

.main-content .products-section .product-card .product-category {
  color: var(--primary);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.main-content .products-section .product-card .product-category .el-icon {
  font-size: 0.9em;
}

.main-content .products-section .product-card .product-title {
  font-weight: 700;
  margin-bottom: 10px;
  font-size: 1.2rem;
  color: var(--dark);
  line-height: 1.4;
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
}

.main-content .products-section .product-card .product-price {
  font-weight: 800;
  font-size: 1.4rem;
  color: var(--primary);
  margin: 8px 0;
}

.main-content .products-section .product-card .product-rating {
  margin: 10px 0;
}

.main-content .products-section .product-card .product-actions {
  display: flex;
  margin-top: 15px;
  gap: 10px;
}

.main-content .products-section .product-card .product-actions .btn-outline {
  flex: 1;
  border: 1px solid var(--primary);
  color: var(--primary);
}

.main-content .products-section .product-card .product-actions .btn-outline:hover {
  background: rgba(67, 97, 238, 0.1);
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
  width: 36px;
  height: 36px;
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
  font-weight: 700;
  font-size: 1.1rem;
}

.cart-content .cart-footer .checkout-btn .el-icon {
  font-size: 1.1em;
}

/* Responsive */
@media (max-width: 992px) {
  .main-content {
    flex-direction: column;
  }
  
  .main-content .sidebar {
    width: 100%;
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
  }
  
  .main-content .products-section .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}

@media (max-width: 576px) {
  .main-content .products-section .product-card .product-actions {
    flex-direction: column;
  }
  
  .app-header .header-actions {
    gap: 10px;
  }
  
  .app-header .header-actions .action-btn span {
    display: none;
  }
}
</style>