<template>
  <div class="register-container">
    <div class="register-form">
      <h2>用户注册</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>用户名:</label>
          <input 
            type="text" 
            v-model="registerForm.username" 
            required 
            placeholder="请输入用户名"
          >
        </div>
        <div class="form-group">
          <label>密码:</label>
          <input 
            type="password" 
            v-model="registerForm.password" 
            required 
            placeholder="请输入密码"
          >
        </div>
        <div class="form-group">
          <label>确认密码:</label>
          <input 
            type="password" 
            v-model="registerForm.confirmPassword" 
            required 
            placeholder="请再次输入密码"
          >
        </div>
        <div class="form-group">
          <label>邮箱:</label>
          <input 
            type="email" 
            v-model="registerForm.email" 
            placeholder="请输入邮箱（可选）"
          >
        </div>
        <button type="submit" :disabled="loading" class="register-btn">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <div class="register-links">
        <p>已有账号？ <router-link to="/">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)

const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  email: ''
})

const handleRegister = async () => {
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    alert('两次输入的密码不一致')
    return
  }

  if (registerForm.value.password.length < 6) {
    alert('密码长度至少6位')
    return
  }

  loading.value = true
  try {
    const response = await fetch('http://127.0.0.1:8000/api/auth/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: registerForm.value.username,
        password: registerForm.value.password,
        email: registerForm.value.email
      })
    })

    if (response.ok) {
      const data = await response.json()
      
      if (data.success) {
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('userInfo', JSON.stringify(data.user))
        
        alert('注册成功！')
        router.push('/home')
      } else {
        alert(data.message || '注册失败')
      }
    } else {
      alert('注册失败，请检查网络连接')
    }
  } catch (error) {
    console.error('注册错误:', error)
    alert('注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
}

.register-form {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.register-form h2 {
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

.register-btn {
  width: 100%;
  padding: 12px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.register-btn:hover:not(:disabled) {
  background: #219a52;
}

.register-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.register-links {
  margin-top: 20px;
  text-align: center;
}

.register-links a {
  color: #3498db;
  text-decoration: none;
}

.register-links a:hover {
  text-decoration: underline;
}
</style>