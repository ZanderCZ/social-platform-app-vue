<template>
  <div class="category-management">
    <div class="header">
      <h1>商品分类管理</h1>
      <div>
        <el-button type="primary" @click="handleAddTopCategory">
          <el-icon><plus /></el-icon> 添加顶级分类
        </el-button>
      </div>
    </div>
    
    <div class="stats-container">
      <div class="stat-card">
        <h3>分类总数</h3>
        <div class="value">{{ flatCategories.length }}</div>
      </div>
      <div class="stat-card">
        <h3>一级分类</h3>
        <div class="value">{{ levelStats.level1 }}</div>
      </div>
      <div class="stat-card">
        <h3>二级分类</h3>
        <div class="value">{{ levelStats.level2 }}</div>
      </div>
      <div class="stat-card">
        <h3>三级分类</h3>
        <div class="value">{{ levelStats.level3 }}</div>
      </div>
    </div>
    
    <div class="main-content">
      <div class="action-bar">
        <div class="search-container">
          <el-input v-model="searchKeyword" placeholder="搜索分类名称..." clearable style="width: 300px;">
            <template #prefix>
              <el-icon><search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </div>
      </div>
      
      <div class="tree-table-container">
        <el-table 
          :data="filteredTreeData" 
          row-key="categoryId"
          :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
          v-loading="loading"
          style="width: 100%"
          :default-expand-all="true"
        >
          <el-table-column prop="categoryName" label="分类名称">
            <template #default="{ row }">
              <div class="custom-tree-node">
                <span :class="['level-indicator', `level-${row.categoryLevel + 1}`]">
                  {{ row.categoryLevel + 1 }}
                </span>
                <span>{{ row.categoryName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="categoryId" label="分类ID" width="120" />
          <el-table-column prop="categoryLevel" label="层级" width="100">
            <template #default="{ row }">
              <el-tag :type="getLevelTagType(row.categoryLevel)">
                第 {{ row.categoryLevel + 1 }} 级
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="categorySortOrder" label="排序" width="100" />
          <el-table-column label="操作" width="220">
            <template #default="{ row }">
              <el-button size="small" @click="handleAddSubCategory(row)">添加子类</el-button>
              <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="empty-state" v-if="filteredTreeData.length === 0">
          <el-icon :size="48"><folder-remove /></el-icon>
          <p>暂无分类数据</p>
          <el-button type="primary" @click="handleAddTopCategory">添加分类</el-button>
        </div>
      </div>
    </div>
    
    <!-- 添加/编辑分类对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="currentCategory" label-width="100px">
        <el-form-item label="分类名称" required>
          <el-input v-model="currentCategory.categoryName" placeholder="请输入分类名称" />
        </el-form-item>
        
        <el-form-item label="上级分类" v-if="!isTopCategory">
          <el-cascader
            v-model="selectedParentPath"
            :options="parentOptions"
            :props="cascaderProps"
            placeholder="请选择上级分类"
            clearable
            style="width: 100%"
            :show-all-levels="false"
          />
        </el-form-item>
        
        <el-form-item label="分类层级" v-if="isTopCategory">
          <el-tag type="info">顶级分类（1级）</el-tag>
        </el-form-item>
        
        <el-form-item label="排序">
          <el-input-number v-model="currentCategory.categorySortOrder" :min="1" :max="100" />
          <span style="margin-left: 10px; color: #909399">数字越小越靠前</span>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCategory">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
  <!-- <div>{{ mockCategories }}</div> -->
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search, FolderRemove } from '@element-plus/icons-vue';
import axios from 'axios'

// 模拟数据 - 实际使用时替换为从API获取的数据
// const mockCategories = [
//   {
//     "categoryId": 1,
//     "categoryName": "testCategoryName",
//     "categoryParentId": 0,
//     "categoryLevel": 0,
//     "categorySortOrder": 4
//   },
//   {
//     "categoryId": 2,
//     "categoryName": "secondCategory",
//     "categoryParentId": 1,
//     "categoryLevel": 1,
//     "categorySortOrder": 4
//   },
//   {
//     "categoryId": 3,
//     "categoryName": "thirdCategory",
//     "categoryParentId": 2,
//     "categoryLevel": 2,
//     "categorySortOrder": 4
//   },
//   {
//     "categoryId": 4,
//     "categoryName": "电子产品",
//     "categoryParentId": 0,
//     "categoryLevel": 0,
//     "categorySortOrder": 1
//   },
//   {
//     "categoryId": 5,
//     "categoryName": "服装",
//     "categoryParentId": 0,
//     "categoryLevel": 0,
//     "categorySortOrder": 2
//   },
//   {
//     "categoryId": 6,
//     "categoryName": "家居用品",
//     "categoryParentId": 0,
//     "categoryLevel": 0,
//     "categorySortOrder": 3
//   },
//   {
//     "categoryId": 7,
//     "categoryName": "手机",
//     "categoryParentId": 4,
//     "categoryLevel": 1,
//     "categorySortOrder": 1
//   },
//   {
//     "categoryId": 8,
//     "categoryName": "笔记本电脑",
//     "categoryParentId": 4,
//     "categoryLevel": 1,
//     "categorySortOrder": 2
//   },
//   {
//     "categoryId": 9,
//     "categoryName": "平板电脑",
//     "categoryParentId": 4,
//     "categoryLevel": 1,
//     "categorySortOrder": 3
//   },
//   {
//     "categoryId": 10,
//     "categoryName": "数码相机",
//     "categoryParentId": 4,
//     "categoryLevel": 1,
//     "categorySortOrder": 4
//   },
//   {
//     "categoryId": 11,
//     "categoryName": "男装",
//     "categoryParentId": 5,
//     "categoryLevel": 1,
//     "categorySortOrder": 1
//   },
//   {
//     "categoryId": 12,
//     "categoryName": "女装",
//     "categoryParentId": 5,
//     "categoryLevel": 1,
//     "categorySortOrder": 2
//   },
//   {
//     "categoryId": 13,
//     "categoryName": "童装",
//     "categoryParentId": 5,
//     "categoryLevel": 1,
//     "categorySortOrder": 3
//   },
//   {
//     "categoryId": 14,
//     "categoryName": "运动服饰",
//     "categoryParentId": 5,
//     "categoryLevel": 1,
//     "categorySortOrder": 4
//   },
//   {
//     "categoryId": 15,
//     "categoryName": "厨房用品",
//     "categoryParentId": 6,
//     "categoryLevel": 1,
//     "categorySortOrder": 1
//   },
//   {
//     "categoryId": 16,
//     "categoryName": "床上用品",
//     "categoryParentId": 6,
//     "categoryLevel": 1,
//     "categorySortOrder": 2
//   },
//   {
//     "categoryId": 17,
//     "categoryName": "家具",
//     "categoryParentId": 6,
//     "categoryLevel": 1,
//     "categorySortOrder": 3
//   },
//   {
//     "categoryId": 18,
//     "categoryName": "卫浴用品",
//     "categoryParentId": 6,
//     "categoryLevel": 1,
//     "categorySortOrder": 4
//   },
//   {
//     "categoryId": 19,
//     "categoryName": "智能手机",
//     "categoryParentId": 7,
//     "categoryLevel": 2,
//     "categorySortOrder": 1
//   },
//   {
//     "categoryId": 20,
//     "categoryName": "功能手机",
//     "categoryParentId": 7,
//     "categoryLevel": 2,
//     "categorySortOrder": 2
//   },
//   {
//     "categoryId": 21,
//     "categoryName": "商务手机",
//     "categoryParentId": 7,
//     "categoryLevel": 2,
//     "categorySortOrder": 3
//   },
//   {
//     "categoryId": 22,
//     "categoryName": "衬衫",
//     "categoryParentId": 11,
//     "categoryLevel": 2,
//     "categorySortOrder": 1
//   },
//   {
//     "categoryId": 23,
//     "categoryName": "T恤",
//     "categoryParentId": 11,
//     "categoryLevel": 2,
//     "categorySortOrder": 2
//   },
//   {
//     "categoryId": 24,
//     "categoryName": "牛仔裤",
//     "categoryParentId": 11,
//     "categoryLevel": 2,
//     "categorySortOrder": 3
//   },
//   {
//     "categoryId": 25,
//     "categoryName": "外套",
//     "categoryParentId": 11,
//     "categoryLevel": 2,
//     "categorySortOrder": 4
//   }
// ];
var mockCategories = []

onMounted(async () => {
    loading.value = true;
    try {
        await getAllCategories();
    } finally {
        loading.value = false;
    }
})

const getAllCategories = async () => {
    try {
        const response = await axios.get('http://localhost:8080/api/category/all')
        flatCategories.value = response.data.data; // 直接更新响应式变量
        console.log('Get categories success', response);
    } catch (error) {
        console.log('Failed', error);
    }
}

const flatCategories = ref([]);
const loading = ref(false);
const searchKeyword = ref('');
const dialogVisible = ref(false);
const dialogTitle = ref('添加分类');
const isTopCategory = ref(false);
const selectedParentPath = ref([]);

const currentCategory = reactive({
  categoryId: null,
  categoryName: '',
  categoryParentId: 0,
  categoryLevel: 0,
  categorySortOrder: 1
});

const cascaderProps = {
  value: 'categoryId',
  label: 'categoryName',
  children: 'children',
  checkStrictly: true,
  emitPath: true
};

// 将扁平数据转换为树形结构
const buildTree = (categories, parentId = 0) => {
  return categories
    .filter(item => item.categoryParentId === parentId)
    .map(item => ({
      ...item,
      children: buildTree(categories, item.categoryId)
    }));
};

// 计算属性
const treeData = computed(() => {
  return buildTree(flatCategories.value);
});

const filteredTreeData = computed(() => {
  if (!searchKeyword.value) return treeData.value;
  
  const filter = (list, keyword) => {
    return list.filter(item => {
      const match = item.categoryName.includes(keyword);
      if (item.children && item.children.length) {
        const children = filter(item.children, keyword);
        if (children.length) {
          return true;
        }
      }
      return match;
    }).map(item => ({
      ...item,
      children: item.children ? filter(item.children, keyword) : []
    }));
  };
  
  return filter([...treeData.value], searchKeyword.value);
});

const levelStats = computed(() => {
  const stats = { level1: 0, level2: 0, level3: 0 };
  flatCategories.value.forEach(item => {
    if (item.categoryLevel === 0) stats.level1++;
    else if (item.categoryLevel === 1) stats.level2++;
    else if (item.categoryLevel === 2) stats.level3++;
  });
  return stats;
});

const parentOptions = computed(() => {
  // 只允许选择到2级分类作为父级
  const maxLevel = 1;
  
  const getOptions = (nodes, level = 0) => {
    return nodes
      .filter(node => node.categoryLevel <= maxLevel)
      .map(node => {
        const option = {
          categoryId: node.categoryId,
          categoryName: node.categoryName,
          disabled: currentCategory.categoryId === node.categoryId,
          categoryLevel: node.categoryLevel
        };
        
        if (node.children && node.children.length && level < maxLevel) {
          option.children = getOptions(node.children, level + 1);
        }
        
        return option;
      });
  };
  
  return getOptions(treeData.value);
});

// 方法
const getLevelTagType = (level) => {
  switch(level) {
    case 0: return 'primary';
    case 1: return 'warning';
    case 2: return 'success';
    default: return 'info';
  }
};

const handleSearch = () => {
  // 搜索逻辑在计算属性中处理
};

const handleAddTopCategory = () => {
  resetForm();
  dialogTitle.value = '添加顶级分类';
  isTopCategory.value = true;
  currentCategory.categoryLevel = 0;
  currentCategory.categoryParentId = 0;
  dialogVisible.value = true;
};

const handleAddSubCategory = (parent) => {
  resetForm();
  dialogTitle.value = '添加子分类';
  isTopCategory.value = false;
  currentCategory.categoryLevel = parent.categoryLevel + 1;
  currentCategory.categoryParentId = parent.categoryId;
  
  // 设置级联选择器的默认值
  if (parent.categoryLevel === 0) {
    selectedParentPath.value = [parent.categoryId];
  } else {
    // 查找父级路径
    const findParentPath = (nodes, targetId, path = []) => {
      for (const node of nodes) {
        if (node.categoryId === targetId) {
          return path;
        }
        
        if (node.children && node.children.length) {
          const found = findParentPath(node.children, targetId, [...path, node.categoryId]);
          if (found) return found;
        }
      }
      return [];
    };
    
    const parentPath = findParentPath(treeData.value, parent.categoryId);
    selectedParentPath.value = [...parentPath, parent.categoryId];
  }
  
  dialogVisible.value = true;
};

const handleEdit = (category) => {
  Object.assign(currentCategory, category);
  dialogTitle.value = '编辑分类';
  
  if (category.categoryLevel === 0) {
    isTopCategory.value = true;
    selectedParentPath.value = [];
  } else {
    isTopCategory.value = false;
    // 查找父级路径
    const findParentPath = (nodes, targetId, path = []) => {
      for (const node of nodes) {
        if (node.categoryId === targetId) {
          return path;
        }
        
        if (node.children && node.children.length) {
          const found = findParentPath(node.children, targetId, [...path, node.categoryId]);
          if (found) return found;
        }
      }
      return [];
    };
    
    selectedParentPath.value = findParentPath(treeData.value, category.categoryParentId);
    if (selectedParentPath.value.length > 0) {
      selectedParentPath.value.push(category.categoryParentId);
    }
  }
  
  dialogVisible.value = true;
};

const handleDelete = async (category) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类 "${category.categoryName}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    // 检查是否有子分类
    const hasChildren = flatCategories.value.some(item => item.categoryParentId === category.categoryId);
    if (hasChildren) {
      ElMessage.warning('该分类下有子分类，请先删除子分类');
      return;
    }
    
    // 删除分类
    flatCategories.value = flatCategories.value.filter(item => item.categoryId !== category.categoryId);
    ElMessage.success('分类删除成功');
  } catch (error) {
    // 用户取消删除
  }
};

const saveCategory = async () => {
  if (!currentCategory.categoryName.trim()) {
    ElMessage.warning('请输入分类名称');
    return;
  }
  
  if (!isTopCategory.value && selectedParentPath.value.length === 0) {
    ElMessage.warning('请选择上级分类');
    return;
  }
  
  // 设置父分类ID
  if (!isTopCategory.value) {
    currentCategory.categoryParentId = selectedParentPath.value[selectedParentPath.value.length - 1];
  }
  
  try {
    loading.value = true;
    
    // 更新或添加逻辑
    if (currentCategory.categoryId) {
      // 更新分类 - 发送PUT请求
      const updateData = {
        categoryName: currentCategory.categoryName,
        categoryParentId: currentCategory.categoryParentId,
        categoryLevel: currentCategory.categoryLevel,
        categorySortOrder: currentCategory.categorySortOrder
      };
      
      await axios.put(`http://localhost:8080/api/category/${currentCategory.categoryId}`, updateData);
      
      // 更新本地数据
      const index = flatCategories.value.findIndex(item => item.categoryId === currentCategory.categoryId);
      if (index !== -1) {
        flatCategories.value[index] = { ...currentCategory };
      }
      
      ElMessage.success('分类更新成功');
    } else {
      // 添加新分类 - 发送POST请求
      const newCategory = {
        ...currentCategory,
        categoryId: Math.max(...flatCategories.value.map(item => item.categoryId), 0) + 1
      };
      
      // 这里假设添加分类的API也是同一个端点，使用POST方法
      // 如果不同，请修改为正确的API端点
      await axios.post('http://localhost:8080/api/category', {
        categoryName: newCategory.categoryName,
        categoryParentId: newCategory.categoryParentId,
        categoryLevel: newCategory.categoryLevel,
        categorySortOrder: newCategory.categorySortOrder
      });
      
      flatCategories.value.push(newCategory);
      ElMessage.success('分类添加成功');
    }
    
    dialogVisible.value = false;
  } catch (error) {
    console.error('操作失败:', error);
    ElMessage.error('操作失败，请重试');
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  Object.assign(currentCategory, {
    categoryId: null,
    categoryName: '',
    categoryParentId: 0,
    categoryLevel: 0,
    categorySortOrder: 1
  });
  selectedParentPath.value = [];
};

// 模拟从API获取数据
const fetchCategories = async () => {
  try {
    loading.value = true;
    // 这里替换为实际的API调用
    // const response = await api.getCategories();
    // flatCategories.value = response.data;
    await new Promise(resolve => setTimeout(resolve, 800));
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
.category-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.header h1 {
  color: #1f2d3d;
  font-size: 24px;
  font-weight: 600;
}

.main-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-container {
  display: flex;
  gap: 12px;
}

.tree-table-container {
  margin-top: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.level-indicator {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  text-align: center;
  line-height: 20px;
  margin-right: 8px;
  font-size: 12px;
  font-weight: bold;
}

.level-1 { background-color: #ecf5ff; color: #409eff; }
.level-2 { background-color: #fdf6ec; color: #e6a23c; }
.level-3 { background-color: #f0f9eb; color: #67c23a; }
.level-4 { background-color: #fef0f0; color: #f56c6c; }

.custom-tree-node {
  display: flex;
  align-items: center;
  padding: 5px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.stats-container {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.stat-card h3 {
  color: #909399;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-card .value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #dcdfe6;
}
</style>