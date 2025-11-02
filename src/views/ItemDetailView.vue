<!-- ItemDetailView.vue -->
<template>
  <div class="item-detail-container">
    <!-- 头部导航 -->
    <div class="header-nav">
      <button class="nav-btn back-btn" @click="goBack">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        <span>返回首页</span>
      </button>
      <h1 class="page-title">商品详情</h1>
      <div class="nav-actions">
        <button v-if="isAuthenticated" class="nav-btn my-page-btn" @click="goToMyPage">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
            />
          </svg>
          <span>我的页面</span>
        </button>
        <button v-if="isAuthenticated" class="nav-btn logout-btn" @click="handleLogout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
            />
          </svg>
          <span>退出</span>
        </button>
        <button v-else class="nav-btn login-btn" @click="goToLogin">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M10 20H5v2h5v2l3-3-3-3v2zm4 0v2h5v-2h-5zM12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0-2c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1-1 .45-1 1zm0 4c-1.66 0-3 1.34-3 3v3h6v-3c0-1.66-1.34-3-3-3z"
            />
          </svg>
          <span>登录</span>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在加载商品信息...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <div class="error-actions">
        <button @click="fetchItemDetail" class="action-btn primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
            />
          </svg>
          重新加载
        </button>
        <button @click="goBack" class="action-btn secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          返回首页
        </button>
      </div>
    </div>

    <!-- 商品详情内容 -->
    <div v-else-if="item" class="item-detail-content">
      <!-- 商品主区域 -->
      <div class="item-main-section">
        <!-- 左侧图片区域 -->
        <div class="image-section">
          <div class="image-container">
            <img
              :src="getImageUrl(item.image)"
              :alt="item.name"
              class="main-image"
              @error="handleImageError"
            />
            <div class="image-overlay">
              <div class="status-badge" :class="item.is_sold ? 'sold' : 'available'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    v-if="item.is_sold"
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                  />
                  <path v-else d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                {{ item.is_sold ? '已售出' : '出售中' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧信息区域 -->
        <div class="info-section">
          <!-- 商品标题和价格 -->
          <div class="item-header">
            <h1 class="item-title">{{ item.name }}</h1>
            <div class="price-section">
              <span class="current-price">¥{{ formatPrice(item.price) }}</span>
              <span v-if="item.original_price" class="original-price">
                原价: ¥{{ formatPrice(item.original_price) }}
              </span>
            </div>
          </div>

          <!-- 互动数据 -->
          <div class="interaction-section">
            <div class="interaction-stats">
              <!-- 点赞 -->
              <div class="interaction-item" @click="toggleLike" :class="{ active: item.is_liked }">
                <div class="interaction-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    />
                  </svg>
                </div>
                <div class="interaction-info">
                  <span class="count">{{ item.likes_count || 0 }}</span>
                  <span class="label">点赞</span>
                </div>
              </div>

              <!-- 收藏 -->
              <div
                class="interaction-item"
                @click="toggleFavorite"
                :class="{ active: item.is_favorited }"
              >
                <div class="interaction-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    />
                  </svg>
                </div>
                <div class="interaction-info">
                  <span class="count">{{ item.favorites_count || 0 }}</span>
                  <span class="label">收藏</span>
                </div>
              </div>

              <!-- 评论 -->
              <div class="interaction-item">
                <div class="interaction-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                </div>
                <div class="interaction-info">
                  <span class="count">{{ item.comments_count || 0 }}</span>
                  <span class="label">评论</span>
                </div>
              </div>

              <!-- 浏览 -->
              <div class="interaction-item">
                <div class="interaction-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                    />
                  </svg>
                </div>
                <div class="interaction-info">
                  <span class="count">{{ item.views_count || 0 }}</span>
                  <span class="label">浏览</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 商品信息卡片 -->
          <div class="info-cards">
            <!-- 基本信息卡片 -->
            <div class="info-card">
              <div class="card-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                  />
                </svg>
                <h3>商品信息</h3>
              </div>
              <div class="card-content">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">分类</span>
                    <span class="info-value">{{ getCategoryLabel(item.category) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">商品状态</span>
                    <span class="info-value">{{ getConditionLabel(item.condition) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">位置</span>
                    <span class="info-value">{{ item.location || '未填写' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">卖家</span>
                    <span class="info-value seller-info">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                        />
                      </svg>
                      {{ item.seller?.username || '未知用户' }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">发布时间</span>
                    <span class="info-value">{{ formatDate(item.created_at) }}</span>
                  </div>
                  <div v-if="item.is_sold" class="info-item">
                    <span class="info-label">售出时间</span>
                    <span class="info-value">{{ formatDate(item.sold_at) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 描述卡片 -->
            <div class="info-card">
              <div class="card-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
                  />
                </svg>
                <h3>商品描述</h3>
              </div>
              <div class="card-content">
                <div class="description-content">
                  <p>{{ item.description || '该商品暂无详细描述' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮区域 -->
          <div class="action-section">
            <!-- 买家操作 -->
            <div v-if="!isItemOwner" class="action-buttons">
              <button
                v-if="!item.is_sold"
                class="action-btn primary large"
                @click="handlePurchase"
                :disabled="purchasing"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"
                  />
                </svg>
                {{ purchasing ? '购买中...' : '立即购买' }}
              </button>

              <button class="action-btn secondary" @click="showMessageModal = true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                  />
                </svg>
                联系卖家
              </button>

              <button
                class="action-btn secondary favorite-btn"
                :class="{ active: item.is_favorited }"
                @click="toggleFavorite"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </svg>
                {{ item.is_favorited ? '已收藏' : '收藏' }}
              </button>

              <div v-if="item.is_sold" class="sold-notice">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  />
                </svg>
                <span>该商品已售出</span>
              </div>
            </div>

            <!-- 卖家操作 -->
            <div v-if="isItemOwner" class="action-buttons owner-actions">
              <button class="action-btn primary large" @click="editItem">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                  />
                </svg>
                编辑商品
              </button>

              <button class="action-btn secondary" @click="markAsSold" v-if="!item.is_sold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                标记售出
              </button>

              <button class="action-btn danger" @click="deleteItem">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                  />
                </svg>
                删除商品
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 评论区域 -->
      <div class="comments-section">
        <div class="section-header">
          <div class="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
            <h2>商品评论</h2>
            <span class="comment-count">({{ comments.length }})</span>
          </div>
          <button
            class="action-btn primary"
            @click="showCommentModal = true"
            v-if="isAuthenticated && !isItemOwner"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            添加评论
          </button>
        </div>

        <!-- 评论内容 -->
        <div class="comments-content">
          <div v-if="commentsLoading" class="loading-comments">
            <div class="spinner small"></div>
            <p>加载评论中...</p>
          </div>

          <div v-else-if="comments.length === 0" class="no-comments">
            <div class="empty-state">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"
                />
              </svg>
              <h3>暂无评论</h3>
              <p>成为第一个评论的人吧！</p>
              <button
                v-if="isAuthenticated && !isItemOwner"
                class="action-btn primary"
                @click="showCommentModal = true"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                添加第一条评论
              </button>
            </div>
          </div>

          <div v-else class="comments-list">
            <div v-for="comment in comments" :key="comment.id" class="comment-card">
              <div class="comment-header">
                <div class="user-avatar">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                    />
                  </svg>
                </div>
                <div class="user-info">
                  <span class="username">{{ comment.user?.username || '匿名用户' }}</span>
                  <div class="comment-meta">
                    <div class="rating-stars">
                      <svg
                        v-for="star in 5"
                        :key="star"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        :class="{ active: star <= (comment.rating || 5) }"
                      >
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        />
                      </svg>
                    </div>
                    <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
                  </div>
                </div>
                <div class="comment-actions">
                  <button
                    v-if="comment.user?.id === currentUser?.id"
                    @click="deleteComment(comment.id)"
                    class="icon-btn danger"
                    title="删除评论"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div class="comment-content">
                {{ comment.content }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑商品模态框 -->
    <div v-if="showEditModal" class="modal-overlay" @click="showEditModal = false">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h3>编辑商品信息</h3>
          <button class="icon-btn close-btn" @click="showEditModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitEdit" class="edit-form">
            <div class="form-group">
              <label for="itemName" class="form-label">商品名称 *</label>
              <input
                id="itemName"
                type="text"
                v-model="editForm.name"
                placeholder="请输入商品名称"
                class="form-input"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="itemPrice" class="form-label">价格 (元) *</label>
                <input
                  id="itemPrice"
                  type="number"
                  step="0.01"
                  v-model="editForm.price"
                  placeholder="0.00"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label for="itemCategory" class="form-label">分类 *</label>
                <select id="itemCategory" v-model="editForm.category" class="form-select" required>
                  <option value="">请选择分类</option>
                  <option
                    v-for="category in categories"
                    :key="category.value"
                    :value="category.value"
                  >
                    {{ category.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="itemCondition" class="form-label">商品状态 *</label>
                <select
                  id="itemCondition"
                  v-model="editForm.condition"
                  class="form-select"
                  required
                >
                  <option value="">请选择状态</option>
                  <option value="new">🆕 全新</option>
                  <option value="like_new">✨ 几乎全新</option>
                  <option value="good">👍 良好</option>
                  <option value="fair">✅ 一般</option>
                  <option value="needs_repair">🔧 需维修</option>
                </select>
              </div>

              <div class="form-group">
                <label for="itemLocation" class="form-label">位置</label>
                <input
                  id="itemLocation"
                  type="text"
                  v-model="editForm.location"
                  placeholder="例如：教学楼A区"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="itemDescription" class="form-label">商品描述</label>
              <textarea
                id="itemDescription"
                v-model="editForm.description"
                placeholder="请详细描述您的商品..."
                rows="4"
                maxlength="1000"
                class="form-textarea"
              ></textarea>
              <div class="char-count">{{ editForm.description.length }}/1000</div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="action-btn secondary" @click="showEditModal = false" type="button">
            取消
          </button>
          <button
            class="action-btn primary"
            @click="submitEdit"
            :disabled="!canSubmitEdit || editing"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"
              />
            </svg>
            {{ editing ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 评论模态框 -->
    <div v-if="showCommentModal" class="modal-overlay" @click="showCommentModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加评论</h3>
          <button class="icon-btn close-btn" @click="showCommentModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="rating-input">
            <label class="form-label">评分：</label>
            <div class="stars">
              <svg
                v-for="star in 5"
                :key="star"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="currentColor"
                :class="{ active: star <= newComment.rating }"
                @click="newComment.rating = star"
              >
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
            </div>
          </div>
          <div class="comment-input">
            <label class="form-label">评论内容：</label>
            <textarea
              v-model="newComment.content"
              placeholder="请输入您的评论..."
              rows="4"
              maxlength="500"
              class="form-textarea"
            ></textarea>
            <div class="char-count">{{ newComment.content.length }}/500</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-btn secondary" @click="showCommentModal = false">取消</button>
          <button class="action-btn primary" @click="submitComment" :disabled="!canSubmitComment">
            提交评论
          </button>
        </div>
      </div>
    </div>

    <!-- 留言模态框 -->
    <div v-if="showMessageModal" class="modal-overlay" @click="showMessageModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>联系卖家</h3>
          <button class="icon-btn close-btn" @click="showMessageModal = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="message-input">
            <label class="form-label">留言内容：</label>
            <textarea
              v-model="newMessage.content"
              placeholder="请输入您想对卖家说的话..."
              rows="4"
              maxlength="500"
              class="form-textarea"
            ></textarea>
            <div class="char-count">{{ newMessage.content.length }}/500</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-btn secondary" @click="showMessageModal = false">取消</button>
          <button
            class="action-btn primary"
            @click="submitMessage"
            :disabled="!newMessage.content.trim()"
          >
            发送留言
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const item = ref(null)
const loading = ref(false)
const error = ref('')
const purchasing = ref(false)
const editing = ref(false)

// 评论相关数据
const comments = ref([])
const commentsLoading = ref(false)
const showCommentModal = ref(false)
const newComment = ref({
  rating: 5,
  content: '',
})

// 留言相关数据
const showMessageModal = ref(false)
const newMessage = ref({
  content: '',
})

// 编辑相关数据
const showEditModal = ref(false)
const editForm = ref({
  name: '',
  price: '',
  category: '',
  condition: '',
  location: '',
  description: '',
  image: '',
})

// 商品状态选项
const conditions = {
  new: '🆕 全新',
  like_new: '✨ 几乎全新',
  good: '👍 良好',
  fair: '✅ 一般',
  needs_repair: '🔧 需维修',
}

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

// 计算属性
const isAuthenticated = computed(() => {
  return localStorage.getItem('isAuthenticated') === 'true'
})

const currentUser = computed(() => {
  const userData = localStorage.getItem('userInfo')
  return userData ? JSON.parse(userData) : null
})

const isItemOwner = computed(() => {
  return currentUser.value && item.value?.seller && item.value.seller.id === currentUser.value.id
})

const canSubmitComment = computed(() => {
  return newComment.value.rating > 0 && newComment.value.content.trim().length > 0
})

const canSubmitEdit = computed(() => {
  return (
    editForm.value.name &&
    editForm.value.price &&
    editForm.value.category &&
    editForm.value.condition
  )
})

// 获取认证Token
const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

// 获取图片URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return '/api/placeholder/500x400'
  if (imagePath.startsWith('http')) return imagePath
  return `http://127.0.0.1:8000${imagePath}`
}

// 获取商品详情
const fetchItemDetail = async () => {
  loading.value = true
  error.value = ''

  try {
    const token = getAuthToken()

    if (!token) {
      throw new Error('请先登录')
    }

    const response = await fetch(`http://127.0.0.1:8000/api/goods/${route.params.id}/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.status === 403) {
      throw new Error('您没有权限查看此商品详情')
    }

    if (response.status === 404) {
      throw new Error('商品不存在')
    }

    if (!response.ok) {
      throw new Error(`获取商品详情失败: ${response.status}`)
    }

    const data = await response.json()
    console.log('商品详情数据:', data)

    // 适配不同的数据格式
    if (data.success && data.goods) {
      item.value = data.goods
    } else if (data.item) {
      item.value = data.item
    } else {
      item.value = data
    }

    // 初始化编辑表单
    initEditForm()
    // 加载评论
    await fetchComments()
  } catch (err) {
    console.error('获取商品详情失败:', err)
    error.value = err.message

    if (err.message.includes('登录已过期') || err.message.includes('请先登录')) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userInfo')
    }
  } finally {
    loading.value = false
  }
}

// 初始化编辑表单
const initEditForm = () => {
  if (item.value) {
    editForm.value = {
      name: item.value.name || '',
      price: item.value.price || '',
      category: item.value.category || '',
      condition: item.value.condition || '',
      location: item.value.location || '',
      description: item.value.description || '',
      image: item.value.image || '',
    }
  }
}

// 获取评论
const fetchComments = async () => {
  if (!item.value) return

  commentsLoading.value = true
  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${item.value.id}/comments/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log('评论数据:', data)

      if (data.success) {
        comments.value = data.comments || data.data || []
      } else {
        comments.value = data.comments || data || []
      }
    }
  } catch (err) {
    console.error('获取评论失败:', err)
  } finally {
    commentsLoading.value = false
  }
}

// 切换点赞
const toggleLike = async () => {
  if (!isAuthenticated.value) {
    alert('请先登录')
    return
  }

  try {
    const token = getAuthToken()
    const method = item.value.is_liked ? 'DELETE' : 'POST'

    const response = await fetch(`http://127.0.0.1:8000/api/goods/${item.value.id}/like/`, {
      method: method,
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      // 更新本地状态
      item.value.is_liked = !item.value.is_liked
      if (item.value.is_liked) {
        item.value.likes_count = (item.value.likes_count || 0) + 1
      } else {
        item.value.likes_count = Math.max(0, (item.value.likes_count || 1) - 1)
      }
    }
  } catch (err) {
    console.error('操作点赞失败:', err)
    alert('操作失败: ' + err.message)
  }
}

// 切换收藏
const toggleFavorite = async () => {
  if (!isAuthenticated.value) {
    alert('请先登录')
    return
  }

  try {
    const token = getAuthToken()
    const method = item.value.is_favorited ? 'DELETE' : 'POST'

    const response = await fetch(`http://127.0.0.1:8000/api/goods/${item.value.id}/favorite/`, {
      method: method,
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      // 更新本地状态
      item.value.is_favorited = !item.value.is_favorited
      if (item.value.is_favorited) {
        item.value.favorites_count = (item.value.favorites_count || 0) + 1
      } else {
        item.value.favorites_count = Math.max(0, (item.value.favorites_count || 1) - 1)
      }
    }
  } catch (err) {
    console.error('操作收藏失败:', err)
    alert('操作失败: ' + err.message)
  }
}

// 编辑商品
const editItem = () => {
  showEditModal.value = true
}

// 提交编辑 - 修复版
const submitEdit = async () => {
  if (!canSubmitEdit.value) {
    alert('请填写完整的商品信息')
    return
  }

  editing.value = true
  try {
    const token = getAuthToken()

    // 准备提交数据
    const submitData = {
      name: editForm.value.name,
      price: parseFloat(editForm.value.price),
      category: editForm.value.category,
      condition: editForm.value.condition,
      location: editForm.value.location,
      description: editForm.value.description,
    }

    console.log('提交编辑数据:', submitData)

    const response = await fetch(`http://127.0.0.1:8000/api/goods/${item.value.id}/`, {
      method: 'PUT',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submitData),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('编辑响应:', data)

      if (data.success) {
        // 更新商品数据
        Object.assign(item.value, submitData)
        showEditModal.value = false
        alert('商品信息更新成功！')
      } else {
        throw new Error(data.message || '更新失败')
      }
    } else {
      const errorText = await response.text()
      console.error('编辑失败响应:', errorText)
      throw new Error(`更新失败: ${response.status}`)
    }
  } catch (err) {
    console.error('更新商品失败:', err)
    alert('更新失败: ' + err.message)
  } finally {
    editing.value = false
  }
}

// 标记为售出
const markAsSold = async () => {
  if (!confirm('确定要将此商品标记为已售出吗？')) {
    return
  }

  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${item.value.id}/mark_sold/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      item.value.is_sold = true
      alert('商品已标记为售出！')
    } else {
      throw new Error('标记售出失败')
    }
  } catch (err) {
    console.error('标记售出失败:', err)
    alert('操作失败: ' + err.message)
  }
}

// 图片加载失败处理
const handleImageError = (event) => {
  event.target.src = '/api/placeholder/500x400?text=图片加载失败'
}

// 提交评论
const submitComment = async () => {
  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${item.value.id}/comments/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newComment.value),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        comments.value.unshift(data.comment || data)
        item.value.comments_count = (item.value.comments_count || 0) + 1
        showCommentModal.value = false
        newComment.value = { rating: 5, content: '' }
        alert('评论发布成功！')
      }
    } else {
      throw new Error('发布评论失败')
    }
  } catch (err) {
    console.error('发布评论失败:', err)
    alert('发布评论失败: ' + err.message)
  }
}

// 删除评论
const deleteComment = async (commentId) => {
  if (!confirm('确定要删除这条评论吗？')) {
    return
  }

  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/comments/${commentId}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      comments.value = comments.value.filter((comment) => comment.id !== commentId)
      item.value.comments_count = Math.max(0, (item.value.comments_count || 1) - 1)
      alert('评论删除成功！')
    } else {
      throw new Error('删除评论失败')
    }
  } catch (err) {
    console.error('删除评论失败:', err)
    alert('删除评论失败: ' + err.message)
  }
}

// 发送留言
const submitMessage = async () => {
  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${item.value.id}/messages/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newMessage.value),
    })

    if (response.ok) {
      showMessageModal.value = false
      newMessage.value = { content: '' }
      alert('留言发送成功！')
    } else {
      throw new Error('发送留言失败')
    }
  } catch (err) {
    console.error('发送留言失败:', err)
    alert('发送留言失败: ' + err.message)
  }
}

// 购买商品
const handlePurchase = async () => {
  if (!confirm(`确定要购买 "${item.value.name}" 吗？\n价格：¥${item.value.price}`)) {
    return
  }

  purchasing.value = true
  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${route.params.id}/purchase/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (data.success) {
      alert('购买成功！')
      // 刷新商品详情
      await fetchItemDetail()
    } else {
      throw new Error(data.message || '购买失败')
    }
  } catch (err) {
    console.error('购买失败:', err)
    alert('购买失败: ' + err.message)
  } finally {
    purchasing.value = false
  }
}

// 删除商品
const deleteItem = async () => {
  if (!confirm('确定要删除这个商品吗？此操作不可恢复。')) {
    return
  }

  try {
    const token = getAuthToken()
    const response = await fetch(`http://127.0.0.1:8000/api/goods/${route.params.id}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${token}`,
      },
    })

    if (response.ok) {
      alert('商品删除成功！')
      router.push('/home')
    } else {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || '删除失败')
    }
  } catch (err) {
    console.error('删除失败:', err)
    alert('删除失败: ' + err.message)
  }
}

// 工具函数
const goBack = () => {
  router.back()
}

const goToMyPage = () => {
  router.push('/my')
}

const goToLogin = () => {
  router.push('/')
}

const handleLogout = async () => {
  try {
    const token = getAuthToken()
    if (token) {
      await fetch('http://127.0.0.1:8000/api/auth/logout/', {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
      })
    }
  } catch (error) {
    console.error('登出失败:', error)
  } finally {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('isAuthenticated')
    router.push('/')
  }
}

const formatPrice = (price) => {
  return parseFloat(price).toFixed(2)
}

const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  try {
    const date = new Date(dateString)
    return (
      date.toLocaleDateString('zh-CN') +
      ' ' +
      date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    )
  } catch {
    return dateString
  }
}

const getCategoryLabel = (categoryValue) => {
  const category = categories.find((cat) => cat.value === categoryValue)
  return category ? category.label : categoryValue
}

const getConditionLabel = (conditionValue) => {
  return conditions[conditionValue] || conditionValue
}

onMounted(() => {
  fetchItemDetail()
})
</script>

<style scoped>
/* 完整样式代码 */
.item-detail-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
}

.nav-actions {
  display: flex;
  gap: 12px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn {
  background: #4a5568;
  color: white;
}

.my-page-btn {
  background: #9b59b6;
  color: white;
}

.logout-btn {
  background: #e74c3c;
  color: white;
}

.login-btn {
  background: #3498db;
  color: white;
}

.item-detail-content {
  padding: 30px;
}

.item-main-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
}

.image-section {
  position: relative;
}

.image-container {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.main-image {
  width: 100%;
  height: 500px;
  object-fit: cover;
  display: block;
}

.image-overlay {
  position: absolute;
  top: 20px;
  right: 20px;
}

.status-badge {
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.status-badge.available {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
}

.status-badge.sold {
  background: linear-gradient(135deg, #f56565, #e53e3e);
  color: white;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.item-header {
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.item-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 20px 0;
  line-height: 1.2;
}

.price-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.current-price {
  font-size: 2.8rem;
  font-weight: 800;
  color: #e53e3e;
}

.original-price {
  font-size: 1.2rem;
  color: #a0aec0;
  text-decoration: line-through;
}

.interaction-section {
  background: white;
  padding: 25px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.interaction-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.interaction-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #f7fafc;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.interaction-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.interaction-item.active {
  border-color: currentColor;
}

.interaction-item.active .interaction-icon {
  background: currentColor;
  color: white;
}

.interaction-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  border-radius: 12px;
  color: #4a5568;
  transition: all 0.3s ease;
}

.interaction-info {
  display: flex;
  flex-direction: column;
}

.count {
  font-size: 1.6rem;
  font-weight: 700;
  color: #2d3748;
  line-height: 1;
}

.label {
  font-size: 0.9rem;
  color: #718096;
  font-weight: 500;
  margin-top: 4px;
}

.info-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 25px 30px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.card-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.card-content {
  padding: 30px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #e2e8f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #718096;
  font-weight: 500;
}

.info-value {
  color: #2d3748;
  font-weight: 600;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.description-content {
  line-height: 1.8;
  color: #4a5568;
  font-size: 1.1rem;
}

.action-section {
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 25px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.action-btn.primary {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
}

.action-btn.secondary {
  background: white;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.action-btn.danger {
  background: linear-gradient(135deg, #f56565, #e53e3e);
  color: white;
}

.action-btn.large {
  padding: 18px 30px;
  font-size: 1.1rem;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.action-btn.secondary:hover {
  border-color: #4299e1;
  color: #4299e1;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.favorite-btn.active {
  background: #fff3cd;
  border-color: #ffc107;
  color: #856404;
}

.sold-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: #fed7d7;
  color: #c53030;
  border-radius: 12px;
  font-weight: 600;
}

.comments-section {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.section-title h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.comment-count {
  font-size: 1rem;
  opacity: 0.9;
}

.comments-content {
  padding: 30px;
}

.loading-comments,
.no-comments {
  text-align: center;
  padding: 60px 30px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.empty-state svg {
  color: #cbd5e0;
  margin-bottom: 15px;
}

.empty-state h3 {
  color: #4a5568;
  margin: 0;
}

.empty-state p {
  color: #718096;
  margin: 0;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-card {
  background: #f7fafc;
  border-radius: 15px;
  padding: 25px;
  border: 1px solid #e2e8f0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.user-avatar svg {
  color: #9b59b6;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  color: #2d3748;
  font-size: 1.1rem;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 5px;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.rating-stars svg {
  color: #e2e8f0;
}

.rating-stars svg.active {
  color: #f6ad55;
}

.comment-date {
  font-size: 0.9rem;
  color: #718096;
}

.comment-actions {
  display: flex;
  gap: 10px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: transparent;
}

.icon-btn.danger {
  color: #e53e3e;
}

.icon-btn.danger:hover {
  background: #fed7d7;
}

.comment-content {
  color: #4a5568;
  line-height: 1.6;
  font-size: 1.05rem;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
}

.modal-content.large {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: #2d3748;
}

.modal-body {
  padding: 30px;
}

.modal-footer {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  padding: 25px 30px;
  border-top: 1px solid #e2e8f0;
}

/* 表单样式 */
.form-group {
  margin-bottom: 25px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2d3748;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

.char-count {
  text-align: right;
  font-size: 0.9rem;
  color: #a0aec0;
  margin-top: 5px;
}

/* 评分样式 */
.rating-input {
  margin-bottom: 25px;
}

.stars {
  display: flex;
  gap: 5px;
  margin-top: 8px;
}

.stars svg {
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stars svg.active {
  color: #f6ad55;
}

.stars svg:hover {
  transform: scale(1.1);
}

/* 加载状态 */
.loading-state,
.error-state {
  text-align: center;
  padding: 80px 30px;
  background: white;
  border-radius: 20px;
  margin: 50px 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-left: 4px solid #4299e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.spinner.small {
  width: 30px;
  height: 30px;
  border-width: 3px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.error-state h3 {
  color: #e53e3e;
  margin: 0 0 10px 0;
}

.error-state p {
  color: #718096;
  margin: 0 0 25px 0;
}

.error-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .item-main-section {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .main-image {
    height: 400px;
  }
}

@media (max-width: 768px) {
  .header-nav {
    padding: 15px 20px;
    flex-direction: column;
    gap: 15px;
  }

  .nav-actions {
    width: 100%;
    justify-content: center;
  }

  .nav-btn {
    flex: 1;
    justify-content: center;
  }

  .item-detail-content {
    padding: 20px;
  }

  .item-title {
    font-size: 2rem;
  }

  .current-price {
    font-size: 2.2rem;
  }

  .interaction-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }

  .section-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .modal-content {
    width: 95%;
    margin: 10px;
  }

  .modal-footer {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .interaction-stats {
    grid-template-columns: 1fr;
  }

  .interaction-item {
    justify-content: center;
    text-align: center;
  }
}
</style>
