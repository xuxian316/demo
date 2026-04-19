<template>
  <div class="header-container">
    <div class="header-left">
      <h2 class="page-title">
        有机化学 
        <span class="sub-title" v-if="currentTitle">/ {{ currentTitle }}</span>
      </h2>
    </div>

    <div class="header-right">
      <div class="search-wrapper hidden-xs-only">
        <el-input
          v-model="searchQuery"
          placeholder="搜索企业或岗位..."
          prefix-icon="Search"
          class="dark-input"
        />
      </div>

      <div class="action-btn">
        <el-badge is-dot type="danger">
          <el-icon :size="20"><Bell /></el-icon>
        </el-badge>
      </div>

      <el-dropdown trigger="click" placement="bottom-end">
        <div class="user-profile">
          <el-avatar :size="32" class="user-avatar">
            W
          </el-avatar>
          <span class="username">王晨阳</span>
          <el-icon class="arrow-icon"><ArrowDown /></el-icon>
        </div>
        
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item icon="User">个人中心</el-dropdown-item>
            <el-dropdown-item icon="Setting">系统设置</el-dropdown-item>
            <el-dropdown-item divided icon="SwitchButton">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, Bell, ArrowDown, User, Setting, SwitchButton } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
const searchQuery = ref('')
const route = useRoute()
const currentTitle = computed(() => {
  return route.meta.title || '' // 获取当前路由 meta 中的 title，如果没有则返回空
})
</script>

<style scoped>
/* 让 header 容器撑满 el-header */
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 0 20px;
  box-sizing: border-box;
  background-color: #0d1117; /* 匹配主背景色 */
  border-bottom: 1px solid rgba(255, 255, 255, 0.05); /* 底部微弱分割线 */
}

/* 左侧标题样式 */
.page-title {
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  letter-spacing: 1px;
}

.sub-title {
  color: #8f9bb3;
  font-size: 14px;
  font-weight: 400;
  margin-left: 8px;
}

/* 右侧操作区布局 */
.header-right {
  display: flex;
  align-items: center;
  gap: 24px; /* 元素之间的间距 */
}

/* 深色搜索框定制 */
:deep(.dark-input .el-input__wrapper) {
  background-color: #1a1e2d;
  box-shadow: none !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  transition: border-color 0.3s ease;
}

:deep(.dark-input .el-input__wrapper.is-focus) {
  border-color: #4ade80; /* 聚焦时显示主题绿 */
}

:deep(.dark-input .el-input__inner) {
  color: #ffffff;
}

/* 通知图标样式 */
.action-btn {
  color: #8f9bb3;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color 0.3s ease;
}

.action-btn:hover {
  color: #ffffff;
}

/* 用户区域样式 */
.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background-color 0.3s ease;
}

.user-profile:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.user-avatar {
  background: linear-gradient(135deg, #4ade80 0%, #38b2ac 100%); /* 头像背景渐变 */
  color: #111526;
  font-weight: bold;
}

.username {
  color: #e2e8f0;
  font-size: 14px;
  margin: 0 8px 0 12px;
}

.arrow-icon {
  color: #8f9bb3;
  font-size: 12px;
}
</style>