<template>
  <div class="decision-page">
    <section class="hero-panel">
      <div class="hero-copy">
        <p class="eyebrow">UNDERGRAD OPPORTUNITY LAB</p>
        <h1>本科生求职决策</h1>
        <p class="hero-text">
          把 5000+ 条化学/材料相关岗位拆成你真正关心的四个问题：真实起薪、还能做什么、去哪座城市投、以及哪个行业更值得追。
        </p>
      </div>

      <div class="hero-kpis">
        <article v-for="item in headlineKpis" :key="item.label" class="hero-kpi">
          <span>{{ item.label }}</span>
          <strong>{{ formatKpiValue(item) }}</strong>
          <small v-if="item.type === 'city' && item.subValue">{{ item.subValue }} 个岗位样本</small>
        </article>
      </div>
    </section>

    <el-card class="filter-card" shadow="never">
      <div class="filter-grid">
        <div class="filter-item">
          <span>学历视角</span>
          <el-select v-model="filters.focusEducation">
            <el-option label="本科" value="本科" />
            <el-option label="硕士" value="硕士" />
            <el-option label="博士" value="博士" />
          </el-select>
        </div>

        <div class="filter-item">
          <span>经验预设</span>
          <el-select v-model="filters.experiencePreset">
            <el-option label="新人友好" value="新人友好" />
            <el-option label="全部经验" value="全部经验" />
            <el-option label="进阶岗位" value="进阶岗位" />
          </el-select>
        </div>

        <div class="filter-item">
          <span>城市</span>
          <el-select v-model="filters.city" filterable>
            <el-option
              v-for="city in cityOptions"
              :key="city"
              :label="city"
              :value="city"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <span>行业</span>
          <el-select v-model="filters.industry" filterable>
            <el-option
              v-for="industry in industryOptions"
              :key="industry"
              :label="industry"
              :value="industry"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <span>公司规模</span>
          <el-select v-model="filters.companySize" filterable>
            <el-option
              v-for="size in sizeOptions"
              :key="size"
              :label="size"
              :value="size"
            />
          </el-select>
        </div>

        <div class="filter-item">
          <span>地图样本门槛</span>
          <el-slider
            v-model="filters.minCitySample"
            :min="3"
            :max="15"
            :step="1"
            show-input
            size="small"
          />
        </div>
      </div>
    </el-card>

    <div v-if="loading" class="state-panel">正在加载专题数据...</div>
    <div v-else-if="error" class="state-panel is-error">{{ error }}</div>
    <div v-else-if="!scopedJobs.length" class="state-panel">当前筛选下暂无岗位数据</div>

    <template v-else>
      <section class="story-grid">
        <el-card class="panel panel-span-8" shadow="never">
          <template #header>
            <div class="panel-header">
              <div>
                <h2>1. 属于本科生的真实起薪与天花板</h2>
                <p>先看真实中位数，再看本科和硕士在四分位上的差距。</p>
              </div>
              <el-tag type="success" effect="plain">
                {{ filters.experiencePreset }}
              </el-tag>
            </div>
          </template>

          <div class="salary-summary">
            <article class="summary-card">
              <span>中位数</span>
              <strong>{{ formatSalary(focusSalaryStats.median) }}</strong>
            </article>
            <article class="summary-card">
              <span>P25 - P75</span>
              <strong>{{ formatSalaryRange(focusSalaryStats.q1, focusSalaryStats.q3) }}</strong>
            </article>
            <article class="summary-card">
              <span>面议占比</span>
              <strong>{{ formatPercent(focusSalaryStats.negotiableRatio) }}</strong>
            </article>
            <article class="summary-card">
              <span>样本量</span>
              <strong>{{ focusSalaryStats.totalCount }}</strong>
            </article>
          </div>

          <div ref="salaryChartRef" class="chart-box chart-lg"></div>
        </el-card>

        <el-card class="panel panel-span-4" shadow="never">
          <template #header>
            <div class="panel-header">
              <div>
                <h2>学历差距快照</h2>
                <p>不是看个例高薪，而是看本硕分布的常态差异。</p>
              </div>
            </div>
          </template>

          <div class="side-insight-list">
            <article class="insight-card">
              <span>本科 vs 硕士中位差</span>
              <strong>{{ formatSalaryDelta(masterVsBachelorGap.medianGap) }}</strong>
              <small>当前口径下的薪资中点中位差</small>
            </article>

            <article class="insight-card">
              <span>本科 vs 硕士高位差</span>
              <strong>{{ formatSalaryDelta(masterVsBachelorGap.q3Gap) }}</strong>
              <small>对比上四分位，观察天花板差异</small>
            </article>

            <article class="insight-card">
              <span>面议提醒</span>
              <strong>{{ formatPercent(focusSalaryStats.negotiableRatio) }}</strong>
              <small>面议岗位不进入分布统计，但会拉高投递不确定性</small>
            </article>
          </div>
        </el-card>
      </section>

      <section class="story-grid">
        <el-card class="panel panel-span-7" shadow="never">
          <template #header>
            <div class="panel-header">
              <div>
                <h2>2. 我到底能干什么</h2>
                <p>本科岗位里出现最多的不只是化学工程师，还有销售、应用、分析和专利方向。</p>
              </div>
            </div>
          </template>

          <JobWordCloud
            :words="wordCloudStats"
            :active-word="selectedWord"
            @select="toggleWord"
          />

          <div class="tag-toolbar">
            <el-tag v-if="selectedWord" type="success" effect="dark" closable @close="selectedWord = ''">
              已锁定：{{ selectedWord }}
            </el-tag>
            <span v-else>点击词云可查看该方向的经验门槛与岗位榜单</span>
          </div>
        </el-card>

        <el-card class="panel panel-span-5" shadow="never">
          <template #header>
            <div class="panel-header">
              <div>
                <h2>经验门槛拆解</h2>
                <p>看这个职位词背后，到底更偏应届友好还是只招有经验的人。</p>
              </div>
            </div>
          </template>

          <div ref="experienceChartRef" class="chart-box chart-md"></div>

          <div class="mini-table">
            <div class="mini-table-title">新人友好岗位 Top 8</div>
            <article v-for="job in topJobsForDisplay" :key="job.name" class="mini-row">
              <div>
                <strong>{{ job.name }}</strong>
                <small>{{ job.count }} 个样本</small>
              </div>
              <span>{{ formatSalary(job.medianSalary) }}</span>
            </article>
          </div>
        </el-card>
      </section>

      <section class="story-grid">
        <el-card class="panel panel-span-8" shadow="never">
          <template #header>
            <div class="panel-header">
              <div>
                <h2>3. 去哪里淘金最划算</h2>
                <p>颜色表示省级中位薪资，tooltip 展示省内城市样本与薪资；右侧榜单更适合直接拿来定投递城市。</p>
              </div>
              <el-tag type="info" effect="plain">
                样本门槛 ≥ {{ filters.minCitySample }}
              </el-tag>
            </div>
          </template>

          <div ref="provinceMapRef" class="chart-box chart-xl"></div>
        </el-card>

        <el-card class="panel panel-span-4" shadow="never">
          <template #header>
            <div class="panel-header">
              <div>
                <h2>城市性价比榜</h2>
                <p>{{ selectedProvinceLabel }}</p>
              </div>
            </div>
          </template>

          <div class="mini-table city-table">
            <article v-for="city in rankedCities" :key="city.city" class="mini-row">
              <div>
                <strong>{{ city.city }}</strong>
                <small>{{ city.sampleCount }} 岗位 · {{ city.representativeIndustry }}</small>
              </div>
              <div class="city-metrics">
                <span>{{ formatSalary(city.salary.median) }}</span>
                <small>{{ formatPercent(city.negotiableRatio) }} 面议</small>
              </div>
            </article>
          </div>
        </el-card>
      </section>

      <section class="story-grid">
        <el-card class="panel panel-span-7" shadow="never">
          <template #header>
            <div class="panel-header">
              <div>
                <h2>4. 站在风口上</h2>
                <p>先看谁在大规模招人，再点进规模结构，分清是小厂多还是大厂多。</p>
              </div>
            </div>
          </template>

          <div ref="industryChartRef" class="chart-box chart-md"></div>
        </el-card>

        <el-card class="panel panel-span-5" shadow="never">
          <template #header>
            <div class="panel-header">
              <div>
                <h2>公司规模画像</h2>
                <p>{{ selectedIndustryLabel }}</p>
              </div>
            </div>
          </template>

          <div ref="sizeChartRef" class="chart-box chart-md"></div>

          <div class="industry-kpis">
            <article class="insight-card compact">
              <span>招人最多</span>
              <strong>{{ industryInsights.topHiringIndustry }}</strong>
            </article>
            <article class="insight-card compact">
              <span>新人最友好</span>
              <strong>{{ industryInsights.bestEntryIndustry }}</strong>
            </article>
            <article class="insight-card compact">
              <span>中位薪资最高</span>
              <strong>{{ industryInsights.highestMedianIndustry }}</strong>
            </article>
            <article class="insight-card compact">
              <span>大厂集中度最高</span>
              <strong>{{ industryInsights.biggestCompanyIndustry }}</strong>
            </article>
          </div>
        </el-card>
      </section>
    </template>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import JobWordCloud from '../components/analytics/JobWordCloud.vue'
import { useJobsAnalytics } from '../composables/useJobsAnalytics'

const MAP_NAME = 'china'

const {
  loading,
  error,
  filters,
  cityOptions,
  industryOptions,
  sizeOptions,
  scopedJobs,
  focusEducationJobs,
  focusEducationWithExperience,
  focusJobsAcrossExperience,
  salaryComparisonStats,
  focusSalaryStats,
  wordCloudStats,
  experienceDistribution,
  newGradTopJobs,
  cityStats,
  provinceStats,
  industryStats,
  industryInsights,
  headlineKpis,
  fetchJobs,
} = useJobsAnalytics()

const selectedWord = ref('')
const selectedProvince = ref('')
const selectedIndustry = ref('')

const salaryChartRef = ref(null)
const experienceChartRef = ref(null)
const provinceMapRef = ref(null)
const industryChartRef = ref(null)
const sizeChartRef = ref(null)

const chartInstances = new Map()
let resizeObserver = null
let mapRegistered = false

const jobsForSelectedWord = computed(() => {
  if (!selectedWord.value) return focusJobsAcrossExperience.value
  return focusJobsAcrossExperience.value.filter((item) => item.titleTokens.includes(selectedWord.value))
})

const experienceDistributionForDisplay = computed(() => {
  const counter = new Map()
  jobsForSelectedWord.value.forEach((item) => {
    counter.set(item.experienceLabel, (counter.get(item.experienceLabel) || 0) + 1)
  })

  const source = counter.size
    ? [...counter.entries()].map(([label, value]) => ({ label, value }))
    : experienceDistribution.value

  return source.sort((a, b) => b.value - a.value)
})

const topJobsForDisplay = computed(() => {
  if (!selectedWord.value) return newGradTopJobs.value

  const counter = new Map()

  focusEducationWithExperience.value
    .filter((item) => item.titleTokens.includes(selectedWord.value))
    .forEach((item) => {
      const title = item.job_title || '未命名岗位'
      if (!counter.has(title)) {
        counter.set(title, {
          name: title,
          count: 0,
          salaries: [],
        })
      }

      const target = counter.get(title)
      target.count += 1
      if (Number.isFinite(item.salaryMidpoint)) {
        target.salaries.push(item.salaryMidpoint)
      }
    })

  return [...counter.values()]
    .map((entry) => ({
      ...entry,
      medianSalary: entry.salaries.length
        ? entry.salaries.sort((a, b) => a - b)[Math.floor(entry.salaries.length / 2)]
        : null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
})

const selectedProvinceLabel = computed(() => {
  return selectedProvince.value ? `当前查看：${selectedProvince.value}` : '默认按全国城市中位薪资排序'
})

const rankedCities = computed(() => {
  const source = selectedProvince.value
    ? cityStats.value.filter((item) => item.province === selectedProvince.value)
    : cityStats.value

  return source.slice(0, 10)
})

const selectedIndustryLabel = computed(() => {
  return selectedIndustry.value ? `当前查看：${selectedIndustry.value}` : '点击左侧环图切换行业'
})

const sizeDistributionForDisplay = computed(() => {
  const targetIndustry = selectedIndustry.value || industryStats.value[0]?.name
  const source = focusEducationWithExperience.value.filter((item) => item.industry === targetIndustry)
  const counter = new Map()

  source.forEach((item) => {
    counter.set(item.companySizeLabel, (counter.get(item.companySizeLabel) || 0) + 1)
  })

  return [...counter.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
})

const masterVsBachelorGap = computed(() => {
  const bachelor = salaryComparisonStats.value.find((item) => item.name === '本科')
  const master = salaryComparisonStats.value.find((item) => item.name === '硕士')

  return {
    medianGap: (master?.median || 0) - (bachelor?.median || 0),
    q3Gap: (master?.q3 || 0) - (bachelor?.q3 || 0),
  }
})

function formatSalary(value) {
  if (!Number.isFinite(value)) return '暂无'
  return `${(value / 1000).toFixed(value >= 10000 ? 1 : 0)}k`
}

function formatSalaryRange(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return '暂无'
  return `${formatSalary(min)} - ${formatSalary(max)}`
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return '0%'
  return `${(value * 100).toFixed(1)}%`
}

function formatSalaryDelta(value) {
  if (!Number.isFinite(value)) return '暂无'
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatSalary(value)}`
}

function formatKpiValue(item) {
  if (item.type === 'salary') return formatSalary(item.value)
  if (item.type === 'ratio') return formatPercent(item.value)
  if (item.type === 'count') return `${item.value || 0}`
  return item.value || '暂无'
}

function toggleWord(word) {
  selectedWord.value = selectedWord.value === word ? '' : word
}

async function ensureChinaMapRegistered() {
  if (mapRegistered) return

  const response = await fetch('/china.json')
  if (!response.ok) {
    throw new Error('中国地图 GeoJSON 加载失败')
  }

  const geoJson = await response.json()
  echarts.registerMap(MAP_NAME, geoJson)
  mapRegistered = true
}

function getOrCreateChart(key, element) {
  if (!element) return null

  if (!chartInstances.has(key)) {
    chartInstances.set(key, echarts.init(element))
  }

  return chartInstances.get(key)
}

function buildSalaryOption() {
  const categories = salaryComparisonStats.value.map((item) => item.name)
  const boxData = salaryComparisonStats.value.map((item) => [
    item.min || 0,
    item.q1 || 0,
    item.median || 0,
    item.q3 || 0,
    item.max || 0,
  ])

  return {
    backgroundColor: 'transparent',
    grid: {
      left: 28,
      right: 24,
      top: 28,
      bottom: 40,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(8, 12, 20, 0.95)',
      borderColor: 'rgba(116, 240, 175, 0.2)',
      textStyle: { color: '#eaf2ff' },
      formatter: (params) => {
        const stat = salaryComparisonStats.value[params.dataIndex]
        return [
          `<strong>${stat.name}</strong>`,
          `样本量：${stat.sampleCount}`,
          `中位数：${formatSalary(stat.median)}`,
          `P25：${formatSalary(stat.q1)}`,
          `P75：${formatSalary(stat.q3)}`,
          `面议占比：${formatPercent(stat.negotiableRatio)}`,
        ].join('<br/>')
      },
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#41506a' } },
      axisLabel: { color: '#d8e3f4' },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#8f9bb3',
        formatter: (value) => `${Math.round(value / 1000)}k`,
      },
      splitLine: {
        lineStyle: { color: 'rgba(255,255,255,0.07)' },
      },
    },
    series: [
      {
        type: 'boxplot',
        data: boxData,
        itemStyle: {
          color: 'rgba(116, 240, 175, 0.26)',
          borderColor: '#74f0af',
          borderWidth: 1.5,
        },
      },
    ],
  }
}

function buildExperienceOption() {
  const data = experienceDistributionForDisplay.value

  return {
    backgroundColor: 'transparent',
    grid: {
      left: 86,
      right: 18,
      top: 18,
      bottom: 20,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#8f9bb3' },
      splitLine: {
        lineStyle: { color: 'rgba(255,255,255,0.07)' },
      },
    },
    yAxis: {
      type: 'category',
      data: data.map((item) => item.label),
      axisLabel: { color: '#d8e3f4' },
      axisLine: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: data.map((item) => item.value),
        barWidth: 18,
        itemStyle: {
          borderRadius: [0, 12, 12, 0],
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#89f7bf' },
            { offset: 1, color: '#2f6f68' },
          ]),
        },
      },
    ],
  }
}

function buildProvinceMapOption() {
  const data = provinceStats.value.map((item) => ({
    name: item.name,
    value: item.salary.median || 0,
  }))
  const values = data.map((item) => item.value).filter(Boolean)
  const visualMax = values.length ? Math.max(...values) : 1

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(8, 12, 20, 0.95)',
      borderColor: 'rgba(116, 240, 175, 0.2)',
      textStyle: { color: '#eaf2ff', lineHeight: 20 },
      formatter: (params) => {
        const province = provinceStats.value.find((item) => item.name === params.name)
        if (!province) {
          return `${params.name}<br/>暂无样本`
        }

        const topCities = province.topCities
          .map((city) => `${city.city}：${formatSalary(city.salary.median)} / ${city.sampleCount} 岗`)
          .join('<br/>')

        return [
          `<strong>${province.name}</strong>`,
          `省级中位薪资：${formatSalary(province.salary.median)}`,
          `样本量：${province.sampleCount}`,
          `面议占比：${formatPercent(province.negotiableRatio)}`,
          `代表行业：${province.representativeIndustry}`,
          topCities,
        ].join('<br/>')
      },
    },
    visualMap: {
      min: 0,
      max: visualMax,
      orient: 'horizontal',
      left: 18,
      bottom: 14,
      text: ['高', '低'],
      textStyle: { color: '#d6dfef' },
      inRange: {
        color: ['#21473f', '#2c816a', '#7ce7b4', '#d8fff0'],
      },
      calculable: true,
    },
    series: [
      {
        type: 'map',
        map: MAP_NAME,
        roam: true,
        zoom: 1.1,
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            color: '#ffffff',
          },
          itemStyle: {
            areaColor: '#67eeb0',
          },
        },
        itemStyle: {
          areaColor: '#162739',
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
        },
        data,
      },
    ],
  }
}

function buildIndustryOption() {
  return {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const stat = industryStats.value.find((item) => item.name === params.name)
        return [
          `<strong>${params.name}</strong>`,
          `岗位数：${params.value}`,
          `中位薪资：${formatSalary(stat?.salary.median)}`,
          `面议占比：${formatPercent(stat?.negotiableRatio || 0)}`,
        ].join('<br/>')
      },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#a8b5ca' },
    },
    series: [
      {
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '46%'],
        data: industryStats.value.slice(0, 8).map((item) => ({
          name: item.name,
          value: item.count,
        })),
        label: {
          color: '#dce7f6',
          formatter: '{b}\n{d}%',
        },
        itemStyle: {
          borderRadius: 10,
          borderColor: '#101521',
          borderWidth: 3,
        },
      },
    ],
  }
}

function buildSizeOption() {
  return {
    grid: {
      left: 48,
      right: 20,
      top: 20,
      bottom: 34,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    xAxis: {
      type: 'category',
      data: sizeDistributionForDisplay.value.map((item) => item.name),
      axisLabel: {
        color: '#b6c3d7',
        interval: 0,
        rotate: 24,
      },
      axisLine: { lineStyle: { color: '#3b4b64' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#8f9bb3' },
      splitLine: {
        lineStyle: { color: 'rgba(255,255,255,0.07)' },
      },
    },
    series: [
      {
        type: 'bar',
        data: sizeDistributionForDisplay.value.map((item) => item.value),
        barMaxWidth: 34,
        itemStyle: {
          borderRadius: [10, 10, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#f4b86a' },
            { offset: 1, color: '#7f5d2f' },
          ]),
        },
      },
    ],
  }
}

function setChartOption(key, refElement, optionBuilder, onReady) {
  const instance = getOrCreateChart(key, refElement?.value)
  if (!instance) return

  instance.setOption(optionBuilder(), true)
  if (onReady) onReady(instance)
  instance.resize()
}

function syncCharts() {
  if (loading.value || error.value || !scopedJobs.value.length) return

  setChartOption('salary', salaryChartRef, buildSalaryOption)
  setChartOption('experience', experienceChartRef, buildExperienceOption)
  setChartOption('province', provinceMapRef, buildProvinceMapOption, (instance) => {
    instance.off('click')
    instance.on('click', (params) => {
      selectedProvince.value = selectedProvince.value === params.name ? '' : params.name
    })
  })
  setChartOption('industry', industryChartRef, buildIndustryOption, (instance) => {
    instance.off('click')
    instance.on('click', (params) => {
      selectedIndustry.value = selectedIndustry.value === params.name ? '' : params.name
    })
  })
  setChartOption('size', sizeChartRef, buildSizeOption)
}

function handleResize() {
  chartInstances.forEach((instance) => instance.resize())
}

watch(
  [salaryComparisonStats, focusSalaryStats, experienceDistributionForDisplay, provinceStats, industryStats, sizeDistributionForDisplay],
  async () => {
    await nextTick()
    syncCharts()
  },
  { deep: true }
)

watch(industryStats, (items) => {
  if (!items.length) {
    selectedIndustry.value = ''
    return
  }

  if (!items.some((item) => item.name === selectedIndustry.value)) {
    selectedIndustry.value = items[0].name
  }
}, { immediate: true })

watch(provinceStats, (items) => {
  if (!selectedProvince.value) return
  if (!items.some((item) => item.name === selectedProvince.value)) {
    selectedProvince.value = ''
  }
}, { immediate: true })

onMounted(async () => {
  await ensureChinaMapRegistered()
  await fetchJobs()
  await nextTick()
  syncCharts()

  window.addEventListener('resize', handleResize)

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })

    ;[salaryChartRef, experienceChartRef, provinceMapRef, industryChartRef, sizeChartRef].forEach((chartRef) => {
      if (chartRef.value) resizeObserver.observe(chartRef.value)
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  resizeObserver?.disconnect()
  chartInstances.forEach((instance) => instance.dispose())
  chartInstances.clear()
})
</script>

<style scoped>
.decision-page {
  padding: 24px;
  color: #e5edf7;
  background:
    radial-gradient(circle at top left, rgba(100, 240, 170, 0.12), transparent 24%),
    radial-gradient(circle at 85% 15%, rgba(240, 184, 106, 0.1), transparent 18%),
    #0b0e14;
}

.hero-panel {
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  gap: 20px;
  padding: 28px;
  margin-bottom: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 26px;
  background:
    linear-gradient(135deg, rgba(20, 27, 42, 0.98) 0%, rgba(11, 14, 20, 0.98) 58%),
    radial-gradient(circle at top right, rgba(116, 240, 175, 0.22), transparent 20%);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.28);
}

.eyebrow {
  color: #84efb7;
  letter-spacing: 0.22em;
  font-size: 12px;
  margin-bottom: 14px;
}

.hero-copy h1 {
  margin: 0 0 12px;
  font-size: 40px;
  line-height: 1.08;
  color: #fbfcff;
}

.hero-text {
  max-width: 760px;
  color: #91a0b8;
  font-size: 15px;
  line-height: 1.8;
}

.hero-kpis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.hero-kpi,
.summary-card,
.insight-card {
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.hero-kpi span,
.summary-card span,
.insight-card span {
  display: block;
  margin-bottom: 10px;
  color: #91a0b8;
  font-size: 13px;
}

.hero-kpi strong,
.summary-card strong,
.insight-card strong {
  display: block;
  color: #f8fbff;
  font-size: 28px;
  line-height: 1.2;
}

.hero-kpi small,
.insight-card small {
  display: block;
  margin-top: 8px;
  color: #6f809b;
  font-size: 12px;
  line-height: 1.6;
}

.filter-card,
.panel {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(20, 27, 42, 0.96) 0%, rgba(11, 14, 20, 0.98) 100%);
  box-shadow: 0 22px 44px rgba(0, 0, 0, 0.24);
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 18px;
}

.filter-item span {
  display: block;
  margin-bottom: 10px;
  color: #a8b5ca;
  font-size: 13px;
}

.state-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  margin-top: 20px;
  border-radius: 22px;
  color: #d2deef;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(116, 240, 175, 0.22);
}

.state-panel.is-error {
  color: #ffd5d5;
  border-color: rgba(255, 120, 120, 0.3);
}

.story-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.panel-span-8 {
  grid-column: span 8;
}

.panel-span-7 {
  grid-column: span 7;
}

.panel-span-5 {
  grid-column: span 5;
}

.panel-span-4 {
  grid-column: span 4;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel-header h2 {
  margin: 0 0 8px;
  color: #f7fbff;
  font-size: 22px;
}

.panel-header p {
  color: #8f9bb3;
  font-size: 14px;
  line-height: 1.6;
}

.salary-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.chart-box {
  width: 100%;
}

.chart-lg {
  height: 360px;
}

.chart-md {
  height: 320px;
}

.chart-xl {
  height: 560px;
}

.side-insight-list,
.industry-kpis {
  display: grid;
  gap: 14px;
}

.insight-card.compact strong {
  font-size: 18px;
}

.tag-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  color: #8f9bb3;
  font-size: 13px;
}

.mini-table {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.mini-table-title {
  color: #dbe6f7;
  font-size: 14px;
  font-weight: 600;
}

.mini-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.mini-row strong {
  display: block;
  margin-bottom: 6px;
  color: #eef4fd;
  font-size: 14px;
}

.mini-row small {
  color: #8090aa;
  font-size: 12px;
  line-height: 1.5;
}

.mini-row span {
  color: #74f0af;
  font-size: 15px;
  font-weight: 600;
}

.city-table {
  max-height: 640px;
  overflow: auto;
}

.city-metrics {
  text-align: right;
}

.city-metrics small {
  display: block;
  margin-top: 6px;
}

:deep(.el-card__header) {
  padding: 22px 24px 8px;
  border-bottom: none;
}

:deep(.el-card__body) {
  padding: 18px 24px 24px;
}

:deep(.el-select),
:deep(.el-slider) {
  width: 100%;
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  min-height: 44px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused) {
  border-color: rgba(116, 240, 175, 0.48);
  box-shadow: 0 0 0 3px rgba(116, 240, 175, 0.1);
}

:deep(.el-select__placeholder),
:deep(.el-select__selected-item),
:deep(.el-input__inner),
:deep(.el-slider__input) {
  color: #edf4ff;
}

:deep(.el-slider__runway) {
  background: rgba(255, 255, 255, 0.08);
}

:deep(.el-slider__bar) {
  background: linear-gradient(90deg, #74f0af, #f0b96d);
}

:deep(.el-tag) {
  border-radius: 999px;
}

@media (max-width: 1280px) {
  .filter-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .panel-span-8,
  .panel-span-7,
  .panel-span-5,
  .panel-span-4 {
    grid-column: span 12;
  }
}

@media (max-width: 900px) {
  .decision-page {
    padding: 16px;
  }

  .hero-panel {
    grid-template-columns: 1fr;
    padding: 22px;
  }

  .hero-kpis,
  .salary-summary,
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .hero-copy h1 {
    font-size: 30px;
  }

  .chart-xl {
    height: 500px;
  }
}
</style>
