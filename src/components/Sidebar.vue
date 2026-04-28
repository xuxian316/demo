<template>
  <div class="sidebar-container">
    <div class="logo-header">
      <div class="logo-box">
        <el-icon class="flask-icon"><Scissor /></el-icon>
        <span class="logo-text">有机化学</span>
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

      <el-menu-item index="/demo/graduate-decision">
        <el-icon><DataAnalysis /></el-icon>
        <span>本科生决策</span>
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
import {
  Box,
  Calendar,
  Coin,
  DataAnalysis,
  Guide,
  Menu,
  Scissor,
  Search,
} from '@element-plus/icons-vue'

const route = useRoute()
const activeIndex = computed(() => route.path)
</script>

<style scoped>
.sidebar-container {
  width: 240px;
  height: 100%;
  background-color: #0f121d;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  box-sizing: border-box;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.logo-header {
  margin-bottom: 32px;
  padding: 0 12px;
}

.logo-box {
  display: flex;
  align-items: center;
  background-color: #1a1e2d;
  padding: 10px 16px;
  border-radius: 8px;
}

.flask-icon {
  font-size: 18px;
  color: #4ade80;
  margin-right: 12px;
}

.logo-text {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}

.custom-menu {
  border-right: none !important;
}

:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  border-radius: 8px;
  margin-bottom: 8px;
  padding-left: 16px !important;
  transition: all 0.3s ease;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: #ffffff !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #1a1e2d !important;
  color: #ffffff !important;
  font-weight: 500;
}

:deep(.el-menu-item [class^='el-icon']) {
  margin-right: 12px;
  font-size: 18px;
  width: 24px;
  text-align: center;
}
</style>
