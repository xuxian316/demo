<template>
  <div class="jobs-container">
    <div class="jobs-header">
      <div class="jobs-header-copy">
        <h3 v-if="selectedCategory" class="jobs-title">
          当前分类：<span class="highlight">{{ selectedCategory.name }}</span>
        </h3>
        <h3 v-else class="company-title">巨头风向标</h3>
        <p class="company-subtitle">根据当前分类展示 世界顶级巨头</p>
      </div>
    </div>

      <div class="company-list">
        <div v-if="loading">加载中...</div>
        <div v-else-if="errorMessage">{{ errorMessage }}</div>
        <div v-else-if="companyList.length">
          <div v-for="(item, index) in companyList" :key="item.label || index">
            <h4>{{ item.label }}</h4>
            <p>排名：{{ item[selectedCategory?.id]?.rank }}</p>
            <p>总部：{{ item[selectedCategory?.id]?.headquarters }}</p>
            <p>研发投入：{{ item[selectedCategory?.id]?.rd_investment }}</p>
            <p>描述：{{ item[selectedCategory?.id]?.description }}</p>
            <p>核心领域：{{ item[selectedCategory?.id]?.main_areas?.join('、') }}</p>
            <p>代表产品：{{ item[selectedCategory?.id]?.top_drugs?.join('、') }}</p>
          </div>
        </div>
        <div v-else>暂无数据</div>
      </div>
    </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'

import { supabase } from '../../lib/supabase'

const companyInfo = ref([])
const loading = ref(false)
const errorMessage = ref('')

const props = defineProps({
  selectedCategory: {
    type: Object,
    default: null
  }
})

const companyList = computed(() => {
  const categoryId = props.selectedCategory?.id
  if (!categoryId || !companyInfo.value.length) return []

  const firstRow = companyInfo.value[0]
  const list = firstRow?.[categoryId]

  return Array.isArray(list) ? list : []
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

    companyInfo.value = data ?? []
    console.log("获取到数据", companyInfo.value)
  } catch (err) {
    companyInfo.value = []
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
  flex: 1;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #eefcf4;
}

.jobs-header {
  flex-shrink: 0;
  width: 100%;
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
  margin-bottom: 10px;
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

.company-list {
  flex: 1;
  width: 100%;
  min-height: 0;
  display: grid;
  gap: 12px;
  overflow-y: auto;
  padding-right: 4px;
}

.company-list::-webkit-scrollbar {
  width: 8px;
}

.company-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(167, 255, 208, 0.28);
}

.company-list > div {
  width: 100%;
  min-width: 0;
  min-height: 0;
}

.company-list > div:first-child:not(:has(> div)),
.company-list > div:nth-child(2):not(:has(> div)),
.company-list > div:last-child:not(:has(> div)) {
  padding: 20px;
  border-radius: 18px;
  border: 1px solid rgba(174, 255, 213, 0.14);
  background: linear-gradient(180deg, rgba(14, 73, 43, 0.9), rgba(8, 43, 26, 0.96));
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.14);
}

.company-list > div > div {
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 18px;
  border: 1px solid rgba(174, 255, 213, 0.14);
  background: linear-gradient(180deg, rgba(14, 73, 43, 0.9), rgba(8, 43, 26, 0.96));
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.14);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  display: grid;
  gap: 10px;
}

.company-list > div > div:hover {
  transform: translateY(-2px);
  border-color: rgba(157, 247, 192, 0.34);
  box-shadow: 0 20px 34px rgba(0, 0, 0, 0.22);
}

.company-list h4 {
  margin: 0 0 12px;
  color: #f4fff8;
  font-size: 18px;
  line-height: 1.35;
}

.company-list p {
  margin: 0;
  color: rgba(244, 255, 248, 0.88);
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
}

.company-list p:first-of-type {
  color: rgba(157, 247, 192, 0.92);
  font-weight: 700;
  letter-spacing: 0.04em;
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(157, 247, 192, 0.12);
  border: 1px solid rgba(157, 247, 192, 0.16);
}

.company-list > div > div > p:nth-of-type(2),
.company-list > div > div > p:nth-of-type(3) {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(157, 247, 192, 0.06);
  border: 1px solid rgba(157, 247, 192, 0.12);
}

.company-list > div > div > p:nth-of-type(2) {
  margin-top: 4px;
}

.company-list > div > div > p:nth-of-type(4) {
  padding: 4px 0 2px;
  color: rgba(244, 255, 248, 0.92);
  line-height: 1.8;
}

.company-list > div > div > p:nth-of-type(5),
.company-list > div > div > p:nth-of-type(6) {
  padding: 14px 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(11, 58, 35, 0.78), rgba(7, 35, 21, 0.9));
  border: 1px solid rgba(174, 255, 213, 0.12);
}

.company-list > div > div > p:nth-of-type(5) {
  position: relative;
}

.company-list > div > div > p:nth-of-type(5)::before,
.company-list > div > div > p:nth-of-type(6)::before {
  display: block;
  margin-bottom: 8px;
  color: rgba(157, 247, 192, 0.7);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.company-list > div > div > p:nth-of-type(5)::before {
  content: '核心领域';
}

.company-list > div > div > p:nth-of-type(6)::before {
  content: '代表产品';
}

.company-list > div > div > p:nth-of-type(2),
.company-list > div > div > p:nth-of-type(3),
.company-list > div > div > p:nth-of-type(5),
.company-list > div > div > p:nth-of-type(6) {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

@media (max-width: 768px) {
  .company-list {
    max-height: 520px;
  }
}


</style>
