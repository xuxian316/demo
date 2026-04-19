<template>
  <div class="common-layout h-screen">
    <el-container class="main-container h-full">
      <el-aside width="240px">
        <Sidebar />
      </el-aside>

      <el-container class="page-container">
        <el-header height="60px" style="padding: 0;">
          <Header />
        </el-header>

        <el-main>
          <div class="content-container">
            <router-view />
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import Sidebar from '../components/Sidebar.vue'
import Header from '../components/Header.vue'
</script>

<style>
.page-container {
  min-height: 0;
}

.content-container {
  width: 100%;
  min-height: 100%;
  background-color: #161a28;
}
</style>
