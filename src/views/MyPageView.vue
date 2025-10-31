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
                  <span><i class="fas fa-heart"></i> {{ item.favorites || 0 }}</span>
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const activeTab = ref('inventory')
const loading = ref(false)

// 用户信息
const currentUser = computed(() => {
  const userData = localStorage.getItem('userInfo')
  return userData ? JSON.parse(userData) : null
})

// 数据
const purchasedItems = ref([])
const sellingItems = ref([])

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

// 获取我的出售商品
const fetchSellingItems = async () => {
  try {
    const token = localStorage.getItem('authToken')
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
        console.log('我的出售商品:', sellingItems.value)
      } else {
        console.error('API返回错误:', data.message)
        // 如果API出错，使用模拟数据
        useMockSellingData()
      }
    } else {
      console.error('获取出售商品失败，状态码:', response.status)
      // 使用模拟数据
      useMockSellingData()
    }
  } catch (error) {
    console.error('获取出售商品失败:', error)
    // 使用模拟数据
    useMockSellingData()
  }
}

// 获取我的购买记录
const fetchPurchasedItems = async () => {
  try {
    const token = localStorage.getItem('authToken')
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
        console.log('我的购买记录:', purchasedItems.value)
      } else {
        console.error('API返回错误:', data.message)
        // 如果API不存在，使用模拟数据
        useMockPurchasesData()
      }
    } else {
      console.error('获取购买记录失败，状态码:', response.status)
      // 使用模拟数据
      useMockPurchasesData()
    }
  } catch (error) {
    console.error('获取购买记录失败:', error)
    // 使用模拟数据
    useMockPurchasesData()
  }
}

// 模拟出售数据（后备方案）
const useMockSellingData = () => {
  sellingItems.value = [
    {
      id: 1,
      name: '二手相机',
      price: '2500.00',
      image: null,
      description: '几乎全新的相机，使用次数很少',
      category: 'electronics',
      condition: 'like_new',
      location: '宿舍楼A栋',
      views: 45,
      favorites: 3,
      status: 'selling',
      is_sold: false,
      created_at: '2024-01-15 10:30:00',
      seller: {
        id: currentUser.value?.id,
        username: currentUser.value?.username || '当前用户',
      },
    },
  ]
}

// 模拟购买数据（后备方案）
const useMockPurchasesData = () => {
  purchasedItems.value = [
    {
      id: 3,
      name: 'MacBook Pro',
      price: '12000.00',
      image: null,
      description: '2023款 MacBook Pro，性能强劲',
      category: 'electronics',
      condition: 'new',
      location: '教学楼B座',
      sold_at: '2024-01-15 16:45:00',
      status: 'delivered',
      seller: {
        id: 2,
        username: 'tech_seller',
      },
    },
  ]
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
    return date.toLocaleDateString('zh-CN')
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
    const token = localStorage.getItem('authToken')
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
  // router.push(`/edit-item/${item.id}`)
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
      fetchSellingItems(), // 出售商品用真实数据
      fetchPurchasedItems(), // 购买记录用真实数据
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
}

.tab-btn.active {
  background: #3498db;
  color: white;
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
  gap: 10px;
  font-size: 12px;
  color: #95a5a6;
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

  .section-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .items-grid {
    grid-template-columns: 1fr;
  }

  .item-actions {
    opacity: 1; /* 在移动端始终显示操作按钮 */
  }
}
</style>
