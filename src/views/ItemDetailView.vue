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
      <!-- 商品基本信息 -->
      <div class="item-main">
        <div class="item-images">
          <img
            :src="item.image || '/api/placeholder/400x300'"
            :alt="item.name"
            class="main-image"
          />
        </div>

        <div class="item-info">
          <h2 class="item-title">{{ item.name }}</h2>

          <!-- 出售状态 -->
          <div class="item-status">
            <span v-if="item.is_sold" class="status-badge sold">已售出</span>
            <span v-else class="status-badge available">出售中</span>
          </div>

          <div class="item-price">¥{{ formatPrice(item.price) }}</div>

          <!-- 🔥 新增：互动数据 -->
          <div class="interaction-stats">
            <div class="stat-item" @click="toggleLike" :class="{ active: item.is_liked }">
              <i class="fas fa-heart"></i>
              <span>{{ item.likes_count || 0 }} 点赞</span>
            </div>
            <div class="stat-item" @click="toggleFavorite" :class="{ active: item.is_favorited }">
              <i class="fas fa-star"></i>
              <span>{{ item.favorites_count || 0 }} 收藏</span>
            </div>
            <div class="stat-item">
              <i class="fas fa-comment"></i>
              <span>{{ item.comments_count || 0 }} 评论</span>
            </div>
          </div>

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

            <!-- 留言按钮（非自己的商品） -->
            <button v-if="!isItemOwner" class="message-btn" @click="showMessageModal = true">
              <i class="fas fa-envelope"></i> 联系卖家
            </button>

            <!-- 商品所有者操作 -->
            <div v-if="isItemOwner" class="owner-actions">
              <button class="edit-btn" @click="editItem">
                <i class="fas fa-edit"></i> 编辑商品
              </button>
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

      <!-- 🔥 新增：评论区域 -->
      <div class="comments-section">
        <div class="section-header">
          <h3>商品评论 ({{ comments.length }})</h3>
          <button class="add-comment-btn" @click="showCommentModal = true" v-if="!isItemOwner">
            <i class="fas fa-plus"></i> 添加评论
          </button>
        </div>

        <div v-if="commentsLoading" class="loading-comments">
          <i class="fas fa-spinner fa-spin"></i>
          <p>加载评论中...</p>
        </div>

        <div v-else-if="comments.length === 0" class="no-comments">
          <i class="fas fa-comment-slash"></i>
          <p>暂无评论</p>
          <p class="hint-text">成为第一个评论的人吧！</p>
        </div>

        <div v-else class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <div class="user-info">
                <i class="fas fa-user-circle"></i>
                <span class="username">{{ comment.user?.username || '匿名用户' }}</span>
                <div class="rating">
                  <i
                    v-for="star in 5"
                    :key="star"
                    class="fas fa-star"
                    :class="{ active: star <= comment.rating }"
                  ></i>
                </div>
              </div>
              <div class="comment-actions">
                <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
                <button
                  v-if="comment.user?.id === currentUser?.id"
                  @click="deleteComment(comment.id)"
                  class="delete-comment-btn"
                  title="删除评论"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <div class="comment-content">
              {{ comment.content }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 🔥 新增：评论模态框 -->
    <div v-if="showCommentModal" class="modal-overlay" @click="showCommentModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加评论</h3>
          <button class="close-btn" @click="showCommentModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="rating-input">
            <label>评分：</label>
            <div class="stars">
              <i
                v-for="star in 5"
                :key="star"
                class="fas fa-star"
                :class="{ active: star <= newComment.rating }"
                @click="newComment.rating = star"
              ></i>
            </div>
          </div>
          <div class="comment-input">
            <label>评论内容：</label>
            <textarea
              v-model="newComment.content"
              placeholder="请输入您的评论..."
              rows="4"
              maxlength="500"
            ></textarea>
            <div class="char-count">{{ newComment.content.length }}/500</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showCommentModal = false">取消</button>
          <button class="submit-btn" @click="submitComment" :disabled="!canSubmitComment">
            提交评论
          </button>
        </div>
      </div>
    </div>

    <!-- 🔥 新增：留言模态框 -->
    <div v-if="showMessageModal" class="modal-overlay" @click="showMessageModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>联系卖家</h3>
          <button class="close-btn" @click="showMessageModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="message-input">
            <label>留言内容：</label>
            <textarea
              v-model="newMessage.content"
              placeholder="请输入您想对卖家说的话..."
              rows="4"
              maxlength="500"
            ></textarea>
            <div class="char-count">{{ newMessage.content.length }}/500</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showMessageModal = false">取消</button>
          <button class="submit-btn" @click="submitMessage" :disabled="!newMessage.content.trim()">
            发送留言
          </button>
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

// 🔥 新增：评论相关数据
const comments = ref([])
const commentsLoading = ref(false)
const showCommentModal = ref(false)
const newComment = ref({
  rating: 5,
  content: '',
})

// 🔥 新增：留言相关数据
const showMessageModal = ref(false)
const newMessage = ref({
  content: '',
})

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

const canSubmitComment = computed(() => {
  return newComment.value.rating > 0 && newComment.value.content.trim().length > 0
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
      // 加载评论
      await fetchComments()
    } else {
      throw new Error(data.message || '获取商品详情失败')
    }
  } catch (err) {
    console.error('获取商品详情失败:', err)
    error.value = err.message

    if (err.message.includes('登录已过期') || err.message.includes('请先登录')) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userInfo')
    }
  } finally {
    loading.value = false
  }
}

// 🔥 新增：获取评论
const fetchComments = async () => {
  if (!item.value) return

  commentsLoading.value = true
  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${item.value.id}/comments/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        comments.value = data.comments || []
      }
    }
  } catch (err) {
    console.error('获取评论失败:', err)
  } finally {
    commentsLoading.value = false
  }
}

// 🔥 新增：切换点赞
const toggleLike = async () => {
  if (!isAuthenticated.value) {
    alert('请先登录')
    return
  }

  try {
    const token = getAuthToken()
    const method = item.value.is_liked ? 'DELETE' : 'POST'

    const response = await fetch(`http://127.0.0.1:8000/api/goods/${item.value.id}/like/`, {
      method: method,
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      // 更新本地状态
      item.value.is_liked = !item.value.is_liked
      if (item.value.is_liked) {
        item.value.likes_count = (item.value.likes_count || 0) + 1
      } else {
        item.value.likes_count = Math.max(0, (item.value.likes_count || 1) - 1)
      }
    }
  } catch (err) {
    console.error('操作点赞失败:', err)
    alert('操作失败: ' + err.message)
  }
}

// 🔥 新增：切换收藏
const toggleFavorite = async () => {
  if (!isAuthenticated.value) {
    alert('请先登录')
    return
  }

  try {
    const token = getAuthToken()
    const method = item.value.is_favorited ? 'DELETE' : 'POST'

    const response = await fetch(`http://127.0.0.1:8000/api/goods/${item.value.id}/favorite/`, {
      method: method,
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      // 更新本地状态
      item.value.is_favorited = !item.value.is_favorited
      if (item.value.is_favorited) {
        item.value.favorites_count = (item.value.favorites_count || 0) + 1
      } else {
        item.value.favorites_count = Math.max(0, (item.value.favorites_count || 1) - 1)
      }
    }
  } catch (err) {
    console.error('操作收藏失败:', err)
    alert('操作失败: ' + err.message)
  }
}

// 🔥 新增：提交评论
const submitComment = async () => {
  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${item.value.id}/comments/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newComment.value),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        comments.value.unshift(data.comment)
        item.value.comments_count = (item.value.comments_count || 0) + 1
        showCommentModal.value = false
        newComment.value = { rating: 5, content: '' }
        alert('评论发布成功！')
      }
    } else {
      throw new Error('发布评论失败')
    }
  } catch (err) {
    console.error('发布评论失败:', err)
    alert('发布评论失败: ' + err.message)
  }
}

// 🔥 新增：删除评论
const deleteComment = async (commentId) => {
  if (!confirm('确定要删除这条评论吗？')) {
    return
  }

  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/comments/${commentId}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      comments.value = comments.value.filter((comment) => comment.id !== commentId)
      item.value.comments_count = Math.max(0, (item.value.comments_count || 1) - 1)
      alert('评论删除成功！')
    } else {
      throw new Error('删除评论失败')
    }
  } catch (err) {
    console.error('删除评论失败:', err)
    alert('删除评论失败: ' + err.message)
  }
}

// 🔥 新增：发送留言
const submitMessage = async () => {
  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${item.value.id}/messages/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newMessage.value),
    })

    if (response.ok) {
      showMessageModal.value = false
      newMessage.value = { content: '' }
      alert('留言发送成功！')
    } else {
      throw new Error('发送留言失败')
    }
  } catch (err) {
    console.error('发送留言失败:', err)
    alert('发送留言失败: ' + err.message)
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
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.item-main {
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

/* 🔥 新增：互动数据样式 */
.interaction-stats {
  display: flex;
  gap: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: #e9ecef;
}

.stat-item.active {
  color: #e74c3c;
}

.stat-item.active .fa-heart {
  color: #e74c3c;
}

.stat-item.active .fa-star {
  color: #f39c12;
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

.message-btn {
  background: #3498db;
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

/* 🔥 新增：评论区域样式 */
.comments-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #ecf0f1;
}

.section-header h3 {
  color: #2c3e50;
  margin: 0;
}

.add-comment-btn {
  background: #27ae60;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.loading-comments,
.no-comments {
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
}

.no-comments i {
  font-size: 48px;
  margin-bottom: 15px;
  color: #bdc3c7;
}

.hint-text {
  font-size: 14px;
  color: #95a5a6;
  margin-top: 5px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  padding: 20px;
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  background: #f8f9fa;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  font-weight: 600;
  color: #2c3e50;
}

.rating {
  display: flex;
  gap: 2px;
}

.rating .fa-star {
  color: #ddd;
  font-size: 12px;
}

.rating .fa-star.active {
  color: #f39c12;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.comment-date {
  font-size: 12px;
  color: #95a5a6;
}

.delete-comment-btn {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.delete-comment-btn:hover {
  background: #fdeded;
}

.comment-content {
  color: #5d6d7e;
  line-height: 1.5;
}

/* 🔥 新增：模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ecf0f1;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #7f8c8d;
}

.modal-body {
  padding: 20px;
}

.rating-input,
.comment-input,
.message-input {
  margin-bottom: 20px;
}

.rating-input label,
.comment-input label,
.message-input label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.stars {
  display: flex;
  gap: 5px;
}

.stars .fa-star {
  color: #ddd;
  cursor: pointer;
  font-size: 24px;
  transition: color 0.2s ease;
}

.stars .fa-star.active {
  color: #f39c12;
}

.stars .fa-star:hover {
  color: #f39c12;
}

textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: #3498db;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #95a5a6;
  margin-top: 5px;
}

.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #ecf0f1;
}

.cancel-btn,
.submit-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
}

.submit-btn {
  background: #3498db;
  color: white;
}

.submit-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
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

  .item-main {
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

  .interaction-stats {
    flex-direction: column;
    gap: 10px;
  }

  .owner-actions {
    flex-direction: column;
  }

  .section-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .error-actions {
    flex-direction: column;
  }
}
</style>
