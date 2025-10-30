<template>
  <div class="edit-item">
    <div class="header">
      <button @click="goBack" class="back-btn">返回</button>
      <h1>编辑商品</h1>
    </div>

    <div class="form-container">
      <form @submit.prevent="submitForm">
        <div class="form-group">
          <label for="title">商品标题</label>
          <input type="text" id="title" v-model="form.title" required />
        </div>

        <div class="form-group">
          <label for="description">商品描述</label>
          <textarea id="description" v-model="form.description" rows="4" required></textarea>
        </div>

        <div class="form-group">
          <label for="price">价格</label>
          <input type="number" id="price" v-model="form.price" step="0.01" required />
        </div>

        <div class="form-actions">
          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? '保存中...' : '保存修改' }}
          </button>
          <button type="button" @click="goBack" class="cancel-btn">取消</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const loading = ref(false)

const form = ref({
  title: '',
  description: '',
  price: '',
})

const fetchItem = async () => {
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${route.params.id}/`)
    if (response.ok) {
      const data = await response.json()
      form.value = {
        title: data.name || data.title,
        description: data.description,
        price: data.price,
      }
    }
  } catch (error) {
    console.error('获取商品信息失败:', error)
  }
}

const submitForm = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('authToken')
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${route.params.id}/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form.value),
    })

    if (response.ok) {
      alert('商品修改成功！')
      router.push('/my-page')
    } else {
      alert('修改失败，请重试')
    }
  } catch (error) {
    console.error('修改商品失败:', error)
    alert('修改失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchItem()
})
</script>

<style scoped>
.edit-item {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.back-btn {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 20px;
}

.form-container {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

input,
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.submit-btn {
  flex: 2;
  padding: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.cancel-btn {
  flex: 1;
  padding: 12px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}
</style>
