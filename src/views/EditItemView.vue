<!-- src/views/EditItemView.vue -->
<template>
  <div class="edit-item-container">
    <div class="header">
      <h1><i class="fas fa-edit"></i> 编辑商品</h1>
      <button class="back-btn" @click="goBack"><i class="fas fa-arrow-left"></i> 返回</button>
    </div>

    <div class="form-container">
      <form @submit.prevent="submitForm" class="item-form">
        <div class="form-group">
          <label for="name">商品名称 *</label>
          <input
            type="text"
            id="name"
            v-model="formData.name"
            placeholder="请输入商品名称"
            required
          />
        </div>

        <div class="form-group">
          <label for="description">商品描述</label>
          <textarea
            id="description"
            v-model="formData.description"
            placeholder="请输入商品描述"
            rows="4"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="price">价格 *</label>
            <input
              type="number"
              id="price"
              v-model="formData.price"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div class="form-group">
            <label for="category">分类 *</label>
            <select id="category" v-model="formData.category" required>
              <option value="">请选择分类</option>
              <option value="electronics">📱 电子产品</option>
              <option value="clothing">👕 服装鞋帽</option>
              <option value="books">📚 图书文具</option>
              <option value="sports">⚽ 运动户外</option>
              <option value="beauty">💄 美妆个护</option>
              <option value="home">🏠 家居日用</option>
              <option value="other">📦 其他</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="condition">商品状态 *</label>
            <select id="condition" v-model="formData.condition" required>
              <option value="">请选择状态</option>
              <option value="new">🆕 全新</option>
              <option value="like_new">✨ 几乎全新</option>
              <option value="good">👍 良好</option>
              <option value="fair">✅ 一般</option>
              <option value="needs_repair">🔧 需维修</option>
            </select>
          </div>

          <div class="form-group">
            <label for="location">位置</label>
            <input
              type="text"
              id="location"
              v-model="formData.location"
              placeholder="例如：宿舍楼A栋"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="image">商品图片URL</label>
          <input type="url" id="image" v-model="formData.image" placeholder="请输入图片链接" />
          <div v-if="formData.image" class="image-preview">
            <img :src="formData.image" alt="预览图" @error="handleImageError" />
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="goBack" class="cancel-btn">取消</button>
          <button type="submit" :disabled="loading" class="submit-btn">
            {{ loading ? '更新中...' : '更新商品' }}
          </button>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const error = ref('')

const formData = ref({
  name: '',
  description: '',
  price: '',
  category: '',
  condition: '',
  location: '',
  image: '',
})

// 获取商品详情
const fetchItemDetail = async () => {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('未找到认证Token')
    }

    const response = await fetch(`http://127.0.0.1:8000/api/goods/${route.params.id}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('获取商品详情失败')
    }

    const data = await response.json()
    if (data.success) {
      formData.value = { ...data.good }
    } else {
      throw new Error(data.message || '获取商品详情失败')
    }
  } catch (err) {
    console.error('获取商品详情失败:', err)
    error.value = err.message
  }
}

// 提交表单
const submitForm = async () => {
  loading.value = true
  error.value = ''

  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('未找到认证Token')
    }

    const response = await fetch(`http://127.0.0.1:8000/api/goods/${route.params.id}/`, {
      method: 'PUT',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData.value),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || '更新商品失败')
    }

    const data = await response.json()
    if (data.success) {
      alert('商品更新成功！')
      router.push('/home')
    } else {
      throw new Error(data.message || '更新商品失败')
    }
  } catch (err) {
    console.error('更新商品失败:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// 图片加载错误处理
const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// 返回上一页
const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchItemDetail()
})
</script>

<style scoped>
.edit-item-container {
  max-width: 800px;
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

.back-btn {
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

.form-container {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

input,
select,
textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #3498db;
}

.image-preview {
  margin-top: 10px;
}

.image-preview img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn,
.submit-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
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

.cancel-btn:hover {
  background: #7f8c8d;
}

.submit-btn:hover:not(:disabled) {
  background: #2980b9;
}

.error-message {
  background: #fdeded;
  color: #e74c3c;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .edit-item-container {
    padding: 10px;
  }

  .header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-btn,
  .submit-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
