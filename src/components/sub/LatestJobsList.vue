<template>
  <div class="jobs-container">
    <div class="jobs-header">
      <div class="jobs-header-copy">
        <h3 v-if="selectedCategory" class="jobs-title">
          当前分类：<span class="highlight">{{ selectedCategory.name }}</span>
        </h3>
        <h3 v-else class="jobs-title">巨头风向标</h3>
        <p class="jobs-subtitle">根据当前分类展示 世界顶级巨头</p>
      </div>

      <div class="jobs-badge">
        {{ jobs.length }}
      </div>
    </div>

    <div v-if="loading" class="state-card">
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p>正在加载数据...</p>
    </div>

    <div v-else-if="errorMessage" class="state-card error-state">
      <p>{{ errorMessage }}</p>
    </div>

    <div v-else-if="jobs.length" class="job-list">
      <article
        v-for="(job, index) in jobs"
        :key="job?.id || index"
        class="job-card"
      >
        <div class="job-card-top">
          <span class="job-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="job-tag">{{ selectedCategory?.name || '全部' }}</span>
        </div>

        <div class="job-content">
          {{ typeof job === 'object' ? JSON.stringify(job) : job }}
        </div>
      </article>
    </div>

    <div v-else class="state-card empty-state">
      <p>暂无数据</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

import { supabase } from '../../lib/supabase'

const jobs = ref([])
const loading = ref(false)
const errorMessage = ref('')

const props = defineProps({
  selectedCategory: {
    type: Object,
    default: null
  }
})



const fetchJobsData = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const columnName = props.selectedCategory?.id || "fault";

    let query = supabase.from('treedata')

    if (columnName) {
      query = query.select(columnName)
    } else {
      query = query.select('*')
    }

    const { data, error } = await query

    if (error) throw error

    jobs.value = data ?? []
    console.log("获取到数据", jobs.value)
  } catch (err) {
    jobs.value = []
    errorMessage.value = err.message || '数据错误'
    console.error('数据错误', err)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.selectedCategory,
  (category) => {
    fetchJobsData(category)
  },
  { deep: true }
)

onMounted(() => {
  fetchJobsData(props.selectedCategory)
})
</script>

<style scoped>
.jobs-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  color: #eefcf4;
}

.jobs-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(174, 255, 213, 0.18);
  background:
    radial-gradient(circle at top right, rgba(110, 255, 185, 0.2), transparent 35%),
    linear-gradient(135deg, rgba(10, 66, 39, 0.96), rgba(5, 42, 24, 0.94));
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.18);
}

.jobs-header-copy {
  min-width: 0;
}

.jobs-title {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
  font-weight: 700;
}

.jobs-subtitle {
  margin: 8px 0 0;
  color: rgba(238, 252, 244, 0.72);
  font-size: 13px;
  line-height: 1.5;
}

.highlight {
  color: #9df7c0;
  text-shadow: 0 0 14px rgba(157, 247, 192, 0.2);
}

.jobs-badge {
  flex-shrink: 0;
  min-width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  padding: 0 10px;
  border-radius: 16px;
  background: linear-gradient(180deg, #a7ffd0, #4bc47c);
  color: #083420;
  font-size: 20px;
  font-weight: 800;
  box-shadow: 0 12px 24px rgba(75, 196, 124, 0.3);
}

.job-list {
  display: grid;
  gap: 12px;
  overflow-y: auto;
  padding-right: 4px;
}

.job-list::-webkit-scrollbar {
  width: 8px;
}

.job-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(167, 255, 208, 0.28);
}

.job-card,
.state-card {
  border-radius: 18px;
  border: 1px solid rgba(174, 255, 213, 0.14);
  background: linear-gradient(180deg, rgba(14, 73, 43, 0.9), rgba(8, 43, 26, 0.96));
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.14);
}

.job-card {
  padding: 14px 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.job-card:hover {
  transform: translateY(-2px);
  border-color: rgba(157, 247, 192, 0.34);
  box-shadow: 0 20px 34px rgba(0, 0, 0, 0.22);
}

.job-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.job-index {
  color: rgba(238, 252, 244, 0.58);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.job-tag {
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(157, 247, 192, 0.22);
  background: rgba(157, 247, 192, 0.1);
  color: #9df7c0;
  font-size: 12px;
  line-height: 1;
}

.job-content {
  color: #f4fff8;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
}

.state-card {
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  text-align: center;
  color: rgba(238, 252, 244, 0.82);
}

.error-state {
  border-color: rgba(255, 176, 176, 0.24);
  color: #ffd5d5;
}

.empty-state {
  color: rgba(238, 252, 244, 0.62);
}

.loading-dots {
  display: flex;
  gap: 8px;
}

.loading-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #9df7c0;
  animation: pulse 1s infinite ease-in-out;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    transform: scale(0.7);
    opacity: 0.45;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .jobs-header {
    align-items: stretch;
    flex-direction: column;
  }

  .jobs-badge {
    width: fit-content;
  }
}
</style>
