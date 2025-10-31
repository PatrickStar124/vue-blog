from rest_framework import status, permissions from rest_framework.response import Response from
rest_framework.decorators import api_view, permission_classes from django.contrib.auth.models import
User from goods.models import Goods from api.serializers import GoodsSerializer @api_view(['GET',
'POST']) @permission_classes([permissions.IsAuthenticatedOrReadOnly]) def goods_list(request): if
request.method == 'GET': goods = Goods.objects.filter(is_sold=False).order_by('-created_at')
serializer = GoodsSerializer(goods, many=True, context={'request': request}) return Response({
'success': True, 'goods': serializer.data, 'count': len(serializer.data) }) elif request.method ==
'POST': serializer = GoodsSerializer(data=request.data, context={'request': request}) if
serializer.is_valid(): serializer.save() return Response({ 'success': True, 'message':
'商品发布成功', 'goods': serializer.data }, status=status.HTTP_201_CREATED) return Response({
'success': False, 'message': '数据验证失败', 'errors': serializer.errors },
status=status.HTTP_400_BAD_REQUEST) @api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated]) def good_detail(request, id): try: goods =
Goods.objects.get(id=id) except Goods.DoesNotExist: return Response({ 'success': False, 'message':
'商品不存在' }, status=status.HTTP_404_NOT_FOUND) # 检查是否为商品所有者 if goods.seller !=
request.user: return Response({ 'success': False, 'message': '无权操作此商品' },
status=status.HTTP_403_FORBIDDEN) if request.method == 'GET': serializer = GoodsSerializer(goods,
context={'request': request}) return Response({ 'success': True, 'goods': serializer.data }) elif
request.method == 'PUT': serializer = GoodsSerializer(goods, data=request.data, partial=True,
context={'request': request}) if serializer.is_valid(): serializer.save() return Response({
'success': True, 'message': '商品更新成功', 'goods': serializer.data }) return Response({ 'success':
False, 'message': '数据验证失败', 'errors': serializer.errors }, status=status.HTTP_400_BAD_REQUEST)
elif request.method == 'DELETE': # 删除商品时同时删除图片文件 if goods.image:
goods.image.delete(save=False) goods.delete() return Response({ 'success': True, 'message':
'商品删除成功' }, status=status.HTTP_200_OK)a
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 表单数据
const itemForm = ref({
  name: '',
  price: '',
  description: '',
  category: 'electronics',
  condition: 'good',
  location: '北京',
  contact: '',
  image: null, // 存储图片文件
})

const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)
const imagePreview = ref('') // 图片预览URL

// 表单验证：必填项 + 价格合法性
const isFormValid = computed(() => {
  return (
    itemForm.value.name.trim() &&
    itemForm.value.description.trim() &&
    itemForm.value.price > 0 &&
    itemForm.value.contact.trim()
  )
})

// 检查登录状态
const checkAuth = () => {
  const token = localStorage.getItem('authToken')
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'

  if (!token || !isAuthenticated) {
    errorMessage.value = '请先登录'
    setTimeout(() => router.push('/login'), 1500)
    return false
  }
  return true
}

// 处理图片选择：验证格式、大小 + 生成预览
const handleImageSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      errorMessage.value = '请选择有效的图片文件 (JPEG, PNG, GIF, WebP)'
      return
    }

    // 验证文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      errorMessage.value = '图片大小不能超过5MB'
      return
    }

    itemForm.value.image = file

    // 生成预览图
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// 移除已选图片：重置文件 + 预览
const removeImage = () => {
  itemForm.value.image = null
  imagePreview.value = ''
  const fileInput = document.getElementById('image')
  if (fileInput) fileInput.value = ''
}

// 提交商品：FormData格式传参 + 后端交互
const submitItem = async () => {
  if (!checkAuth()) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    // 获取Token
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('未获取到有效的Token，请重新登录')
    }

    // 构建FormData
    const formData = new FormData()
    formData.append('name', itemForm.value.name.trim())
    formData.append('price', parseFloat(itemForm.value.price))
    formData.append('description', itemForm.value.description.trim())
    formData.append('category', itemForm.value.category)
    formData.append('condition', itemForm.value.condition)
    formData.append('location', itemForm.value.location.trim())
    formData.append('contact', itemForm.value.contact.trim())
    if (itemForm.value.image) {
      formData.append('image', itemForm.value.image)
    }

    // 发送请求
    const response = await fetch('http://127.0.0.1:8000/api/goods/', {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
      },
      body: formData,
    })

    // 处理响应
    if (response.status === 201) {
      successMessage.value = '商品发布成功！'
      // 清空表单
      itemForm.value = {
        name: '',
        price: '',
        description: '',
        category: 'electronics',
        condition: 'good',
        location: '北京',
        contact: '',
        image: null,
      }
      imagePreview.value = ''
      // 跳转首页
      setTimeout(() => router.push('/home'), 2000)
    } else if (response.status === 400) {
      const errorData = await response.json()
      throw new Error(errorData.message || '数据填写有误，请检查')
    } else if (response.status === 401) {
      throw new Error('请先登录')
    } else if (response.status === 500) {
      throw new Error('服务器内部错误，请联系管理员')
    } else {
      const errorText = await response.text()
      throw new Error(`发布失败: ${errorText}`)
    }
  } catch (error) {
    errorMessage.value = error.message || '发布失败，请重试'
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时检查登录状态
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

      <form @submit.prevent="submitItem" class="item-form" enctype="multipart/form-data">
        <!-- 商品名称（必填） -->
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

        <!-- 商品描述（必填） -->
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

        <!-- 商品价格（必填） -->
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

        <!-- 商品分类 -->
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

        <!-- 商品状态 -->
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

        <!-- 所在位置 -->
        <div class="form-group">
          <label for="location">所在位置</label>
          <input type="text" id="location" v-model="itemForm.location" placeholder="例如：北京" />
        </div>

        <!-- 联系方式（必填） -->
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

        <!-- 图片上传 -->
        <div class="form-group">
          <label for="image">商品图片</label>
          <div class="image-upload-area">
            <input
              type="file"
              id="image"
              accept="image/*"
              @change="handleImageSelect"
              class="file-input"
            />
            <label for="image" class="file-label">
              <div class="upload-placeholder">
                <span class="upload-icon">📷</span>
                <p>点击选择图片</p>
                <small>支持 JPG, PNG, GIF, WebP (最大5MB)</small>
              </div>
            </label>

            <!-- 图片预览 -->
            <div v-if="imagePreview" class="image-preview">
              <img :src="imagePreview" alt="商品图片预览" />
              <button type="button" @click="removeImage" class="remove-image-btn">×</button>
            </div>
          </div>
        </div>

        <!-- 提示信息 -->
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
        <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

        <!-- 提交按钮 -->
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
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
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
  color: #333;
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
  transition: border-color 0.3s;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #1890ff;
}

textarea {
  resize: vertical;
  min-height: 80px;
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
  transition: background-color 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: #40a9ff;
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

/* 图片上传样式 */
.image-upload-area {
  position: relative;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.file-label {
  display: block;
  cursor: pointer;
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s ease;
  background: #fafafa;
}

.file-label:hover {
  border-color: #1890ff;
  background: #f0f8ff;
}

.upload-placeholder {
  color: #666;
}

.upload-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 10px;
}

.upload-placeholder p {
  margin: 5px 0;
  font-weight: 500;
}

.upload-placeholder small {
  color: #999;
}

.image-preview {
  position: relative;
  margin-top: 15px;
  display: inline-block;
}

.image-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  border: 2px solid #e8e8e8;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.remove-image-btn:hover {
  background: #d63031;
}
</style>
