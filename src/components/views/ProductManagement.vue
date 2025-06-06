<script setup>
import axios from 'axios';
import { onMounted, ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
const router = useRouter()

const numberOfProducts = ref(0);
const productList = ref([]);         // 原始用户列表
const filteredProductList = ref([]); // 当前用于渲染的用户列表
const currentPage = ref(1);

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
  } catch (error) {
    console.log('Failed', error);
    throw error;
  }
}

onMounted(async () => {
    getProductCount();
    getProductList();
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

var searchKey = ref('')

const querySearch = (queryString, cb) => {
    var results = queryString
        ? productList.value.filter(createFilter(queryString)).map(product => ({
            value: product.productName
        }))
        : productList.value.map(product => ({
            value: product.productName
        }));
    switch (searchKind.value) {
        case 'productName':
            results = queryString
                ? productList.value.filter(createFilter(queryString)).map(product => ({
                    value: product.productName
                }))
                : productList.value.map(product => ({
                    value: product.productName
                }))
            cb(results)
            break
        case 'productPrice':
            results = queryString
                ? productList.value.filter(createFilter(queryString)).map(product => ({
                    value: product.productPrice
                }))
                : productList.value.map(product => ({
                    value: product.productPrice
                }))
            cb(results)
            break
        case 'productStock':
            results = queryString
                ? productList.value.filter(createFilter(queryString)).map(product => ({
                    value: product.productStock
                }))
                : productList.value.map(product => ({
                    value: product.productStock
                }))
            cb(results)
            break
        case 'productIsOnSale':
            results = queryString
                ? productList.value.filter(createFilter(queryString)).map(product => ({
                    value: product.productIsOnSale
                }))
                : productList.value.map(product => ({
                    value: product.productIsOnSale
                }))
            cb(results)
            break
        case 'productCategory':
            results = queryString
                ? productList.value.filter(createFilter(queryString)).map(product => ({
                    value: product.productCategory
                }))
                : productList.value.map(product => ({
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
  filteredProductList.value = productList.value.filter(
    product => product.productName === searchKey.value
  );
}
const searchProductByProductPrice = () => {
    filteredProductList.value = productList.value.filter(
        product => product.productPrice === searchKey.value
    );
}
const searchProductByProductStock = () => {
    filteredProductList.value = productList.value.filter(
        product => product.productStock === searchKey.value
    );
}
const searchProductByProductIsOnSale = () => {
    filteredProductList.value = productList.value.filter(
        product => product.productIsOnSale === searchKey.value
    );
}
const searchProductByProductCategory = () => {
    filteredProductList.value = productList.value.filter(
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
  filteredProductList.value = [...productList.value];
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
</style>