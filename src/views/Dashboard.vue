<template>
  <div class="dashboard-container">
    <el-row :gutter="24" class="kpi-row">
      <el-col
        v-for="(item, index) in kpiList"
        :key="index"
        :xs="24"
        :sm="8"
        :md="8"
        :lg="8"
      >
        <div class="kpi-card" :class="`theme-${index}`">
          <div class="kpi-label">{{ item.label }}</div>
          <div class="kpi-value">{{ item.value }}</div>
        </div>
      </el-col>
    </el-row>

    <TreeAndListcontainer />
    <ChinaPharmaProvinceMap />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TreeAndListcontainer from '../components/treeAndListcontainer.vue'
import ChinaPharmaProvinceMap from '../components/ChinaPharmaProvinceMap.vue'

const kpiList = ref([
  { label: '本月新增岗位', value: '127' },
  { label: '平均薪资', value: '¥8,500 / 月' },
  { label: '招聘中企业', value: '43' },
])
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  box-sizing: border-box;
}

.kpi-row {
  margin-bottom: 24px;
  row-gap: 16px;
}

.kpi-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 110px;
  padding: 24px 28px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.kpi-label {
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  letter-spacing: 0.5px;
  z-index: 1;
}

.kpi-value {
  color: #ffffff;
  font-size: 32px;
  font-weight: 700;
  font-family: 'DIN Alternate', 'Helvetica Neue', Arial, sans-serif;
  z-index: 1;
}

.theme-0 {
  background: linear-gradient(135deg, rgba(35, 85, 82, 0.9) 0%, rgba(20, 45, 46, 0.9) 100%);
}

.theme-1 {
  background: linear-gradient(135deg, rgba(75, 60, 115, 0.9) 0%, rgba(35, 28, 55, 0.9) 100%);
}

.theme-2 {
  background: linear-gradient(135deg, rgba(115, 85, 45, 0.9) 0%, rgba(45, 35, 20, 0.9) 100%);
}
</style>
