<!-- ItemDetailView.vue -->
<template>
  <div class="item-detail-container">
    <div class="header">
      <button class="back-btn" @click="goBack"><i class="fas fa-arrow-left"></i> 返回</button>
      <h1>商品详情</h1>
      <div class="header-actions" v-if="isAuthenticated">
        <button class="my-page-btn" @click="goToMyPage">
          <i class="fas fa-user"></i> 我的页面
        </button>
        <button class="logout-btn" @click="handleLogout">
          <i class="fas fa-sign-out-alt"></i> 退出
        </button>
      </div>
      <div v-else></div>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button @click="fetchItemDetail" class="retry-btn">重新加载</button>
        <button @click="goBack" class="back-btn">返回</button>
      </div>
    </div>

    <div v-else-if="item" class="item-detail">
      <div class="item-images">
        <img :src="item.image || '/api/placeholder/400x300'" :alt="item.name" class="main-image" />
      </div>

      <div class="item-info">
        <h2 class="item-title">{{ item.name }}</h2>

        <!-- 出售状态 -->
        <div class="item-status">
          <span v-if="item.is_sold" class="status-badge sold">已售出</span>
          <span v-else class="status-badge available">出售中</span>
        </div>

        <div class="item-price">¥{{ formatPrice(item.price) }}</div>

        <div class="item-meta">
          <div class="meta-item">
            <span class="meta-label">分类：</span>
            <span class="meta-value">{{ getCategoryLabel(item.category) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">商品状态：</span>
            <span class="meta-value">{{ getConditionLabel(item.condition) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">位置：</span>
            <span class="meta-value">{{ item.location || '未填写' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">卖家：</span>
            <span class="meta-value">{{ item.seller?.username || '未知' }}</span>
          </div>
          <div v-if="item.is_sold" class="meta-item">
            <span class="meta-label">售出时间：</span>
            <span class="meta-value">{{ formatDate(item.sold_at) }}</span>
          </div>
        </div>

        <div class="item-description">
          <h3>商品描述</h3>
          <p>{{ item.description || '暂无描述' }}</p>
        </div>

        <!-- 操作按钮区域 -->
        <div class="action-section">
          <!-- 收藏按钮（所有人都可以收藏） -->
          <button class="favorite-btn" @click="favoriteItem" v-if="isAuthenticated">
            <i class="fas fa-heart"></i> 收藏
          </button>

          <!-- 购买按钮（非自己的商品且未售出） -->
          <button
            v-if="!isItemOwner && !item.is_sold"
            class="purchase-btn"
            @click="handlePurchase"
            :disabled="purchasing"
          >
            <i class="fas fa-shopping-cart"></i>
            {{ purchasing ? '购买中...' : '立即购买' }}
          </button>

          <!-- 商品所有者操作 -->
          <div v-if="isItemOwner" class="owner-actions">
            <button class="edit-btn" @click="editItem"><i class="fas fa-edit"></i> 编辑商品</button>
            <button class="delete-btn" @click="deleteItem">
              <i class="fas fa-trash"></i> 删除商品
            </button>
          </div>

          <!-- 已售出提示 -->
          <div v-if="item.is_sold && !isItemOwner" class="sold-message">
            <i class="fas fa-times-circle"></i>
            该商品已售出
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const item = ref(null)
const loading = ref(false)
const error = ref('')
const purchasing = ref(false)

// 商品状态选项
const conditions = {
  new: '🆕 全新',
  like_new: '✨ 几乎全新',
  good: '👍 良好',
  fair: '✅ 一般',
  needs_repair: '🔧 需维修',
}

// 分类选项
const categories = [
  { value: '全部', label: '全部' },
  { value: 'electronics', label: '📱 电子产品' },
  { value: 'clothing', label: '👕 服装鞋帽' },
  { value: 'books', label: '📚 图书文具' },
  { value: 'sports', label: '⚽ 运动户外' },
  { value: 'beauty', label: '💄 美妆个护' },
  { value: 'home', label: '🏠 家居日用' },
  { value: 'other', label: '📦 其他' },
]

// 计算属性
const isAuthenticated = computed(() => {
  return localStorage.getItem('isAuthenticated') === 'true'
})

const currentUser = computed(() => {
  const userData = localStorage.getItem('userInfo')
  return userData ? JSON.parse(userData) : null
})

const isItemOwner = computed(() => {
  return currentUser.value && item.value?.seller && item.value.seller.id === currentUser.value.id
})

// 获取认证Token
const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

// 获取商品详情
const fetchItemDetail = async () => {
  loading.value = true
  error.value = ''

  try {
    const token = getAuthToken()

    if (!token) {
      throw new Error('请先登录')
    }

    const response = await fetch(`http://127.0.0.1:8000/api/goods/${route.params.id}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    // 🔥 关键修改：处理权限错误
    if (response.status === 403) {
      throw new Error('您没有权限查看此商品详情')
    }

    if (response.status === 404) {
      throw new Error('商品不存在')
    }

    if (!response.ok) {
      throw new Error(`获取商品详情失败: ${response.status}`)
    }

    const data = await response.json()
    if (data.success) {
      item.value = data.goods
    } else {
      throw new Error(data.message || '获取商品详情失败')
    }
  } catch (err) {
    console.error('获取商品详情失败:', err)
    error.value = err.message

    // 处理认证过期
    if (err.message.includes('登录已过期') || err.message.includes('请先登录')) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userInfo')
    }
  } finally {
    loading.value = false
  }
}

// 收藏商品
const favoriteItem = async () => {
  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${route.params.id}/favorite/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      alert('收藏成功！')
    } else {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || '收藏失败')
    }
  } catch (err) {
    console.error('收藏失败:', err)
    alert('收藏失败: ' + err.message)
  }
}

// 购买商品
const handlePurchase = async () => {
  if (!confirm(`确定要购买 "${item.value.name}" 吗？\n价格：¥${item.value.price}`)) {
    return
  }

  purchasing.value = true
  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${route.params.id}/purchase/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (data.success) {
      alert('购买成功！')
      // 刷新商品详情
      await fetchItemDetail()
    } else {
      throw new Error(data.message || '购买失败')
    }
  } catch (err) {
    console.error('购买失败:', err)
    alert('购买失败: ' + err.message)
  } finally {
    purchasing.value = false
  }
}

// 编辑商品
const editItem = () => {
  alert('编辑功能开发中...')
}

// 删除商品
const deleteItem = async () => {
  if (!confirm('确定要删除这个商品吗？此操作不可恢复。')) {
    return
  }

  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${route.params.id}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      alert('商品删除成功！')
      router.push('/home')
    } else {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || '删除失败')
    }
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败: ' + err.message)
  }
}

// 工具函数
const goBack = () => {
  router.back()
}

const goToMyPage = () => {
  router.push('/my')
}

const handleLogout = async () => {
  try {
    const token = getAuthToken()
    if (token) {
      await fetch('http://127.0.0.1:8000/api/auth/logout/', {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
      })
    }
  } catch (error) {
    console.error('登出失败:', error)
  } finally {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('isAuthenticated')
    router.push('/')
  }
}

const formatPrice = (price) => {
  return parseFloat(price).toFixed(2)
}

const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  try {
    const date = new Date(dateString)
    return (
      date.toLocaleDateString('zh-CN') +
      ' ' +
      date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    )
  } catch {
    return dateString
  }
}

const getCategoryLabel = (categoryValue) => {
  const category = categories.find((cat) => cat.value === categoryValue)
  return category ? category.label : categoryValue
}

const getConditionLabel = (conditionValue) => {
  return conditions[conditionValue] || conditionValue
}

onMounted(() => {
  fetchItemDetail()
})
</script>

<style scoped>
.item-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-actions {
  display: flex;
  gap: 15px;
}

.my-page-btn {
  background: #9b59b6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logout-btn {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-images {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.main-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
  border-radius: 8px;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.item-title {
  color: #2c3e50;
  margin: 0;
  font-size: 2rem;
}

.item-status {
  margin-bottom: 10px;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  display: inline-block;
}

.status-badge.available {
  background: #d4edda;
  color: #155724;
}

.status-badge.sold {
  background: #f8d7da;
  color: #721c24;
}

.item-price {
  font-size: 2.5rem;
  font-weight: bold;
  color: #e74c3c;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-label {
  font-weight: 600;
  color: #2c3e50;
}

.meta-value {
  color: #7f8c8d;
}

.item-description {
  padding: 20px 0;
  border-top: 1px solid #e9ecef;
}

.item-description h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.item-description p {
  color: #7f8c8d;
  line-height: 1.6;
}

.action-section {
  margin: 30px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.favorite-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
}

.purchase-btn {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.purchase-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.purchase-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sold-message {
  color: #6c757d;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 15px;
  background: #ecf0f1;
  border-radius: 8px;
}

.owner-actions {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.edit-btn,
.delete-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  flex: 1;
}

.edit-btn {
  background: #f39c12;
  color: white;
}

.delete-btn {
  background: #e74c3c;
  color: white;
}

.loading,
.error {
  text-align: center;
  padding: 60px 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.loading i {
  font-size: 32px;
  color: #3498db;
  margin-bottom: 15px;
}

.error {
  background: #fdeded;
  color: #e74c3c;
}

.error-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 20px;
}

.retry-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .item-detail-container {
    padding: 10px;
  }

  .item-detail {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 20px;
  }

  .header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .header-actions button {
    width: 100%;
  }

  .item-title {
    font-size: 1.5rem;
  }

  .item-price {
    font-size: 2rem;
  }

  .owner-actions {
    flex-direction: column;
  }

  .error-actions {
    flex-direction: column;
  }
}
</style>
