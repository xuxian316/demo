<template>
  <div class="sidebar-container">
    <div class="logo-header">
      <div class="logo-box">
        <el-icon class="flask-icon"><Scissor /></el-icon> <span class="logo-text">有机化学</span>
      </div>
    </div>

    <el-menu
    :default-active="activeIndex"
    class="custom-menu"
    text-color="#8f9bb3"
    active-text-color="#ffffff"
    background-color="transparent"
    router 
  >
    <el-menu-item index="/demo/dashboard">
      <el-icon><Menu /></el-icon>
      <span>行业全景</span>
    </el-menu-item>
    
    <el-menu-item index="/demo/explore">
      <el-icon><Search /></el-icon>
      <span>岗位探索</span>
    </el-menu-item>
    
    <el-menu-item index="/demo/map">
      <el-icon><Coin /></el-icon>
      <span>薪资地图</span>
    </el-menu-item>
    
    <el-menu-item index="/demo/careerchange">
      <el-icon><Guide /></el-icon>
      <span>转行路径</span>
    </el-menu-item>
    
    <el-menu-item index="/demo/calendar">
      <el-icon><Calendar /></el-icon>
      <span>求职日历</span>
    </el-menu-item>
    
    <el-menu-item index="/demo/toolbox">
      <el-icon><Box /></el-icon>
      <span>工具箱</span>
    </el-menu-item>
  </el-menu>
  </div>
</template>

<script setup>

import { computed } from 'vue'
import { useRoute } from 'vue-router'
// 统一在这里引入所有需要的图标
import {
  Menu,
  Search,
  Coin,
  Guide,
  Calendar,
  Box,
  Scissor // 占位用
} from '@element-plus/icons-vue'

const route = useRoute()

// 使用计算属性，让 default-active 始终等于当前 URL 的路径
const activeIndex = computed(() => {
  return route.path
})

</script>


<style scoped>
/* 侧边栏主容器 */
.sidebar-container {
  width: 240px;
  height: 100%;
  /* 匹配你设计图的深色背景 */
  background-color: #0f121d; 
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  box-sizing: border-box;
  /* 右侧边框，用来和主内容区区分 */
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

/* Logo 区域样式 */
.logo-header {
  margin-bottom: 32px;
  padding: 0 12px;
}

.logo-box {
  display: flex;
  align-items: center;
  background-color: #1a1e2d; /* Logo 背景色 */
  padding: 10px 16px;
  border-radius: 8px;
}

.flask-icon {
  font-size: 18px;
  color: #4ade80; /* 类似图中的薄荷绿色 */
  margin-right: 12px;
}

.logo-text {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}

/* 覆盖 Element Plus 菜单默认样式 */
.custom-menu {
  border-right: none !important; /* 去除默认右侧边框 */
}

/* 菜单项基础样式 */
:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  border-radius: 8px; /* 设计图中的圆角效果 */
  margin-bottom: 8px;
  padding-left: 16px !important; /* 调整图标与左边缘距离 */
  transition: all 0.3s ease;
}

/* 菜单项鼠标悬浮样式 */
:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: #ffffff !important;
}

/* 选中状态的样式 */
:deep(.el-menu-item.is-active) {
  background-color: #1a1e2d !important; /* 设计图中的选中背景色 */
  color: #ffffff !important;
  font-weight: 500;
}

/* 图标样式调整 */
:deep(.el-menu-item [class^="el-icon"]) {
  margin-right: 12px;
  font-size: 18px;
  width: 24px;
  text-align: center;
}
</style>