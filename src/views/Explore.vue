<template>
  <div class="explore-container">
    <el-card class="filter-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <h2>岗位数据</h2>
            <p>从 Supabase 数据库读取岗位信息，每页展示 20 条记录。</p>
          </div>
          <el-tag type="info" effect="plain">
            共 {{ total }} 条
          </el-tag>
        </div>
      </template>

      <el-form :inline="true" :model="formState" @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input
            v-model.trim="formState.keyword"
            clearable
            placeholder="按岗位、公司、城市或行业搜索"
            style="width: 320px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSearch">
            查询
          </el-button>
          <el-button :disabled="loading" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div class="table-toolbar">
        <div class="toolbar-title">数据列表</div>
        <div class="toolbar-meta">
          第 {{ currentPage }} / {{ totalPages }} 页
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="job_title" label="岗位名称" min-width="180" />
        <el-table-column prop="company_name" label="公司名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="薪资" min-width="160">
          <template #default="{ row }">
            {{ formatSalary(row) }}
          </template>
        </el-table-column>
        <el-table-column label="工作地点" min-width="180">
          <template #default="{ row }">
            {{ formatLocation(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="experience_req" label="经验要求" min-width="140" show-overflow-tooltip />
        <el-table-column prop="edu_req" label="学历要求" min-width="140" show-overflow-tooltip />
        <el-table-column prop="company_size" label="公司规模" min-width="140" show-overflow-tooltip />
        <el-table-column prop="industry_category" label="行业类别" min-width="160" show-overflow-tooltip />
        <el-table-column label="岗位链接" min-width="120">
          <template #default="{ row }">
            <el-link
              v-if="row.job_link"
              :href="row.job_link"
              target="_blank"
              type="primary"
            >
              查看
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty :description="loading ? '正在加载数据...' : '暂无匹配数据'" />
        </template>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          background
          layout="prev, pager, next, jumper, total"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          :pager-count="7"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { supabase } from '../lib/supabase'

const TABLE_NAME = 'test'
const pageSize = 20

const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const tableData = ref([])

const formState = reactive({
  keyword: '',
})

const totalPages = computed(() => {
  const pages = Math.ceil(total.value / pageSize)
  return pages > 0 ? pages : 1
})

function formatSalary(row) {
  if (row?.is_negotiable) {
    return '面议'
  }

  const min = row?.salary_min
  const max = row?.salary_max

  if (min == null && max == null) {
    return '-'
  }

  if (min != null && max != null) {
    return `${min} - ${max}`
  }

  return `${min ?? max}`
}

function formatLocation(row) {
  const parts = [row?.city, row?.district].filter(Boolean)
  return parts.length > 0 ? parts.join(' / ') : '-'
}

async function fetchJobs(page = 1) {
  loading.value = true

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  try {
    let query = supabase
      .from(TABLE_NAME)
      .select('*', { count: 'exact' })
      .range(from, to)

    if (formState.keyword) {
      const keyword = formState.keyword.trim()
      query = query.or(
        [
          `job_title.ilike.%${keyword}%`,
          `company_name.ilike.%${keyword}%`,
          `city.ilike.%${keyword}%`,
          `district.ilike.%${keyword}%`,
          `industry_category.ilike.%${keyword}%`,
        ].join(',')
      )
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    tableData.value = Array.isArray(data) ? data : []
    total.value = count ?? 0

    const maxPage = Math.max(1, Math.ceil(total.value / pageSize))
    currentPage.value = page > maxPage ? maxPage : page

    if (page > maxPage && total.value > 0) {
      await fetchJobs(maxPage)
    }
  } catch (error) {
    tableData.value = []
    total.value = 0
    ElMessage.error(error.message || '加载数据失败，请检查表名和环境变量配置。')
    console.error('Failed to fetch jobs:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  fetchJobs(1)
}

function handleReset() {
  formState.keyword = ''
  currentPage.value = 1
  fetchJobs(1)
}

function handlePageChange(page) {
  currentPage.value = page
  fetchJobs(page)
}

onMounted(() => {
  fetchJobs(currentPage.value)
})
</script>

<style scoped>
.explore-container {
  width: 100%;
  padding: 24px;
  color: #e5edf7;
  background:
    radial-gradient(circle at top right, rgba(74, 222, 128, 0.08), transparent 24%),
    radial-gradient(circle at top left, rgba(56, 178, 172, 0.08), transparent 20%);
}

.filter-card,
.table-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(26, 30, 45, 0.94) 0%, rgba(15, 18, 29, 0.98) 100%);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(10px);
}

.filter-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.card-header h2 {
  margin: 0 0 6px;
  font-size: 22px;
  color: #f8fafc;
}

.card-header p {
  margin: 0;
  color: #8f9bb3;
  font-size: 14px;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.toolbar-title {
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
}

.toolbar-meta {
  color: #8f9bb3;
  font-size: 14px;
}

.pagination-wrap {
  display: flex;
  
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

:deep(.el-card__header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 20px 24px;
}

:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-tag.el-tag--info) {
  color: #d7ffe6;
  background: rgba(74, 222, 128, 0.12);
  border-color: rgba(74, 222, 128, 0.18);
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-form-item__label) {
  color: #c6d2e3;
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.04);
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
}

:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus) {
  background-color: rgba(255, 255, 255, 0.06);
  border-color: rgba(74, 222, 128, 0.55);
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.12);
}

:deep(.el-input__inner),
:deep(.el-input__prefix-inner) {
  color: #f8fafc;
}

:deep(.el-input__inner::placeholder) {
  color: #708198;
}

:deep(.el-button) {
  border-radius: 12px;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
}

:deep(.el-button--primary) {
  border-color: #4ade80;
  background: linear-gradient(135deg, #4ade80 0%, #38b2ac 100%);
  color: #08111a;
  box-shadow: 0 10px 22px rgba(56, 178, 172, 0.22);
}

:deep(.el-button--default) {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #e5edf7;
}

:deep(.el-button--default:hover) {
  border-color: rgba(74, 222, 128, 0.4);
  color: #ffffff;
  background: rgba(74, 222, 128, 0.08);
}

:deep(.el-table) {
  --el-table-border-color: rgba(255, 255, 255, 0.07);
  --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.04);
  --el-table-header-bg-color: rgba(255, 255, 255, 0.04);
  --el-table-tr-bg-color: transparent;
  --el-table-bg-color: transparent;
  --el-table-text-color: #e5edf7;
  --el-table-header-text-color: #9fb0c6;
  --el-fill-color-lighter: rgba(255, 255, 255, 0.03);
  border-radius: 14px;
  overflow: hidden;
}

:deep(.el-table th.el-table__cell) {
  background: rgba(255, 255, 255, 0.04);
  color: #9fb0c6;
  font-weight: 600;
}

:deep(.el-table tr),
:deep(.el-table__inner-wrapper::before) {
  background: transparent;
}

:deep(.el-table td.el-table__cell),
:deep(.el-table th.el-table__cell.is-leaf) {
  border-bottom-color: rgba(255, 255, 255, 0.06);
}

:deep(.el-table .cell) {
  color: #e5edf7;
}

:deep(.el-empty__description p) {
  color: #8f9bb3;
}

:deep(.el-link.el-link--primary) {
  color: #63f2a0;
}

:deep(.el-pagination) {
  --el-pagination-bg-color: #151b29;
  --el-pagination-text-color: #131313;
  --el-pagination-button-color: #060606;
  --el-pagination-hover-color: #63f2a0;
  --el-pagination-button-disabled-bg-color: #101521;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next),
:deep(.el-pagination .number),
:deep(.el-pagination .el-input__wrapper) {
  background-color: #151b29;
  border: 1px solid rgba(143, 155, 179, 0.16);
}

:deep(.el-pagination .btn-prev:hover),
:deep(.el-pagination .btn-next:hover),
:deep(.el-pagination .number:hover),
:deep(.el-pagination .el-input__wrapper:hover) {
  background-color: #1b2233;
  border-color: rgba(74, 222, 128, 0.24);
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background: linear-gradient(135deg, #4ade80 0%, #38b2ac 100%);
  color: #08111a;
}

@media (max-width: 768px) {
  .explore-container {
    padding: 16px;
  }

  .card-header,
  .table-toolbar,
  .pagination-wrap {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
