<script setup>
import axios from 'axios';
import { onMounted, ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
const router = useRouter()

const numberOfProducts = ref(0);
const productList = ref([]);         // 原始商品列表
const filteredProductList = ref([]); // 当前用于渲染的商品列表
const currentPage = ref(1);

// 多条件搜索字段
const searchConditions = ref({
    productName: '',
    productPriceMin: '',
    productPriceMax: '',
    productStockMin: '',
    productStockMax: '',
    productIsOnSale: '',
    productCategory: ''
});

// 自动提示选项
const productNameSuggestions = ref([]);

// 商品类别选项
const categoryOptions = ref([]);

// 级联选择器配置
const cascaderProps = {
  value: 'categoryName',
  label: 'categoryName',
  children: 'children',
  checkStrictly: false, // 只能选择叶子节点
  emitPath: false, // 只返回选中节点的值，不返回完整路径
  expandTrigger: 'hover' // 鼠标悬停展开子菜单
};

const getProductCount = async () => {
    try {
        const response = await axios.get('http://localhost:8080/api/product/count')
        console.log('Get product count success', response);
        numberOfProducts.value = response.data.data;
    } catch (error) {
        console.log('Failed', error);
        throw error;
    }
}

const getProductList = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/product/all')
    productList.value = response.data.data;
    filteredProductList.value = [...productList.value]; // 拷贝初始数据用于渲染
    
    // 初始化自动提示选项
    updateSuggestions();
  } catch (error) {
    console.log('Failed', error);
    throw error;
  }
}

// 获取所有商品类别
const getAllCategories = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/category/all')
    console.log('Get all categories success', response);
    
    // 将扁平数据转换为树形结构
    const flatCategories = response.data.data;
    categoryOptions.value = buildCategoryTree(flatCategories);
  } catch (error) {
    console.log('Failed to get categories', error);
    throw error;
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

// 更新自动提示选项
const updateSuggestions = () => {
    // 商品名提示
    const uniqueProductNames = [...new Set(productList.value.map(product => product.productName))];
    productNameSuggestions.value = uniqueProductNames.map(name => ({ value: name }));
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

// 商品名自动提示
const queryProductName = (queryString, cb) => {
    const results = filterSuggestions(queryString, productNameSuggestions.value);
    cb(results);
}

onMounted(async () => {
    getProductCount();
    getProductList();
    getAllCategories();
})

const editInfoPressed = (orderName) => {
    router.push({
        path: '/editOrderInfo',
        query: {
            orderName: orderName
        }
    })
}

const deleteById = async (productId) => {
    try {
        const response = await axios.delete('http://localhost:8080/api/product/' + productId)
        console.log('Successfully delete product by productId', response);
        ElMessage({
            message: '删除成功',
            type: 'success',
        })
    } catch (error) {
        console.log('Failed to delete product by productId', error);
        throw error;
    }
}

const deleteButtonPressed = async (productName) => {
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
    const response = await axios.get('http://localhost:8080/api/product/byProductName/' + productName);
    console.log('Successfully get product by productName', response);
    
    // 等待删除完成再刷新列表
    await deleteById(response.data.data.productId);  
    await getProductList();  // 这里也加上 await

    // 更新用户数量
    await getProductCount();

    } catch (error) {
        console.log('Failed to get user by productName or delete Product', error);
    }
  })
  .catch(() => {});
}

const pageSize = 3;
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredProductList.value.slice(start, end);
});

// 多条件搜索函数
const search = () => {
    // 检查是否有至少一个搜索条件
    const hasSearchCondition = Object.values(searchConditions.value).some(value => value !== '');
    
    if (!hasSearchCondition) {
        ElMessageBox.alert('请至少输入一个搜索条件', '提示', {
          confirmButtonText: 'OK',
          callback: (action) => {},
        })
        return;
    }

    // 验证价格范围
    if (searchConditions.value.productPriceMin && searchConditions.value.productPriceMax && 
        searchConditions.value.productPriceMin > searchConditions.value.productPriceMax) {
        ElMessageBox.alert('最小价格不能大于最大价格', '提示', {
          confirmButtonText: 'OK',
          callback: (action) => {},
        })
        return;
    }

    // 验证库存范围
    if (searchConditions.value.productStockMin && searchConditions.value.productStockMax && 
        searchConditions.value.productStockMin > searchConditions.value.productStockMax) {
        ElMessageBox.alert('最小库存不能大于最大库存', '提示', {
          confirmButtonText: 'OK',
          callback: (action) => {},
        })
        return;
    }

    filteredProductList.value = productList.value.filter(product => {
        // 商品名搜索
        if (searchConditions.value.productName && 
            !product.productName.toLowerCase().includes(searchConditions.value.productName.toLowerCase())) {
            return false;
        }
        
        // 商品价格范围搜索
        if (searchConditions.value.productPriceMin && 
            product.productPrice < searchConditions.value.productPriceMin) {
            return false;
        }
        
        if (searchConditions.value.productPriceMax && 
            product.productPrice > searchConditions.value.productPriceMax) {
            return false;
        }
        
        // 库存范围搜索
        if (searchConditions.value.productStockMin && 
            product.productStock < searchConditions.value.productStockMin) {
            return false;
        }
        
        if (searchConditions.value.productStockMax && 
            product.productStock > searchConditions.value.productStockMax) {
            return false;
        }
        
        // 上架状态搜索
        if (searchConditions.value.productIsOnSale) {
            const saleStatus = product.productIsOnSale ? '是' : '否';
            if (!saleStatus.includes(searchConditions.value.productIsOnSale)) {
                return false;
            }
        }
        
        // 商品类别搜索
        if (searchConditions.value.productCategory && 
            !product.productCategory.categoryName.toLowerCase().includes(searchConditions.value.productCategory.toLowerCase())) {
            return false;
        }
        
        return true;
    });
    
    // 重置分页到第一页
    currentPage.value = 1;
}

const resetSearch = () => {
  filteredProductList.value = [...productList.value];
  // 清空所有搜索条件
  searchConditions.value = {
      productName: '',
      productPriceMin: '',
      productPriceMax: '',
      productStockMin: '',
      productStockMax: '',
      productIsOnSale: '',
      productCategory: ''
  };
  currentPage.value = 1;
}

const createProduct = () => {
    router.push({
        path: '/createProduct',
    })
}

const editButtonPressed = (productName) => {
    router.push({
        path: '/editProduct',
        query: {
            productName: productName
        }
    })
}

</script>

<template>
    <h1>商品管理</h1>
    <el-space wrap direction="vertical">
        <!-- 多条件搜索区域 -->
        <el-card class="search-card">
            <template #header>
                <div class="card-header">
                    <span>搜索条件</span>
                </div>
            </template>
            <el-form :model="searchConditions" label-width="80px" inline>
                <el-form-item label="商品名">
                    <el-autocomplete
                        v-model="searchConditions.productName"
                        :fetch-suggestions="queryProductName"
                        placeholder="请输入商品名"
                        clearable
                        style="width: 200px"
                        :trigger-on-focus="false"
                    />
                </el-form-item>
                <el-form-item label="商品价格">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <el-input-number
                            v-model="searchConditions.productPriceMin"
                            placeholder="最小价格"
                            :min="0"
                            :precision="2"
                            style="width: 120px"
                        />
                        <span style="color: #909399;">至</span>
                        <el-input-number
                            v-model="searchConditions.productPriceMax"
                            placeholder="最大价格"
                            :min="0"
                            :precision="2"
                            style="width: 120px"
                        />
                    </div>
                </el-form-item>
                <el-form-item label="库存数量">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <el-input-number
                            v-model="searchConditions.productStockMin"
                            placeholder="最小库存"
                            :min="0"
                            :precision="0"
                            style="width: 120px"
                        />
                        <span style="color: #909399;">至</span>
                        <el-input-number
                            v-model="searchConditions.productStockMax"
                            placeholder="最大库存"
                            :min="0"
                            :precision="0"
                            style="width: 120px"
                        />
                    </div>
                </el-form-item>
                <el-form-item label="上架状态">
                    <el-select 
                        v-model="searchConditions.productIsOnSale" 
                        placeholder="请选择上架状态"
                        clearable
                        style="width: 200px"
                    >
                        <el-option label="是" value="是" />
                        <el-option label="否" value="否" />
                    </el-select>
                </el-form-item>
                <el-form-item label="商品类别">
                    <el-cascader
                        v-model="searchConditions.productCategory"
                        :options="categoryOptions"
                        :props="cascaderProps"
                        placeholder="请选择商品类别"
                        clearable
                        style="width: 200px"
                    />
                </el-form-item>
                <el-form-item>
                    <el-button @click="search" type="primary">查询</el-button>
                    <el-button @click="resetSearch" type="success">重置</el-button>
                    <el-button @click="createProduct" type="warning">新增</el-button>
                </el-form-item>
            </el-form>
        </el-card>
        
        <div v-if="numberOfProducts == 0">
            <h1>没有商品记录</h1>
        </div>
        <div v-else>
            <el-space wrap direction="vertical">
                <div v-for="(product, index) in paginatedProducts" :key="product.orderId">
                    <!-- <p>{{ product }}</p> -->
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
                        label="商品图片"
                        align="center"
                        >
                        <el-image
                            style="width: 100px; height: 100px"
                            :src="`http://localhost:8080/uploads/productImage/${product.productCoverImageUrl}.jpg?t=${Date.now()}`"
                        >
                        <template #error>
                            <br><br>
                            未上传
                        </template>
                        </el-image>
                        </el-descriptions-item>
                        <el-descriptions-item label="商品ID">{{ product.productId }}</el-descriptions-item>
                        <el-descriptions-item label="商品名">{{ product.productName }}</el-descriptions-item>
                        <el-descriptions-item label="商品单价">{{ product.productPrice }}</el-descriptions-item>
                        <el-descriptions-item label="商品评分">
                            <el-rate
                                v-model="product.productScore"
                                disabled
                                show-score
                                text-color="#ff9900"
                                score-template="{value} points"
                            />
                        </el-descriptions-item>
                        <el-descriptions-item label="商品库存">{{ product.productStock }}</el-descriptions-item>
                        <el-descriptions-item label="商品类别">
                         {{ product.productCategory.categoryName }}
                        </el-descriptions-item>
                        <el-descriptions-item label="是否上架">
                            <div v-if="product.productIsOnSale">
                                <el-tag size="default" type="success">是</el-tag>
                            </div>
                            <div v-else>
                                <el-tag size="default" type="danger">否</el-tag>
                            </div>
                        </el-descriptions-item>
                        <el-descriptions-item label="操作">
                            <el-button type="primary" plain @click="editButtonPressed(product.productName)">修改</el-button>
                            <el-button type="danger" plain @click="deleteButtonPressed(product.productName)">删除</el-button>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
                <el-pagination
                    v-model:current-page="currentPage"
                    :page-size="3"
                    layout="prev, pager, next"
                    :total="filteredProductList.length"
                    background
                />
            </el-space>
        </div>
    </el-space>
    <!-- <p>{{ userList }}</p> -->
</template>

<style>
    .product-descriptions {
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
</style>