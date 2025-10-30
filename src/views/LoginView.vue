<template>
  <div class="login-container">
    <div class="login-form">
      <h2>用户登录</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名:</label>
          <input 
            type="text" 
            v-model="loginForm.username" 
            required 
            placeholder="请输入用户名"
          >
        </div>
        <div class="form-group">
          <label>密码:</label>
          <input 
            type="password" 
            v-model="loginForm.password" 
            required 
            placeholder="请输入密码"
          >
        </div>
        <button type="submit" :disabled="loading" class="login-btn">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="login-links">
        <p>还没有账号？ <router-link to="/register">立即注册</router-link></p>
        <button @click="debugSkipLogin" class="debug-btn">
          调试：跳过登录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)

const loginForm = ref({
  username: '',
  password: ''
})

const handleLogin = async () => {
  loading.value = true
  try {
    const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginForm.value)
    })

    if (response.ok) {
      const data = await response.json()
      
      if (data.success) {
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('userInfo', JSON.stringify(data.user))
        
        console.log('登录成功，跳转到首页')
        router.push('/home')
      } else {
        alert(data.message || '登录失败')
      }
    } else {
      alert('登录失败，请检查网络连接')
    }
  } catch (error) {
    console.error('登录错误:', error)
    alert('登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const debugSkipLogin = () => {
  localStorage.setItem('isAuthenticated', 'true')
  localStorage.setItem('authToken', 'debug-token-' + Date.now())
  localStorage.setItem('userInfo', JSON.stringify({
    id: 1,
    username: 'debug_user'
  }))
  
  console.log('调试模式：设置认证状态并跳转到首页')
  router.push('/home')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  border-color: #3498db;
  outline: none;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.login-btn:hover:not(:disabled) {
  background: #2980b9;
}

.login-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.login-links {
  margin-top: 20px;
  text-align: center;
}

.login-links a {
  color: #3498db;
  text-decoration: none;
}

.login-links a:hover {
  text-decoration: underline;
}

.debug-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.debug-btn:hover {
  background: #c0392b;
}
</style>