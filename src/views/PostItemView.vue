<!-- src/views/PostItem.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const itemForm = ref({
  name: '',
  price: '',
  description: '',
  category: 'electronics',
  condition: 'good',
  location: '北京',
  contact: '',
  image_url: 'https://via.placeholder.com/300x200?text=商品图片',
})

const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

const isFormValid = computed(() => {
  return (
    itemForm.value.name.trim() &&
    itemForm.value.description.trim() &&
    parseFloat(itemForm.value.price) > 0 &&
    itemForm.value.contact.trim()
  )
})

const checkAuth = () => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  if (!isAuthenticated) {
    errorMessage.value = '请先登录'
    setTimeout(() => router.push('/login'), 1500)
    return false
  }
  return true
}

const submitItem = async () => {
  if (!checkAuth()) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const csrfResponse = await fetch('http://127.0.0.1:8000/api/auth/csrf-token/', {
      credentials: 'include',
    })
    if (!csrfResponse.ok) throw new Error('CSRF token 获取失败')

    const csrfData = await csrfResponse.json()
    const csrfToken = csrfData.csrfToken
    if (!csrfToken) throw new Error('未获取到有效的 CSRF token')

    const submitData = {
      name: itemForm.value.name.trim(),
      price: parseFloat(itemForm.value.price),
      description: itemForm.value.description.trim(),
      category: itemForm.value.category,
      condition: itemForm.value.condition,
      location: itemForm.value.location.trim(),
      contact: itemForm.value.contact.trim(),
      image_url:
        itemForm.value.image_url.trim() || 'https://via.placeholder.com/300x200?text=商品图片',
    }

    const response = await fetch('http://127.0.0.1:8000/api/goods/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
        Origin: 'http://localhost:5173',
      },
      body: JSON.stringify(submitData),
      credentials: 'include',
    })

    if (response.status === 201) {
      successMessage.value = '商品发布成功！'
      itemForm.value = {
        name: '',
        price: '',
        description: '',
        category: 'electronics',
        condition: 'good',
        location: '北京',
        contact: '',
        image_url: 'https://via.placeholder.com/300x200?text=商品图片',
      }
      setTimeout(() => router.push('/home'), 2000)
    } else if (response.status === 403) {
      throw new Error('安全验证失败，请刷新页面重试')
    } else if (response.status === 401) {
      localStorage.removeItem('isAuthenticated')
      throw new Error('登录已过期，请重新登录')
    } else {
      const errorText = await response.text()
      throw new Error(`发布失败: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    console.error('发布错误:', error)
    errorMessage.value = error.message || '发布失败，请重试'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (!checkAuth()) {
    errorMessage.value = '请先登录再发布商品'
  }
})
</script>

<template>
  <div class="post-item-container">
    <div class="post-item-card">
      <div class="header">
        <h2>发布二手商品</h2>
        <router-link to="/home" class="back-link">← 返回首页</router-link>
      </div>

      <form @submit.prevent="submitItem" class="item-form">
        <div class="form-group">
          <label for="name">商品名称 *</label>
          <input
            type="text"
            id="name"
            v-model="itemForm.name"
            placeholder="请输入商品名称"
            required
          />
        </div>

        <div class="form-group">
          <label for="description">商品描述 *</label>
          <textarea
            id="description"
            v-model="itemForm.description"
            placeholder="请描述商品信息"
            rows="4"
            required
          ></textarea>
        </div>

        <div class="form-group">
          <label for="price">价格 (元) *</label>
          <input
            type="number"
            id="price"
            v-model="itemForm.price"
            placeholder="0.00"
            min="0.01"
            step="0.01"
            required
          />
        </div>

        <div class="form-group">
          <label for="category">商品分类</label>
          <select id="category" v-model="itemForm.category">
            <option value="electronics">电子产品</option>
            <option value="clothing">服装鞋帽</option>
            <option value="books">图书文具</option>
            <option value="sports">运动户外</option>
            <option value="beauty">美妆个护</option>
            <option value="home">家居日用</option>
            <option value="other">其他</option>
          </select>
        </div>

        <div class="form-group">
          <label for="condition">商品状态</label>
          <select id="condition" v-model="itemForm.condition">
            <option value="new">全新</option>
            <option value="like_new">几乎全新</option>
            <option value="good">良好</option>
            <option value="fair">一般</option>
            <option value="needs_repair">需维修</option>
          </select>
        </div>

        <div class="form-group">
          <label for="location">所在位置</label>
          <input type="text" id="location" v-model="itemForm.location" placeholder="例如：北京" />
        </div>

        <div class="form-group">
          <label for="contact">联系方式 *</label>
          <input
            type="text"
            id="contact"
            v-model="itemForm.contact"
            placeholder="手机号或微信号"
            required
          />
        </div>

        <div class="form-group">
          <label for="image_url">商品图片链接（可选）</label>
          <input
            type="text"
            id="image_url"
            v-model="itemForm.image_url"
            placeholder="请输入商品图片的 URL"
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <button type="submit" :disabled="!isFormValid || isLoading" class="submit-btn">
          {{ isLoading ? '发布中...' : '发布商品' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.post-item-container {
  min-height: 100vh;
  padding: 20px;
  background: #f5f5f5;
}
.post-item-card {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.header {
  background: #1890ff;
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.back-link {
  color: white;
  text-decoration: none;
}
.item-form {
  padding: 30px;
}
.form-group {
  margin-bottom: 20px;
}
label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}
input,
textarea,
select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  box-sizing: border-box;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
}
.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
.error-message {
  color: #ff4d4f;
  background: #fff2f0;
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
  border: 1px solid #ffccc7;
}
.success-message {
  color: #52c41a;
  background: #f6ffed;
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
  border: 1px solid #b7eb8f;
}
</style>
