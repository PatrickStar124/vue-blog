<!-- MyPageView.vue -->
<template>
  <div class="my-page-container">
    <div class="header">
      <div class="header-left">
        <h1><i class="fas fa-user"></i> 我的页面</h1>
        <div class="user-info" v-if="currentUser">欢迎，{{ currentUser.username }}！</div>
      </div>
      <div class="header-actions">
        <button class="back-btn" @click="goBack"><i class="fas fa-arrow-left"></i> 返回首页</button>
      </div>
    </div>

    <div class="tabs">
      <button
        :class="['tab-btn', { active: activeTab === 'inventory' }]"
        @click="activeTab = 'inventory'"
      >
        <i class="fas fa-box"></i> 我的库存
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'selling' }]"
        @click="activeTab = 'selling'"
      >
        <i class="fas fa-tag"></i> 我的出售
      </button>
      <!-- 🔥 新增：收藏和消息标签 -->
      <button
        :class="['tab-btn', { active: activeTab === 'favorites' }]"
        @click="activeTab = 'favorites'"
      >
        <i class="fas fa-star"></i> 我的收藏
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'messages' }]"
        @click="activeTab = 'messages'"
      >
        <i class="fas fa-envelope"></i> 我的消息
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </button>
    </div>

    <div class="tab-content">
      <!-- 我的库存 -->
      <div v-if="activeTab === 'inventory'" class="inventory-section">
        <div class="section-header">
          <h2>我购买的物件</h2>
          <div class="stats">总计: {{ purchasedItems.length }} 件</div>
        </div>

        <div v-if="loading" class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>加载中...</p>
        </div>

        <div v-else-if="purchasedItems.length === 0" class="empty-state">
          <i class="fas fa-shopping-bag"></i>
          <p>还没有购买任何商品</p>
          <p class="hint-text">去首页逛逛，发现心仪的商品吧！</p>
          <button class="browse-btn" @click="goBack">
            <i class="fas fa-store"></i> 去市场逛逛
          </button>
        </div>

        <div v-else class="items-grid">
          <div v-for="item in purchasedItems" :key="item.id" class="item-card">
            <div class="item-image">
              <img :src="item.image || getDefaultImage()" :alt="item.name" />
              <div class="purchase-badge">已购买</div>
            </div>
            <div class="item-info">
              <h3>{{ item.name }}</h3>
              <p class="item-description">{{ item.description }}</p>
              <div class="item-details">
                <span class="price">¥{{ formatPrice(item.price) }}</span>
                <span class="purchase-date">购买时间: {{ formatDate(item.sold_at) }}</span>
              </div>
              <div class="item-meta">
                <span class="seller">卖家: {{ item.seller?.username || '未知' }}</span>
                <span class="category">{{ getCategoryLabel(item.category) }}</span>
              </div>
              <div class="item-status delivered"><i class="fas fa-check-circle"></i> 交易完成</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 我的出售 -->
      <div v-if="activeTab === 'selling'" class="selling-section">
        <div class="section-header">
          <h2>我正在出售的商品</h2>
          <button class="add-btn" @click="goToPost"><i class="fas fa-plus"></i> 发布新商品</button>
        </div>

        <div v-if="loading" class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>加载中...</p>
        </div>

        <div v-else-if="sellingItems.length === 0" class="empty-state">
          <i class="fas fa-tags"></i>
          <p>还没有出售任何商品</p>
          <button class="add-btn" @click="goToPost"><i class="fas fa-plus"></i> 开始出售</button>
        </div>

        <div v-else class="items-grid">
          <div v-for="item in sellingItems" :key="item.id" class="item-card">
            <div class="item-image">
              <img :src="item.image || getDefaultImage()" :alt="item.name" />
              <div class="item-actions">
                <button @click="editItem(item)" class="action-btn edit" title="编辑">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="deleteItem(item.id)" class="action-btn delete" title="删除">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
              <div v-if="item.is_sold" class="sold-overlay">
                <span>已售出</span>
              </div>
            </div>
            <div class="item-info">
              <h3>{{ item.name }}</h3>
              <p class="item-description">{{ item.description }}</p>
              <div class="item-details">
                <span class="price">¥{{ formatPrice(item.price) }}</span>
                <div class="item-stats">
                  <span><i class="fas fa-eye"></i> {{ item.views || 0 }}</span>
                  <span><i class="fas fa-heart"></i> {{ item.likes_count || 0 }}</span>
                  <span><i class="fas fa-star"></i> {{ item.favorites_count || 0 }}</span>
                  <span><i class="fas fa-comment"></i> {{ item.comments_count || 0 }}</span>
                </div>
              </div>
              <div class="item-meta">
                <span class="category">{{ getCategoryLabel(item.category) }}</span>
                <span class="condition">{{ getConditionLabel(item.condition) }}</span>
              </div>
              <div class="item-status" :class="item.is_sold ? 'sold' : 'selling'">
                {{ item.is_sold ? '已售出' : '出售中' }}
              </div>
              <div class="item-date">发布时间: {{ formatDate(item.created_at) }}</div>
              <div v-if="item.is_sold && item.buyer" class="buyer-info">
                购买者: {{ item.buyer.username }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 🔥 新增：我的收藏 -->
      <div v-if="activeTab === 'favorites'" class="favorites-section">
        <div class="section-header">
          <h2>我的收藏</h2>
          <div class="stats">总计: {{ favoriteItems.length }} 件</div>
        </div>

        <div v-if="loading" class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>加载中...</p>
        </div>

        <div v-else-if="favoriteItems.length === 0" class="empty-state">
          <i class="fas fa-star"></i>
          <p>还没有收藏任何商品</p>
          <p class="hint-text">去首页发现喜欢的商品并收藏吧！</p>
          <button class="browse-btn" @click="goBack">
            <i class="fas fa-store"></i> 去市场逛逛
          </button>
        </div>

        <div v-else class="items-grid">
          <div v-for="item in favoriteItems" :key="item.id" class="item-card">
            <div class="item-image">
              <img :src="item.image || getDefaultImage()" :alt="item.name" />
              <div class="favorite-badge">
                <i class="fas fa-star"></i>
              </div>
              <div class="item-actions">
                <button
                  @click="removeFromFavorites(item.id)"
                  class="action-btn remove"
                  title="取消收藏"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div v-if="item.is_sold" class="sold-overlay">
                <span>已售出</span>
              </div>
            </div>
            <div class="item-info">
              <h3>{{ item.name }}</h3>
              <p class="item-description">{{ item.description }}</p>
              <div class="item-details">
                <span class="price">¥{{ formatPrice(item.price) }}</span>
                <div class="item-stats">
                  <span><i class="fas fa-heart"></i> {{ item.likes_count || 0 }}</span>
                  <span><i class="fas fa-star"></i> {{ item.favorites_count || 0 }}</span>
                  <span><i class="fas fa-comment"></i> {{ item.comments_count || 0 }}</span>
                </div>
              </div>
              <div class="item-meta">
                <span class="seller">卖家: {{ item.seller?.username || '未知' }}</span>
                <span class="category">{{ getCategoryLabel(item.category) }}</span>
              </div>
              <div class="item-status" :class="item.is_sold ? 'sold' : 'selling'">
                {{ item.is_sold ? '已售出' : '出售中' }}
              </div>
              <div class="item-actions-footer">
                <button class="view-btn" @click="viewItem(item.id)">
                  <i class="fas fa-eye"></i> 查看详情
                </button>
                <button
                  v-if="!item.is_sold && !isItemOwner(item)"
                  class="buy-btn"
                  @click="purchaseItem(item)"
                >
                  <i class="fas fa-shopping-cart"></i> 立即购买
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 🔥 新增：我的消息 -->
      <div v-if="activeTab === 'messages'" class="messages-section">
        <div class="section-header">
          <h2>我的消息</h2>
          <div class="stats">
            未读: {{ unreadCount }} | 总计: {{ sentMessages.length + receivedMessages.length }}
          </div>
        </div>

        <div v-if="messagesLoading" class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>加载消息中...</p>
        </div>

        <div
          v-else-if="sentMessages.length === 0 && receivedMessages.length === 0"
          class="empty-state"
        >
          <i class="fas fa-envelope-open"></i>
          <p>还没有任何消息</p>
          <p class="hint-text">与其他用户互动时会收到消息</p>
        </div>

        <div v-else class="messages-content">
          <!-- 收到的消息 -->
          <div class="messages-group" v-if="receivedMessages.length > 0">
            <h3>收到的消息 ({{ receivedMessages.length }})</h3>
            <div class="messages-list">
              <div
                v-for="message in receivedMessages"
                :key="message.id"
                class="message-item"
                :class="{ unread: !message.is_read }"
                @click="viewMessage(message)"
              >
                <div class="message-header">
                  <div class="sender-info">
                    <i class="fas fa-user-circle"></i>
                    <span class="sender-name">{{ message.sender?.username || '未知用户' }}</span>
                    <span class="message-goods">关于: {{ message.goods?.name || '未知商品' }}</span>
                  </div>
                  <div class="message-meta">
                    <span class="message-time">{{ formatDate(message.created_at) }}</span>
                    <span v-if="!message.is_read" class="unread-badge">未读</span>
                  </div>
                </div>
                <div class="message-content">
                  {{ message.content }}
                </div>
              </div>
            </div>
          </div>

          <!-- 发送的消息 -->
          <div class="messages-group" v-if="sentMessages.length > 0">
            <h3>发送的消息 ({{ sentMessages.length }})</h3>
            <div class="messages-list">
              <div v-for="message in sentMessages" :key="message.id" class="message-item sent">
                <div class="message-header">
                  <div class="sender-info">
                    <i class="fas fa-user-circle"></i>
                    <span class="sender-name"
                      >发给: {{ message.receiver?.username || '未知用户' }}</span
                    >
                    <span class="message-goods">关于: {{ message.goods?.name || '未知商品' }}</span>
                  </div>
                  <div class="message-meta">
                    <span class="message-time">{{ formatDate(message.created_at) }}</span>
                  </div>
                </div>
                <div class="message-content">
                  {{ message.content }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 🔥 新增：消息详情模态框 -->
    <div v-if="selectedMessage" class="modal-overlay" @click="selectedMessage = null">
      <div class="modal-content message-detail" @click.stop>
        <div class="modal-header">
          <h3>消息详情</h3>
          <button class="close-btn" @click="selectedMessage = null">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="message-info">
            <div class="info-item">
              <label>发件人:</label>
              <span>{{ selectedMessage.sender?.username || '未知用户' }}</span>
            </div>
            <div class="info-item">
              <label>收件人:</label>
              <span>{{ selectedMessage.receiver?.username || '未知用户' }}</span>
            </div>
            <div class="info-item">
              <label>相关商品:</label>
              <span>{{ selectedMessage.goods?.name || '未知商品' }}</span>
            </div>
            <div class="info-item">
              <label>发送时间:</label>
              <span>{{ formatDate(selectedMessage.created_at) }}</span>
            </div>
          </div>
          <div class="message-content-detail">
            <label>消息内容:</label>
            <div class="content-text">{{ selectedMessage.content }}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="close-detail-btn" @click="selectedMessage = null">关闭</button>
          <button
            v-if="!selectedMessage.is_read && selectedMessage.receiver?.id === currentUser?.id"
            class="mark-read-btn"
            @click="markAsRead(selectedMessage.id)"
          >
            标记为已读
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const activeTab = ref('inventory')
const loading = ref(false)
const messagesLoading = ref(false)

// 🔥 新增：消息相关数据
const sentMessages = ref([])
const receivedMessages = ref([])
const selectedMessage = ref(null)

// 用户信息
const currentUser = computed(() => {
  const userData = localStorage.getItem('userInfo')
  return userData ? JSON.parse(userData) : null
})

// 数据
const purchasedItems = ref([])
const sellingItems = ref([])
const favoriteItems = ref([]) // 🔥 新增：收藏商品

// 🔥 新增：计算未读消息数量
const unreadCount = computed(() => {
  return receivedMessages.value.filter((message) => !message.is_read).length
})

// 分类选项
const categories = [
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

// 获取认证Token
const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

// 获取我的出售商品
const fetchSellingItems = async () => {
  try {
    const token = getAuthToken()
    if (!token) return

    const response = await fetch('http://127.0.0.1:8000/api/user-goods/my-goods/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        sellingItems.value = data.goods || []
      }
    }
  } catch (error) {
    console.error('获取出售商品失败:', error)
  }
}

// 获取我的购买记录
const fetchPurchasedItems = async () => {
  try {
    const token = getAuthToken()
    if (!token) return

    const response = await fetch('http://127.0.0.1:8000/api/user-goods/my-purchases/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        purchasedItems.value = data.purchases || []
      }
    }
  } catch (error) {
    console.error('获取购买记录失败:', error)
  }
}

// 🔥 新增：获取我的收藏
const fetchFavoriteItems = async () => {
  try {
    const token = getAuthToken()
    if (!token) return

    const response = await fetch('http://127.0.0.1:8000/api/user/favorites/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        favoriteItems.value = data.favorites || []
      }
    }
  } catch (error) {
    console.error('获取收藏商品失败:', error)
  }
}

// 🔥 新增：获取我的消息
const fetchMessages = async () => {
  messagesLoading.value = true
  try {
    const token = getAuthToken()
    if (!token) return

    const response = await fetch('http://127.0.0.1:8000/api/user/messages/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        sentMessages.value = data.sent_messages || []
        receivedMessages.value = data.received_messages || []
      }
    }
  } catch (error) {
    console.error('获取消息失败:', error)
  } finally {
    messagesLoading.value = false
  }
}

// 🔥 新增：从收藏中移除
const removeFromFavorites = async (itemId) => {
  if (!confirm('确定要从收藏中移除这个商品吗？')) {
    return
  }

  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${itemId}/favorite/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      favoriteItems.value = favoriteItems.value.filter((item) => item.id !== itemId)
      alert('已从收藏中移除！')
    } else {
      throw new Error('移除收藏失败')
    }
  } catch (err) {
    console.error('移除收藏失败:', err)
    alert('移除失败: ' + err.message)
  }
}

// 🔥 新增：查看消息详情
const viewMessage = (message) => {
  selectedMessage.value = message
  // 如果是未读消息，标记为已读
  if (!message.is_read && message.receiver?.id === currentUser.value?.id) {
    markAsRead(message.id)
  }
}

// 🔥 新增：标记消息为已读
const markAsRead = async (messageId) => {
  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/messages/${messageId}/read/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      // 更新本地状态
      const message = receivedMessages.value.find((msg) => msg.id === messageId)
      if (message) {
        message.is_read = true
      }
      if (selectedMessage.value && selectedMessage.value.id === messageId) {
        selectedMessage.value.is_read = true
      }
    }
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

// 🔥 新增：判断是否是商品所有者
const isItemOwner = (item) => {
  return currentUser.value && item.seller && item.seller.id === currentUser.value.id
}

// 🔥 新增：查看商品详情
const viewItem = (itemId) => {
  router.push(`/item/${itemId}`)
}

// 🔥 新增：购买商品
const purchaseItem = async (item) => {
  if (!confirm(`确定要购买 "${item.name}" 吗？\n价格：¥${item.price}`)) {
    return
  }

  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${item.id}/purchase/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (data.success) {
      alert('购买成功！')
      // 刷新数据
      await loadData()
    } else {
      throw new Error(data.message || '购买失败')
    }
  } catch (err) {
    console.error('购买失败:', err)
    alert('购买失败: ' + err.message)
  }
}

// 获取默认图片
const getDefaultImage = () => {
  return '/api/placeholder/200/150'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  try {
    const date = new Date(dateString)
    return (
      date.toLocaleDateString('zh-CN') +
      ' ' +
      date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    )
  } catch {
    return dateString
  }
}

// 格式化价格
const formatPrice = (price) => {
  return parseFloat(price).toFixed(2)
}

// 获取分类显示名称
const getCategoryLabel = (categoryValue) => {
  const category = categories.find((cat) => cat.value === categoryValue)
  return category ? category.label : categoryValue
}

// 获取状态显示名称
const getConditionLabel = (conditionValue) => {
  return conditions[conditionValue] || conditionValue
}

// 删除商品
const deleteItem = async (itemId) => {
  if (!confirm('确定要删除这个商品吗？')) {
    return
  }

  try {
    const token = getAuthToken()
    if (!token) return

    const response = await fetch(`http://127.0.0.1:8000/api/goods/${itemId}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      // 从本地列表中移除
      sellingItems.value = sellingItems.value.filter((item) => item.id !== itemId)
      alert('商品删除成功！')
    } else {
      const data = await response.json()
      alert('删除失败: ' + (data.message || '未知错误'))
    }
  } catch (error) {
    console.error('删除商品失败:', error)
    alert('删除失败，请检查网络连接')
  }
}

// 编辑商品
const editItem = (item) => {
  alert('编辑功能开发中...')
}

// 导航方法
const goBack = () => {
  router.push('/home')
}

const goToPost = () => {
  router.push('/post-item')
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchSellingItems(),
      fetchPurchasedItems(),
      fetchFavoriteItems(), // 🔥 新增：加载收藏
      fetchMessages(), // 🔥 新增：加载消息
    ])
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.my-page-container {
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

.header h1 {
  color: #2c3e50;
  margin: 0;
}

.user-info {
  color: #7f8c8d;
  margin-top: 5px;
}

.tabs {
  display: flex;
  margin-bottom: 20px;
  background: white;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.tab-btn {
  flex: 1;
  padding: 15px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  position: relative;
  min-width: 120px;
}

.tab-btn.active {
  background: #3498db;
  color: white;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header h2 {
  color: #2c3e50;
  margin: 0;
}

.stats {
  color: #7f8c8d;
  font-size: 14px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.item-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease;
  position: relative;
}

.item-card:hover {
  transform: translateY(-5px);
}

.item-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.purchase-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #27ae60;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.favorite-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #f39c12;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.item-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.item-card:hover .item-actions {
  opacity: 1;
}

.action-btn {
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.1);
}

.action-btn.edit {
  background: #f39c12;
}

.action-btn.delete {
  background: #e74c3c;
}

.action-btn.remove {
  background: #95a5a6;
}

.sold-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.item-info {
  padding: 15px;
}

.item-info h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.item-description {
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.price {
  font-size: 18px;
  font-weight: bold;
  color: #e74c3c;
}

.purchase-date {
  font-size: 12px;
  color: #95a5a6;
}

.item-stats {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #95a5a6;
  flex-wrap: wrap;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
}

.seller,
.category,
.condition {
  color: #7f8c8d;
}

.item-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 5px;
}

.item-status.selling {
  background: #d4edda;
  color: #155724;
}

.item-status.sold {
  background: #f8d7da;
  color: #721c24;
}

.item-status.delivered {
  background: #d1ecf1;
  color: #0c5460;
}

.item-date {
  font-size: 12px;
  color: #95a5a6;
  margin-bottom: 5px;
}

.buyer-info {
  font-size: 12px;
  color: #7f8c8d;
  font-style: italic;
}

/* 🔥 新增：收藏页面操作按钮 */
.item-actions-footer {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.view-btn,
.buy-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: all 0.2s ease;
}

.view-btn {
  background: #3498db;
  color: white;
}

.buy-btn {
  background: #27ae60;
  color: white;
}

.view-btn:hover,
.buy-btn:hover {
  transform: translateY(-2px);
}

/* 🔥 新增：消息页面样式 */
.messages-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.messages-group h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ecf0f1;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message-item {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #3498db;
}

.message-item.unread {
  background: #f8f9fa;
  border-left-color: #e74c3c;
}

.message-item.sent {
  border-left-color: #27ae60;
}

.message-item:hover {
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sender-name {
  font-weight: 600;
  color: #2c3e50;
}

.message-goods {
  font-size: 12px;
  color: #7f8c8d;
  background: #ecf0f1;
  padding: 2px 6px;
  border-radius: 10px;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.message-time {
  font-size: 12px;
  color: #95a5a6;
}

.unread-badge {
  background: #e74c3c;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: bold;
}

.message-content {
  color: #5d6d7e;
  line-height: 1.4;
}

/* 🔥 新增：消息详情模态框 */
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

.message-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.info-item {
  display: flex;
  justify-content: space-between;
}

.info-item label {
  font-weight: 600;
  color: #2c3e50;
}

.info-item span {
  color: #5d6d7e;
}

.message-content-detail label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 10px;
}

.content-text {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  line-height: 1.5;
  color: #5d6d7e;
}

.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #ecf0f1;
}

.close-detail-btn,
.mark-read-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.close-detail-btn {
  background: #95a5a6;
  color: white;
}

.mark-read-btn {
  background: #3498db;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  color: #7f8c8d;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 20px;
  color: #bdc3c7;
}

.hint-text {
  font-size: 14px;
  color: #95a5a6;
  margin: 10px 0;
}

.back-btn,
.browse-btn,
.add-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.back-btn {
  background: #95a5a6;
  color: white;
}

.browse-btn {
  background: #3498db;
  color: white;
}

.add-btn {
  background: #27ae60;
  color: white;
}

.back-btn:hover {
  background: #7f8c8d;
}

.browse-btn:hover {
  background: #2980b9;
}

.add-btn:hover {
  background: #219a52;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading i {
  font-size: 32px;
  color: #3498db;
  margin-bottom: 15px;
}

@media (max-width: 768px) {
  .my-page-container {
    padding: 10px;
  }

  .header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .tabs {
    flex-direction: column;
  }

  .tab-btn {
    min-width: auto;
  }

  .section-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .items-grid {
    grid-template-columns: 1fr;
  }

  .item-actions {
    opacity: 1;
  }

  .message-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .sender-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .item-actions-footer {
    flex-direction: column;
  }
}
</style>
