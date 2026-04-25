<template>
  <div class="skill-panel">
    <h2 class="skill-title">行业标杆</h2>

    <div class="desc-container">
      <div v-if="!selectedCategory?.id" class="status-text">请选择左侧分类节点</div>
      <div v-else-if="loading" class="status-text">正在加载数据...</div>
      <div v-else-if="errorMessage" class="status-text">{{ errorMessage }}</div>
      <div v-else-if="jobDescription" class="desc-item">
        <h3 class="desc-title">{{ jobDescription.role || '岗位描述' }}</h3>

        <p
          v-if="jobDescription.roles_and_responsibilities?.summary"
          class="desc-summary"
        >
          {{ jobDescription.roles_and_responsibilities.summary }}
        </p>

        <p v-if="jobDescription.roles_and_responsibilities?.tasks?.length" class="section-title">
          职责内容
        </p>
        <p
          v-for="(task, index) in jobDescription.roles_and_responsibilities?.tasks || []"
          :key="`task-${index}`"
          class="list-item"
        >
          {{ index + 1 }}. {{ task }}
        </p>

        <p v-if="jobDescription.how_to_succeed?.candidate_profile" class="section-title">
          候选人画像
        </p>
        <p v-if="jobDescription.how_to_succeed?.candidate_profile" class="desc-summary">
          {{ jobDescription.how_to_succeed.candidate_profile }}
        </p>

        <p v-if="jobDescription.how_to_succeed?.requirements?.length" class="section-title">
          任职要求
        </p>
        <p
          v-for="(requirement, index) in jobDescription.how_to_succeed?.requirements || []"
          :key="`requirement-${index}`"
          class="list-item"
        >
          {{ index + 1 }}. {{ requirement }}
        </p>

        <p v-if="jobDescription.benefits?.compensation" class="meta-row">
          <span class="meta-label">薪资信息</span>
          <span class="meta-value">{{ jobDescription.benefits.compensation }}</span>
        </p>
        <p v-if="jobDescription.benefits?.contract_end_date" class="meta-row">
          <span class="meta-label">合同截止时间</span>
          <span class="meta-value">{{ jobDescription.benefits.contract_end_date }}</span>
        </p>
      </div>
      <div v-else class="status-text">暂无数据</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { supabase } from '../../lib/supabase'

const props = defineProps({
  selectedCategory: {
    type: Object,
    default: null
  }
})

const loading = ref(false)
const errorMessage = ref('')
const suggestionInfo = ref([])

const parsedCategoryData = computed(() => {
  const categoryId = props.selectedCategory?.id
  const rawValue = suggestionInfo.value[0]?.[categoryId]

  if (!rawValue) return null

  if (typeof rawValue === 'string') {
    try {
      return JSON.parse(rawValue)
    } catch {
      return null
    }
  }

  return rawValue
})

const jobDescription = computed(() => {
  const data = parsedCategoryData.value

  if (!data || typeof data !== 'object') return null

  return data.job_description ?? data
})

const fetchSuggestionData = async () => {
  const categoryId = props.selectedCategory?.id

  if (!categoryId) {
    suggestionInfo.value = []
    errorMessage.value = ''
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase
      .from('best-skill')
      .select(categoryId)

    if (error) throw error

    suggestionInfo.value = Array.isArray(data) ? data : []
  } catch (err) {
    suggestionInfo.value = []
    errorMessage.value = err.message || '数据加载失败'
    console.error('Failed to fetch suggestion data:', err)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.selectedCategory?.id,
  () => {
    fetchSuggestionData()
  }
)

onMounted(() => {
  fetchSuggestionData()
})
</script>

<style scoped>
.skill-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
  color: #eefcf4;
}

.skill-panel::-webkit-scrollbar {
  width: 8px;
}

.skill-panel::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(167, 255, 208, 0.28);
}

.skill-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.3;
  font-weight: 700;
}

.desc-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.status-text {
  padding: 18px 16px;
  border-radius: 16px;
  border: 1px solid rgba(174, 255, 213, 0.14);
  background: linear-gradient(180deg, rgba(14, 73, 43, 0.7), rgba(8, 43, 26, 0.82));
  color: rgba(244, 255, 248, 0.78);
  line-height: 1.7;
}

.desc-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid rgba(174, 255, 213, 0.14);
  background:
    radial-gradient(circle at top right, rgba(110, 255, 185, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(14, 73, 43, 0.88), rgba(8, 43, 26, 0.95));
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.16);
}

.desc-title,
.desc-item p {
  margin: 0;
}

.desc-title {
  font-size: 20px;
  line-height: 1.35;
  font-weight: 700;
  color: #f4fff8;
}

.desc-summary {
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(157, 247, 192, 0.08);
  border: 1px solid rgba(157, 247, 192, 0.12);
  color: rgba(244, 255, 248, 0.9);
  line-height: 1.8;
}

.section-title {
  margin-top: 4px;
  color: #9df7c0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.list-item {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(7, 35, 21, 0.4);
  border: 1px solid rgba(157, 247, 192, 0.1);
  color: rgba(244, 255, 248, 0.88);
  line-height: 1.75;
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(11, 58, 35, 0.82), rgba(7, 35, 21, 0.92));
  border: 1px solid rgba(174, 255, 213, 0.12);
}

.meta-label {
  color: rgba(157, 247, 192, 0.74);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.meta-value {
  color: rgba(244, 255, 248, 0.92);
  line-height: 1.7;
}
</style>
