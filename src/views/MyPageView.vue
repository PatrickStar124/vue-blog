<template>
  <div class="my-page">
    <!-- 页面头部 -->
    <div class="header">
      <button @click="goBack" class="back-btn">返回首页</button>
      <h1>我的个人中心</h1>
      <button @click="goToPost" class="post-btn">发布新商品</button>
    </div>

    <!-- 用户信息区域 -->
    <div class="user-info" v-if="currentUser">
      <div class="avatar">
        <img :src="currentUser.avatar || '/default-avatar.png'" alt="用户头像" />
      </div>
      <div class="user-details">
        <h2>{{ currentUser.username }}</h2>
        <p>{{ currentUser.email }}</p>
        <div class="stats">
          <span>在售商品: {{ sellingItems.length }}</span>
          <span>已购商品: {{ purchasedItems.length }}</span>
        </div>
      </div>
    </div>

    <!-- 选项卡 -->
    <div class="tabs">
      <button
        :class="['tab-btn', { active: activeTab === 'selling' }]"
        @click="activeTab = 'selling'"
      >
        我的出售
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'purchased' }]"
        @click="activeTab = 'purchased'"
      >
        我的购买
      </button>
    </div>

    <!-- 商品列表 -->
    <div class="items-section">
      <h3 v-if="activeTab === 'selling'">我的出售商品</h3>
      <h3 v-else>我购买的商品</h3>

      <!-- 出售商品 -->
      <div v-if="activeTab === 'selling'">
        <div v-if="sellingItems.length === 0" class="empty-state">
          <p>您还没有发布任何商品</p>
          <button @click="goToPost" class="post-first-btn">发布第一个商品</button>
        </div>

        <div v-else class="items-grid">
          <div v-for="item in sellingItems" :key="item.id" class="item-card">
            <div class="item-image">
              <img :src="getImageUrl(item)" :alt="item.name || item.title" />
            </div>
            <div class="item-content">
              <h4 class="item-title">{{ item.name || item.title }}</h4>
              <p class="item-description">{{ item.description }}</p>
              <div class="item-meta">
                <span class="item-price">¥{{ item.price }}</span>
                <span class="item-time">{{ formatDate(item.created_at || item.createTime) }}</span>
              </div>
              <div class="item-status">
                <span :class="['status-badge', item.is_sold ? 'sold' : 'active']">
                  {{ item.is_sold ? '已售出' : '出售中' }}
                </span>
              </div>
            </div>
            <div class="item-actions">
              <button @click="editItem(item)" class="edit-btn">编辑</button>
              <button @click="deleteItem(item.id)" class="delete-btn">删除</button>
              <button
                @click="toggleItemStatus(item)"
                :class="['status-btn', item.is_sold ? 'activate' : 'deactivate']"
                :disabled="item.is_sold"
              >
                {{ item.is_sold ? '已售出' : '下架' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 购买商品 -->
      <div v-if="activeTab === 'purchased'">
        <div v-if="purchasedItems.length === 0" class="empty-state">
          <p>您还没有购买任何商品</p>
          <button @click="goBack" class="post-first-btn">去首页逛逛</button>
        </div>

        <div v-else class="items-grid">
          <div v-for="item in purchasedItems" :key="item.id" class="item-card">
            <div class="item-image">
              <img :src="getImageUrl(item)" :alt="item.name || item.title" />
            </div>
            <div class="item-content">
              <h4 class="item-title">{{ item.name || item.title }}</h4>
              <p class="item-description">{{ item.description }}</p>
              <div class="item-meta">
                <span class="item-price">¥{{ item.price }}</span>
                <span class="item-time">{{ formatDate(item.sold_at || item.updated_at) }}</span>
              </div>
              <div class="item-status">
                <span class="status-badge delivered">已送达</span>
              </div>
            </div>
            <div class="item-actions">
              <button @click="contactSeller(item)" class="edit-btn">联系卖家</button>
              <button @click="viewDetails(item)" class="status-btn">查看详情</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const activeTab = ref('selling')
const loading = ref(false)
const purchasedItems = ref([])
const sellingItems = ref([])

// 用户信息
const currentUser = computed(() => {
  const userData = localStorage.getItem('userInfo')
  return userData ? JSON.parse(userData) : null
})

// 获取我的购买记录
const fetchPurchasedItems = async () => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) return

    const response = await fetch('http://127.0.0.1:8000/api/goods/my-purchases/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      // 适配不同的API响应格式
      if (data.success) {
        purchasedItems.value = data.purchases || []
      } else {
        purchasedItems.value = data || []
      }
    } else {
      console.error('获取购买记录失败，状态码:', response.status)
    }
  } catch (error) {
    console.error('获取购买记录失败:', error)
  }
}

// 获取我的出售商品
const fetchSellingItems = async () => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) return

    const response = await fetch('http://127.0.0.1:8000/api/goods/my-goods/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      // 适配不同的API响应格式
      if (data.success) {
        sellingItems.value = data.goods || []
      } else {
        sellingItems.value = data || []
      }
    } else {
      console.error('获取出售商品失败，状态码:', response.status)
    }
  } catch (error) {
    console.error('获取出售商品失败:', error)
  }
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
      alert('删除失败，请重试')
    }
  } catch (error) {
    console.error('删除商品失败:', error)
    alert('删除失败')
  }
}

// 切换商品状态（上架/下架）
const toggleItemStatus = async (item) => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) return

    const newStatus = !item.is_sold
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${item.id}/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_sold: newStatus,
      }),
    })

    if (response.ok) {
      // 更新本地状态
      item.is_sold = newStatus
      alert(newStatus ? '商品已下架' : '商品已上架')
    } else {
      alert('操作失败，请重试')
    }
  } catch (error) {
    console.error('切换商品状态失败:', error)
    alert('操作失败')
  }
}

// 编辑商品
const editItem = (item) => {
  // 跳转到编辑页面，传递商品ID
  router.push(`/edit-item/${item.id}`)
}

// 联系卖家
const contactSeller = (item) => {
  const seller = item.seller
  if (seller && seller.contact) {
    window.open(`tel:${seller.contact}`, '_blank')
  } else {
    alert('暂无卖家联系方式')
  }
}

// 查看详情
const viewDetails = (item) => {
  router.push(`/item-detail/${item.id}`)
}

// 获取图片URL
const getImageUrl = (item) => {
  if (item.image) return item.image
  if (item.images && item.images.length > 0) return item.images[0]
  return '/default-item.png'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  try {
    return new Date(dateString).toLocaleDateString('zh-CN')
  } catch {
    return String(dateString).split('T')[0] || '未知时间'
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([fetchPurchasedItems(), fetchSellingItems()])
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 导航方法
const goBack = () => {
  router.push('/home')
}

const goToPost = () => {
  router.push('/post-item')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.my-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f5f5;
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
  color: #333;
  margin: 0;
  font-size: 24px;
}

.back-btn,
.post-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.back-btn {
  background-color: #6c757d;
  color: white;
}

.back-btn:hover {
  background-color: #545b62;
}

.post-btn {
  background-color: #007bff;
  color: white;
}

.post-btn:hover {
  background-color: #0056b3;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 30px;
  margin-bottom: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 20px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
}

.user-details p {
  margin: 0 0 12px 0;
  color: #666;
}

.stats {
  display: flex;
  gap: 20px;
}

.stats span {
  padding: 4px 12px;
  background: #f8f9fa;
  border-radius: 15px;
  color: #495057;
  font-size: 14px;
}

/* 选项卡样式 */
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
  transition: all 0.3s;
  font-size: 16px;
}

.tab-btn.active {
  background: #3498db;
  color: white;
}

.tab-btn:hover:not(.active) {
  background: #f1f5f9;
}

.items-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.items-section h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state p {
  margin-bottom: 20px;
  font-size: 16px;
}

.post-first-btn {
  padding: 12px 24px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

.post-first-btn:hover {
  background-color: #218838;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.item-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  background: white;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.item-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-content {
  padding: 16px;
}

.item-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.item-description {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-price {
  font-size: 20px;
  font-weight: bold;
  color: #e74c3c;
}

.item-time {
  font-size: 12px;
  color: #999;
}

.item-status {
  margin-bottom: 12px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background-color: #f8d7da;
  color: #721c24;
}

.status-badge.sold {
  background-color: #e2e3e5;
  color: #383d41;
}

.status-badge.delivered {
  background-color: #d1ecf1;
  color: #0c5460;
}

.status-badge.pending {
  background-color: #fff3cd;
  color: #856404;
}

.item-actions {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px;
}

.item-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  flex: 1;
}

.item-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.edit-btn {
  background-color: #ffc107;
  color: #212529;
}

.edit-btn:hover {
  background-color: #e0a800;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.delete-btn:hover {
  background-color: #c82333;
}

.status-btn {
  background-color: #6c757d;
  color: white;
}

.status-btn.activate {
  background-color: #28a745;
}

.status-btn.activate:hover:not(:disabled) {
  background-color: #218838;
}

.status-btn.deactivate {
  background-color: #ffc107;
  color: #212529;
}

.status-btn.deactivate:hover:not(:disabled) {
  background-color: #e0a800;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

@media (max-width: 768px) {
  .my-page {
    padding: 10px;
  }

  .header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .user-info {
    flex-direction: column;
    text-align: center;
  }

  .avatar {
    margin-right: 0;
    margin-bottom: 15px;
  }

  .items-grid {
    grid-template-columns: 1fr;
  }

  .item-actions {
    flex-direction: column;
  }

  .tabs {
    flex-direction: column;
  }
}
</style>
