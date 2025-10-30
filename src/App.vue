<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
// 这里可以添加全局的逻辑
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
    'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

/* 全局按钮样式 */
button {
  cursor: pointer;
  border: none;
  outline: none;
  transition: all 0.3s ease;
}

button:hover {
  transform: translateY(-1px);
}

/* 全局输入框样式 */
input,
textarea,
select {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #3498db;
}

/* 全局链接样式 */
a {
  color: #3498db;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* 全局卡片阴影 */
.card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
}
</style>
