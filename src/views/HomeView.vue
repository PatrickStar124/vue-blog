<!-- HomeView.vue -->
<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 商品数据
const items = ref([])
const loading = ref(false)
const error = ref('')

const selectedCategory = ref('全部')
const searchQuery = ref('')

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

// 商品状态选项
const conditions = {
  new: '🆕 全新',
  like_new: '✨ 几乎全新',
  good: '👍 良好',
  fair: '✅ 一般',
  needs_repair: '🔧 需维修',
}

// 获取Token的函数
const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

// 登录状态计算属性
const isAuthenticated = computed(() => {
  return localStorage.getItem('isAuthenticated') === 'true'
})

// 获取当前用户信息
const currentUser = computed(() => {
  const userData = localStorage.getItem('userInfo')
  return userData ? JSON.parse(userData) : null
})

// 🔥 新增：计算当前用户是否是商品所有者
const isItemOwner = (item) => {
  return currentUser.value && item.seller && item.seller.id === currentUser.value.id
}

// 计算属性：过滤商品
const filteredItems = computed(() => {
  let filtered = items.value

  if (selectedCategory.value !== '全部') {
    filtered = filtered.filter((item) => item.category === selectedCategory.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query),
    )
  }

  return filtered
})

// 获取商品列表
const fetchItems = async () => {
  loading.value = true
  error.value = ''

  try {
    const token = getAuthToken()

    if (!token) {
      throw new Error('未找到认证Token，请重新登录')
    }

    const response = await fetch('http://127.0.0.1:8000/api/goods/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.status === 401) {
      throw new Error('登录已过期，请重新登录')
    }

    if (!response.ok) {
      throw new Error(`获取商品失败: ${response.status}`)
    }

    const data = await response.json()

    if (data.success) {
      items.value = data.goods || []
      console.log(`商品数据加载成功: ${items.value.length}件商品`)
    } else {
      throw new Error(data.message || '获取商品列表失败')
    }
  } catch (err) {
    console.error('加载商品失败:', err)
    error.value = err.message

    if (err.message.includes('登录已过期') || err.message.includes('未找到认证Token')) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userInfo')
    }
  } finally {
    loading.value = false
  }
}

// 删除商品
const deleteItem = async (itemId, event) => {
  event.stopPropagation()

  if (!confirm('确定要删除这个商品吗？')) {
    return
  }

  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('未找到认证Token，请重新登录')
    }

    const response = await fetch(`http://127.0.0.1:8000/api/goods/${itemId}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      items.value = items.value.filter((item) => item.id !== itemId)
      alert('商品删除成功！')
    } else if (response.status === 401) {
      throw new Error('登录已过期，请重新登录')
    } else if (response.status === 403) {
      throw new Error('没有权限删除此商品')
    } else {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || '删除失败')
    }
  } catch (err) {
    console.error('删除商品失败:', err)
    alert('删除失败: ' + err.message)

    if (err.message.includes('登录已过期')) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userInfo')
    }
  }
}

// 🔥 新增：购买商品功能
const purchaseItem = async (itemId, event) => {
  event.stopPropagation()

  if (!confirm('确定要购买这个商品吗？')) {
    return
  }

  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('未找到认证Token，请重新登录')
    }

    const response = await fetch(`http://127.0.0.1:8000/api/goods/${itemId}/purchase/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      alert('购买成功！')
      // 刷新商品列表
      await fetchItems()
    } else if (response.status === 401) {
      throw new Error('登录已过期，请重新登录')
    } else {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || '购买失败')
    }
  } catch (err) {
    console.error('购买商品失败:', err)
    alert('购买失败: ' + err.message)
  }
}

// 🔥 修改：收藏商品功能 - 支持切换收藏状态
const toggleFavorite = async (itemId, event) => {
  event.stopPropagation()

  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('未找到认证Token，请重新登录')
    }

    const item = items.value.find((item) => item.id === itemId)
    if (!item) return

    const isCurrentlyFavorited = item.is_favorited

    if (isCurrentlyFavorited) {
      // 取消收藏
      const response = await fetch(`http://127.0.0.1:8000/api/goods/${itemId}/favorite/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${token}`,
        },
      })

      if (response.ok) {
        item.is_favorited = false
        item.favorites_count = Math.max(0, item.favorites_count - 1)
      } else {
        throw new Error('取消收藏失败')
      }
    } else {
      // 添加收藏
      const response = await fetch(`http://127.0.0.1:8000/api/goods/${itemId}/favorite/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        item.is_favorited = true
        item.favorites_count = (item.favorites_count || 0) + 1
      } else {
        throw new Error('收藏失败')
      }
    }
  } catch (err) {
    console.error('操作收藏失败:', err)
    alert('操作失败: ' + err.message)
  }
}

// 🔥 新增：点赞功能
const toggleLike = async (itemId, event) => {
  event.stopPropagation()

  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('未找到认证Token，请重新登录')
    }

    const item = items.value.find((item) => item.id === itemId)
    if (!item) return

    const isCurrentlyLiked = item.is_liked

    if (isCurrentlyLiked) {
      // 取消点赞
      const response = await fetch(`http://127.0.0.1:8000/api/goods/${itemId}/like/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${token}`,
        },
      })

      if (response.ok) {
        item.is_liked = false
        item.likes_count = Math.max(0, item.likes_count - 1)
      } else {
        throw new Error('取消点赞失败')
      }
    } else {
      // 添加点赞
      const response = await fetch(`http://127.0.0.1:8000/api/goods/${itemId}/like/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        item.is_liked = true
        item.likes_count = (item.likes_count || 0) + 1
      } else {
        throw new Error('点赞失败')
      }
    }
  } catch (err) {
    console.error('操作点赞失败:', err)
    alert('操作失败: ' + err.message)
  }
}

// 页面加载时获取数据
onMounted(async () => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  const token = getAuthToken()

  if (!isAuthenticated || !token) {
    console.log('未登录或Token不存在，显示欢迎页面')
    return
  }

  console.log('已登录，开始获取商品数据...')
  await fetchItems()
})

// 退出登录
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
    window.location.reload()
  }
}

// 导航方法
const goToMyPage = () => {
  router.push('/my')
}

const goToLogin = () => {
  router.push('/')
}

const goToRegister = () => {
  router.push('/register')
}

const goToDetail = (id) => {
  router.push({ name: 'item-detail', params: { id } })
}

const goToPost = () => {
  if (!isAuthenticated.value) {
    router.push('/')
    return
  }
  router.push({ name: 'post-item' })
}

// 格式化价格
const formatPrice = (price) => {
  return `¥${parseFloat(price).toFixed(2)}`
}

// 获取分类显示名称
const getCategoryLabel = (categoryValue) => {
  const category = categories.find((cat) => cat.value === categoryValue)
  return category ? category.label : categoryValue
}

// 🔥 新增：格式化数字，超过1000显示k
const formatCount = (count) => {
  if (!count) return '0'
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count.toString()
}
</script>

<template>
  <div class="container">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="header-left">
        <h1><i class="fas fa-store"></i> 校园二手交易平台</h1>
        <div class="user-info" v-if="currentUser">欢迎，{{ currentUser.username }}！</div>
      </div>
      <div class="header-actions">
        <button class="my-page-btn" @click="goToMyPage" v-if="isAuthenticated">
          <i class="fas fa-user"></i> 我的页面
        </button>
        <button class="add-btn" @click="goToPost" v-if="isAuthenticated">
          <i class="fas fa-plus"></i> 发布商品
        </button>
        <button class="logout-btn" @click="handleLogout" v-if="isAuthenticated">
          <i class="fas fa-sign-out-alt"></i> 退出
        </button>
        <button class="login-btn" @click="goToLogin" v-if="!isAuthenticated">
          <i class="fas fa-sign-in-alt"></i> 登录
        </button>
        <button class="register-btn" @click="goToRegister" v-if="!isAuthenticated">
          <i class="fas fa-user-plus"></i> 注册
        </button>
      </div>
    </div>

    <!-- 未登录时的欢迎页面 -->
    <div v-if="!isAuthenticated" class="welcome-section">
      <div class="welcome-content">
        <h2>欢迎来到校园二手交易平台</h2>
        <p>闲置物品 · 循环利用 · 绿色校园</p>
        <div class="welcome-actions">
          <button class="btn-primary" @click="goToLogin">
            <i class="fas fa-sign-in-alt"></i> 立即登录
          </button>
          <button class="btn-secondary" @click="goToRegister">
            <i class="fas fa-user-plus"></i> 注册账号
          </button>
        </div>
      </div>
    </div>

    <!-- 已登录用户显示商品列表 -->
    <div v-else>
      <!-- 筛选器 -->
      <div class="filters-section">
        <div class="filters">
          <div
            v-for="category in categories"
            :key="category.value"
            :class="['category-filter', selectedCategory === category.value ? 'active' : '']"
            @click="selectedCategory = category.value"
          >
            {{ category.label }}
          </div>
        </div>

        <div class="search-box">
          <input type="text" placeholder="搜索商品名称或描述..." v-model="searchQuery" />
          <button><i class="fas fa-search"></i> 搜索</button>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats">
        共找到 {{ filteredItems.length }} 件商品
        <span v-if="selectedCategory !== '全部'"
          >（分类：{{ getCategoryLabel(selectedCategory) }}）</span
        >
        <span v-if="searchQuery">（关键词：{{ searchQuery }}）</span>
      </div>

      <!-- 加载状态 -->
      <div class="loading" v-if="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>加载中，请稍候...</p>
      </div>

      <!-- 错误状态 -->
      <div class="error" v-else-if="error">
        <i class="fas fa-exclamation-circle"></i>
        <p>加载失败: {{ error }}</p>
        <button @click="fetchItems" class="retry-btn"><i class="fas fa-redo"></i> 重新加载</button>
      </div>

      <!-- 空状态 -->
      <div class="empty" v-else-if="filteredItems.length === 0">
        <i class="fas fa-box-open"></i>
        <p>暂无符合条件的商品</p>
        <button @click="goToPost" class="add-btn"><i class="fas fa-plus"></i> 发布商品</button>
      </div>

      <!-- 商品表格 -->
      <div class="items-table" v-else>
        <table>
          <thead>
            <tr>
              <th>商品信息</th>
              <th>价格</th>
              <th>分类</th>
              <th>状态</th>
              <th>互动数据</th>
              <th>卖家</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredItems"
              :key="item.id"
              @click="goToDetail(item.id)"
              class="item-row"
            >
              <td class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-description">{{ item.description }}</div>
              </td>
              <td class="price">{{ formatPrice(item.price) }}</td>
              <td>
                <span class="category-tag">{{ getCategoryLabel(item.category) }}</span>
              </td>
              <td>
                <span class="condition-tag">{{
                  conditions[item.condition] || item.condition
                }}</span>
              </td>
              <td class="interaction-stats">
                <div class="stats-row">
                  <span class="stat-item" @click.stop="toggleLike(item.id, $event)">
                    <i :class="['fas', 'fa-heart', { liked: item.is_liked }]"></i>
                    {{ formatCount(item.likes_count || 0) }}
                  </span>
                  <span class="stat-item" @click.stop="toggleFavorite(item.id, $event)">
                    <i :class="['fas', 'fa-star', { favorited: item.is_favorited }]"></i>
                    {{ formatCount(item.favorites_count || 0) }}
                  </span>
                  <span class="stat-item">
                    <i class="fas fa-comment"></i>
                    {{ formatCount(item.comments_count || 0) }}
                  </span>
                </div>
              </td>
              <td class="seller">
                {{ item.seller?.username || '未知' }}
              </td>
              <td>
                <div class="actions">
                  <!-- 查看详情按钮 -->
                  <button
                    class="action-btn view-btn"
                    @click.stop="goToDetail(item.id)"
                    title="查看详情"
                  >
                    <i class="fas fa-eye"></i>
                  </button>

                  <!-- 收藏按钮（所有人都可以收藏） -->
                  <button
                    class="action-btn favorite-btn"
                    :class="{ active: item.is_favorited }"
                    @click.stop="toggleFavorite(item.id, $event)"
                    :title="item.is_favorited ? '取消收藏' : '收藏'"
                  >
                    <i class="fas" :class="item.is_favorited ? 'fa-star' : 'fa-star'"></i>
                  </button>

                  <!-- 如果是自己的商品，显示删除按钮 -->
                  <button
                    v-if="isItemOwner(item)"
                    class="action-btn delete-btn"
                    @click.stop="deleteItem(item.id, $event)"
                    title="删除"
                  >
                    <i class="fas fa-trash"></i>
                  </button>

                  <!-- 如果不是自己的商品，显示购买按钮 -->
                  <button
                    v-else
                    class="action-btn buy-btn"
                    @click.stop="purchaseItem(item.id, $event)"
                    title="购买"
                  >
                    <i class="fas fa-shopping-cart"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

/* 头部样式 */
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

.header-left h1 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.8rem;
}

.user-info {
  color: #7f8c8d;
  margin-top: 5px;
}

.header-actions {
  display: flex;
  gap: 15px;
}

/* 按钮样式 */
.my-page-btn {
  background: #9b59b6;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.my-page-btn:hover {
  background: #8e44ad;
  transform: translateY(-2px);
}

.login-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.register-btn {
  background: #27ae60;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-btn {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.logout-btn {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

/* 欢迎页面样式 */
.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 40px;
  border-radius: 15px;
  text-align: center;
  margin-bottom: 30px;
}

.welcome-content h2 {
  font-size: 2.5rem;
  margin-bottom: 15px;
  font-weight: bold;
}

.welcome-content p {
  font-size: 1.2rem;
  margin-bottom: 30px;
  opacity: 0.9;
}

.welcome-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary:hover {
  background: white;
  color: #667eea;
}

/* 筛选区域 */
.filters-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.category-filter {
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.category-filter.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
  transform: scale(1.05);
}

.category-filter:hover {
  border-color: #3498db;
}

.search-box {
  display: flex;
  gap: 10px;
}

.search-box input {
  flex: 1;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.search-box input:focus {
  outline: none;
  border-color: #3498db;
}

.search-box button {
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 统计信息 */
.stats {
  background: white;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  color: #7f8c8d;
  font-size: 14px;
}

/* 商品表格 */
.items-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: linear-gradient(135deg, #34495e, #2c3e50);
  color: white;
  padding: 16px;
  text-align: left;
  font-weight: 600;
}

td {
  padding: 16px;
  border-bottom: 1px solid #ecf0f1;
}

.item-row:hover {
  background: #f8f9fa;
  cursor: pointer;
  transform: translateX(4px);
  transition: all 0.2s ease;
}

.item-info {
  max-width: 300px;
}

.item-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
}

.item-description {
  color: #7f8c8d;
  font-size: 14px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.price {
  color: #e74c3c;
  font-weight: 600;
  font-size: 1.1em;
}

.category-tag,
.condition-tag {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 500;
}

.category-tag {
  background: #e8f4fc;
  color: #3498db;
}

.condition-tag {
  background: #fff3cd;
  color: #856404;
}

/* 🔥 新增：互动数据样式 */
.interaction-stats {
  min-width: 120px;
}

.stats-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #7f8c8d;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 6px;
}

.stat-item:hover {
  background: #f8f9fa;
}

.stat-item .fa-heart.liked {
  color: #e74c3c;
}

.stat-item .fa-star.favorited {
  color: #f39c12;
}

.stat-item .fa-heart,
.stat-item .fa-star,
.stat-item .fa-comment {
  width: 14px;
  text-align: center;
}

.seller {
  color: #7f8c8d;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  transform: scale(1.1);
}

.view-btn {
  background: #3498db;
  color: white;
}
.favorite-btn {
  background: #f39c12;
  color: white;
}
.favorite-btn.active {
  background: #e74c3c;
}
.buy-btn {
  background: #27ae60;
  color: white;
}
.delete-btn {
  background: #95a5a6;
  color: white;
}

/* 状态样式 */
.loading,
.error,
.empty {
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

.empty {
  color: #7f8c8d;
}

.retry-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 15px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }

  .header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .header-actions {
    flex-wrap: wrap;
    justify-content: center;
  }

  .welcome-section {
    padding: 40px 20px;
  }

  .welcome-content h2 {
    font-size: 2rem;
  }

  .welcome-actions {
    flex-direction: column;
    align-items: center;
  }

  .filters {
    justify-content: center;
  }

  .search-box {
    flex-direction: column;
  }

  .actions {
    flex-direction: column;
  }

  table {
    font-size: 14px;
  }

  th,
  td {
    padding: 10px;
  }

  .interaction-stats {
    min-width: auto;
  }

  .stats-row {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
