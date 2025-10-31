<!-- RegisterView.vue -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  first_name: '',
  last_name: '',
})

const errorMessage = ref('')
const successMessage = ref('') // 新增：成功提示
const isLoading = ref(false)

const handleRegister = async () => {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = '' // 重置成功提示

  // 验证密码确认
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    isLoading.value = false
    return
  }

  // 验证用户名长度
  if (registerForm.value.username.length < 3) {
    errorMessage.value = '用户名至少需要3个字符'
    isLoading.value = false
    return
  }

  // 验证密码长度
  if (registerForm.value.password.length < 6) {
    errorMessage.value = '密码至少需要6个字符'
    isLoading.value = false
    return
  }

  try {
    // 先获取CSRF token
    const csrfResponse = await fetch('http://127.0.0.1:8000/api/auth/csrf-token/')
    const csrfData = await csrfResponse.json()

    // 发送注册请求
    const response = await fetch('http://127.0.0.1:8000/api/auth/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfData.csrfToken,
      },
      body: JSON.stringify({
        username: registerForm.value.username,
        password: registerForm.value.password,
        email: registerForm.value.email,
        first_name: registerForm.value.first_name,
        last_name: registerForm.value.last_name,
      }),
    })

    const data = await response.json()

    if (data.success) {
      // 注册成功：显示提示，3秒后跳转到登录页
      successMessage.value = '注册成功！即将跳转到登录页面...'

      // 清空表单
      registerForm.value = {
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        first_name: '',
        last_name: '',
      }

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push({ name: 'login' }) // 跳转到登录页
      }, 3000)
    } else {
      throw new Error(data.message || '注册失败')
    }
  } catch (error) {
    errorMessage.value = error.message || '注册失败，请重试'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <h2>用户注册</h2>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-row">
          <div class="form-group">
            <label for="first_name">姓</label>
            <input
              type="text"
              id="first_name"
              v-model="registerForm.first_name"
              placeholder="请输入姓"
            />
          </div>

          <div class="form-group">
            <label for="last_name">名</label>
            <input
              type="text"
              id="last_name"
              v-model="registerForm.last_name"
              placeholder="请输入名"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="username">用户名 *</label>
          <input
            type="text"
            id="username"
            v-model="registerForm.username"
            placeholder="请输入用户名（至少3位）"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">邮箱</label>
          <input type="email" id="email" v-model="registerForm.email" placeholder="请输入邮箱" />
        </div>

        <div class="form-group">
          <label for="password">密码 *</label>
          <input
            type="password"
            id="password"
            v-model="registerForm.password"
            placeholder="请输入密码（至少6位）"
            required
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">确认密码 *</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="registerForm.confirmPassword"
            placeholder="请再次输入密码"
            required
          />
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- 成功提示 -->
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <button type="submit" :disabled="isLoading" class="register-btn">
          {{ isLoading ? '注册中...' : '注册' }}
        </button>
      </form>

      <div class="register-footer">
        <p>已有账号？ <router-link to="/login">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  padding: 20px;
}

.register-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 450px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.register-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.register-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.register-btn:hover:not(:disabled) {
  background-color: #218838;
}

.register-footer {
  margin-top: 1.5rem;
  text-align: center;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.register-footer a {
  color: #087bff;
  text-decoration: none;
}

.register-footer a:hover {
  text-decoration: underline;
}

.error-message {
  color: #e74c3c;
  margin-bottom: 1rem;
  text-align: center;
  padding: 0.75rem;
  background-color: #f8d7da;
  border-radius: 4px;
}

/* 新增：成功提示样式 */
.success-message {
  color: #28a745;
  margin-bottom: 1rem;
  text-align: center;
  padding: 0.75rem;
  background-color: #d4edda;
  border-radius: 4px;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #087bff;
}
</style>
