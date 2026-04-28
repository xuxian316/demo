import { computed, reactive, ref } from 'vue'
import { fetchAllRows } from '../lib/supabase'
import { getProvinceByCity, normalizeCityName } from '../lib/chinaRegions'

const TABLE_NAME = 'test'
const PAGE_SIZE = 1000
const NEW_GRAD_EXPERIENCE = ['经验不限', '1年以下', '1-3年']
const EDUCATION_ORDER = ['本科', '硕士', '博士']
const EXPERIENCE_ORDER = ['经验不限', '1年以下', '1-3年', '1年以上', '2年以上', '3年以上', '2-5年', '3-5年', '5年以上', '5-10年', '8年以上', '10年以上', '未知']
const TITLE_STOP_WORDS = new Set([
  '高级',
  '资深',
  '方向',
  '岗位',
  '招聘',
  '方向性',
  '经理岗',
  '经理',
  '总监',
  '副总监',
  '专员',
  '助理',
  '博士后',
  '应届',
  '优秀',
  '人员',
  '专业',
  '熟练',
  '老师',
  '教师岗',
  '负责人',
  '岗',
])
const TITLE_KEYWORDS = [
  '研发',
  '工艺',
  '工程师',
  '销售',
  '技术支持',
  '专利',
  '代理',
  '应用',
  '分析',
  '质量',
  '生产',
  '检测',
  '合成',
  '配方',
  '材料',
  '化学',
  '电化学',
  '制药',
  '研究员',
  '科学家',
  '实验',
  '客服',
  '市场',
  '产品',
  '项目',
  '工厂',
  'EHS',
  '环保',
  '半导体',
  '新能源',
  '新材料',
  '技术员',
  '主管',
  '设计',
  '销售主管',
  '化验',
  '专利代理',
]

function toNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function normalizeEducation(value) {
  if (!value) return '未知'

  if (value === '本科' || value === '统招本科') return '本科'
  if (value.includes('硕士')) return '硕士'
  if (value.includes('博士')) return '博士'
  if (value.includes('大专')) return '大专'
  if (value.includes('不限')) return '学历不限'

  return value
}

function normalizeExperience(value) {
  if (!value) {
    return {
      label: '未知',
      band: '未知',
      isNewGradFriendly: false,
    }
  }

  const label = value.trim()
  const isNewGradFriendly = NEW_GRAD_EXPERIENCE.includes(label)

  return {
    label,
    band: isNewGradFriendly ? '新人友好' : '进阶岗位',
    isNewGradFriendly,
  }
}

function normalizeCompanySizeGroup(value) {
  if (!value || value === '未知') return '未知'
  if (/^(1-49人|50-99人)$/u.test(value)) return '小厂 1-99'
  if (value === '100-499人') return '中厂 100-499'
  if (/^(500-999人|1000-9999人|2000-5000人|5000-10000人|10000人以上)$/u.test(value)) return '大厂 500+'
  if (value.includes('上市')) return '上市公司'
  if (value.includes('轮') || value.includes('融资')) return '融资阶段'
  if (value === '不需要融资') return '成熟企业'
  return '其他'
}

function normalizeIndustry(value) {
  if (!value || value === '未知') return '其他'
  return value.trim()
}

function isNegotiableJob(row) {
  const isNegotiable = Boolean(row?.is_negotiable ?? row?.negotiable)
  const min = toNumber(row?.salary_min)
  const max = toNumber(row?.salary_max)
  return isNegotiable || ((min == null || min === 0) && (max == null || max === 0))
}

function getSalaryMidpoint(row) {
  if (isNegotiableJob(row)) return null

  const min = toNumber(row?.salary_min)
  const max = toNumber(row?.salary_max)

  if (min == null && max == null) return null
  if (min == null) return max
  if (max == null) return min
  return (min + max) / 2
}

function sortEducation(items) {
  return [...items].sort((a, b) => EDUCATION_ORDER.indexOf(a) - EDUCATION_ORDER.indexOf(b))
}

function sortExperience(items) {
  return [...items].sort((a, b) => {
    const aIndex = EXPERIENCE_ORDER.indexOf(a)
    const bIndex = EXPERIENCE_ORDER.indexOf(b)
    const safeA = aIndex === -1 ? EXPERIENCE_ORDER.length : aIndex
    const safeB = bIndex === -1 ? EXPERIENCE_ORDER.length : bIndex
    return safeA - safeB
  })
}

function percentile(values, p) {
  if (!values.length) return null
  if (values.length === 1) return values[0]

  const sorted = [...values].sort((a, b) => a - b)
  const index = (sorted.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]

  const weight = index - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

function median(values) {
  return percentile(values, 0.5)
}

function summarizeSalary(values) {
  const cleanValues = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b)

  if (!cleanValues.length) {
    return {
      count: 0,
      min: null,
      q1: null,
      median: null,
      q3: null,
      max: null,
      mean: null,
    }
  }

  const mean = cleanValues.reduce((sum, value) => sum + value, 0) / cleanValues.length

  return {
    count: cleanValues.length,
    min: cleanValues[0],
    q1: percentile(cleanValues, 0.25),
    median: percentile(cleanValues, 0.5),
    q3: percentile(cleanValues, 0.75),
    max: cleanValues[cleanValues.length - 1],
    mean,
  }
}

function extractTitleKeywords(title) {
  if (!title) return []

  const source = String(title).replace(/[()（）【】\[\]-]/g, ' ')
  const foundKeywords = TITLE_KEYWORDS.filter((keyword) => source.includes(keyword))
  const tokens = source
    .split(/[\s/、,，·]+/u)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => item.length >= 2 && item.length <= 8)
    .filter((item) => !TITLE_STOP_WORDS.has(item))
    .filter((item) => !/^[A-Z0-9]+$/u.test(item))

  return [...new Set([...foundKeywords, ...tokens])]
}

function getTopLabel(entries, fallback = '暂无') {
  if (!entries.length) return fallback
  return entries[0].name
}

function getRepresentativeIndustry(items) {
  const counter = new Map()

  items.forEach((item) => {
    counter.set(item.industry, (counter.get(item.industry) || 0) + 1)
  })

  const sorted = [...counter.entries()].sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] || '其他'
}

function buildCityStats(items, minSample) {
  const groups = new Map()

  items.forEach((item) => {
    if (!item.city) return
    if (!groups.has(item.city)) {
      groups.set(item.city, [])
    }
    groups.get(item.city).push(item)
  })

  return [...groups.entries()]
    .map(([city, cityItems]) => {
      const salaryValues = cityItems.map((item) => item.salaryMidpoint).filter(Number.isFinite)
      const negotiableCount = cityItems.filter((item) => item.isNegotiable).length

      return {
        name: city,
        city,
        province: cityItems[0]?.province || '',
        sampleCount: cityItems.length,
        negotiableRatio: cityItems.length ? negotiableCount / cityItems.length : 0,
        salary: summarizeSalary(salaryValues),
        representativeIndustry: getRepresentativeIndustry(cityItems),
        cities: cityItems,
        isQualified: cityItems.length >= minSample && salaryValues.length > 0,
      }
    })
    .sort((a, b) => {
      if (b.isQualified !== a.isQualified) return Number(b.isQualified) - Number(a.isQualified)
      if ((b.salary.median || 0) !== (a.salary.median || 0)) return (b.salary.median || 0) - (a.salary.median || 0)
      return b.sampleCount - a.sampleCount
    })
}

function buildProvinceStats(cityStats) {
  const groups = new Map()

  cityStats.forEach((cityStat) => {
    if (!cityStat.province) return
    if (!groups.has(cityStat.province)) {
      groups.set(cityStat.province, [])
    }
    groups.get(cityStat.province).push(cityStat)
  })

  return [...groups.entries()]
    .map(([province, cities]) => {
      const salaryValues = cities.flatMap((city) => city.cities.map((item) => item.salaryMidpoint).filter(Number.isFinite))
      const allItems = cities.flatMap((city) => city.cities)
      const negotiableCount = allItems.filter((item) => item.isNegotiable).length

      return {
        name: province,
        province,
        sampleCount: allItems.length,
        salary: summarizeSalary(salaryValues),
        negotiableRatio: allItems.length ? negotiableCount / allItems.length : 0,
        representativeIndustry: getRepresentativeIndustry(allItems),
        topCities: cities.slice().sort((a, b) => b.sampleCount - a.sampleCount).slice(0, 5),
      }
    })
    .sort((a, b) => (b.salary.median || 0) - (a.salary.median || 0))
}

export function useJobsAnalytics() {
  const loading = ref(false)
  const error = ref('')
  const jobs = ref([])
  const loadProgress = ref({
    loaded: 0,
    total: 0,
  })

  const filters = reactive({
    focusEducation: '本科',
    experiencePreset: '新人友好',
    city: '全部',
    industry: '全部',
    companySize: '全部',
    minCitySample: 5,
  })

  async function fetchJobs() {
    loading.value = true
    error.value = ''
    loadProgress.value = {
      loaded: 0,
      total: 0,
    }

    try {
      const { data: records } = await fetchAllRows(
        TABLE_NAME,
        'job_title, company_name, salary_min, salary_max, is_negotiable, city, district, experience_req, edu_req, company_size, industry_category, job_link',
        {
          pageSize: PAGE_SIZE,
          onProgress: ({ loaded, total }) => {
            loadProgress.value = {
              loaded,
              total: total ?? loaded,
            }
          },
        }
      )

      jobs.value = records.map((row, index) => {
        const city = normalizeCityName(row.city)
        const experience = normalizeExperience(row.experience_req)

        return {
          id: `${row.job_title || 'job'}-${row.company_name || 'company'}-${index}`,
          ...row,
          city,
          district: row.district || '',
          province: getProvinceByCity(city),
          education: normalizeEducation(row.edu_req),
          experienceLabel: experience.label,
          experienceBand: experience.band,
          isNewGradFriendly: experience.isNewGradFriendly,
          companySizeLabel: row.company_size || '未知',
          companySizeGroup: normalizeCompanySizeGroup(row.company_size),
          industry: normalizeIndustry(row.industry_category),
          isNegotiable: isNegotiableJob(row),
          salaryMidpoint: getSalaryMidpoint(row),
          titleTokens: extractTitleKeywords(row.job_title),
        }
      })
    } catch (fetchError) {
      jobs.value = []
      error.value = fetchError.message || '岗位数据加载失败'
    } finally {
      loading.value = false
    }
  }

  const cityOptions = computed(() => ['全部', ...new Set(jobs.value.map((item) => item.city).filter(Boolean))])
  const industryOptions = computed(() => ['全部', ...new Set(jobs.value.map((item) => item.industry).filter(Boolean))])
  const sizeOptions = computed(() => ['全部', ...new Set(jobs.value.map((item) => item.companySizeLabel).filter(Boolean))])

  const scopedJobs = computed(() => {
    return jobs.value.filter((item) => {
      if (filters.city !== '全部' && item.city !== filters.city) return false
      if (filters.industry !== '全部' && item.industry !== filters.industry) return false
      if (filters.companySize !== '全部' && item.companySizeLabel !== filters.companySize) return false
      return true
    })
  })

  const focusEducationJobs = computed(() => scopedJobs.value.filter((item) => item.education === filters.focusEducation))

  const focusEducationWithExperience = computed(() => {
    if (filters.experiencePreset === '全部经验') return focusEducationJobs.value
    if (filters.experiencePreset === '进阶岗位') return focusEducationJobs.value.filter((item) => !item.isNewGradFriendly)
    return focusEducationJobs.value.filter((item) => item.isNewGradFriendly)
  })

  const salaryComparisonStats = computed(() => {
    const results = EDUCATION_ORDER.map((education) => {
      const items = scopedJobs.value.filter((item) => item.education === education)
      const withExperience = filters.experiencePreset === '全部经验'
        ? items
        : filters.experiencePreset === '进阶岗位'
          ? items.filter((item) => !item.isNewGradFriendly)
          : items.filter((item) => item.isNewGradFriendly)
      const salaryItems = withExperience.filter((item) => Number.isFinite(item.salaryMidpoint))
      const summary = summarizeSalary(salaryItems.map((item) => item.salaryMidpoint))
      const negotiableCount = withExperience.filter((item) => item.isNegotiable).length

      return {
        name: education,
        sampleCount: withExperience.length,
        negotiableRatio: withExperience.length ? negotiableCount / withExperience.length : 0,
        ...summary,
      }
    }).filter((item) => item.sampleCount > 0)

    return sortEducation(results.map((item) => item.name)).map((name) => results.find((item) => item.name === name))
  })

  const focusSalaryStats = computed(() => {
    const salaryItems = focusEducationWithExperience.value.filter((item) => Number.isFinite(item.salaryMidpoint))
    const negotiableCount = focusEducationWithExperience.value.filter((item) => item.isNegotiable).length
    return {
      ...summarizeSalary(salaryItems.map((item) => item.salaryMidpoint)),
      totalCount: focusEducationWithExperience.value.length,
      negotiableCount,
      negotiableRatio: focusEducationWithExperience.value.length ? negotiableCount / focusEducationWithExperience.value.length : 0,
    }
  })

  const focusJobsAcrossExperience = computed(() => focusEducationJobs.value)

  const wordCloudStats = computed(() => {
    const counter = new Map()

    focusJobsAcrossExperience.value.forEach((item) => {
      item.titleTokens.forEach((token) => {
        counter.set(token, (counter.get(token) || 0) + 1)
      })
    })

    return [...counter.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 28)
  })

  const experienceDistribution = computed(() => {
    const counter = new Map()
    focusJobsAcrossExperience.value.forEach((item) => {
      counter.set(item.experienceLabel, (counter.get(item.experienceLabel) || 0) + 1)
    })

    return sortExperience([...counter.keys()]).map((label) => ({
      label,
      value: counter.get(label) || 0,
    }))
  })

  const newGradTopJobs = computed(() => {
    const counter = new Map()
    focusEducationWithExperience.value.forEach((item) => {
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
        medianSalary: median(entry.salaries.filter(Number.isFinite)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  })

  const cityStats = computed(() => buildCityStats(focusEducationWithExperience.value, filters.minCitySample))
  const provinceStats = computed(() => buildProvinceStats(cityStats.value))

  const industryStats = computed(() => {
    const groups = new Map()

    focusEducationWithExperience.value.forEach((item) => {
      if (!groups.has(item.industry)) {
        groups.set(item.industry, [])
      }
      groups.get(item.industry).push(item)
    })

    return [...groups.entries()]
      .map(([industry, items]) => {
        const salaryValues = items.map((item) => item.salaryMidpoint).filter(Number.isFinite)
        const negotiableCount = items.filter((item) => item.isNegotiable).length

        return {
          name: industry,
          count: items.length,
          salary: summarizeSalary(salaryValues),
          negotiableRatio: items.length ? negotiableCount / items.length : 0,
        }
      })
      .sort((a, b) => b.count - a.count)
  })

  const industryInsights = computed(() => {
    const allFocusByIndustry = new Map()

    focusEducationJobs.value.forEach((item) => {
      if (!allFocusByIndustry.has(item.industry)) {
        allFocusByIndustry.set(item.industry, [])
      }
      allFocusByIndustry.get(item.industry).push(item)
    })

    const topHiringIndustry = getTopLabel(industryStats.value)

    const bestEntryIndustry = [...allFocusByIndustry.entries()]
      .map(([industry, items]) => ({
        name: industry,
        ratio: items.length ? items.filter((item) => item.isNewGradFriendly).length / items.length : 0,
        count: items.length,
      }))
      .filter((item) => item.count >= 5)
      .sort((a, b) => b.ratio - a.ratio || b.count - a.count)[0]?.name || '暂无'

    const highestMedianIndustry = industryStats.value
      .filter((item) => item.salary.count >= 5)
      .sort((a, b) => (b.salary.median || 0) - (a.salary.median || 0))[0]?.name || '暂无'

    const biggestCompanyIndustry = [...allFocusByIndustry.entries()]
      .map(([industry, items]) => {
        const knownSize = items.filter((item) => item.companySizeGroup !== '未知')
        const bigCount = knownSize.filter((item) => item.companySizeGroup === '大厂 500+' || item.companySizeGroup === '上市公司').length
        return {
          name: industry,
          count: items.length,
          ratio: knownSize.length ? bigCount / knownSize.length : 0,
        }
      })
      .filter((item) => item.count >= 5)
      .sort((a, b) => b.ratio - a.ratio || b.count - a.count)[0]?.name || '暂无'

    return {
      topHiringIndustry,
      bestEntryIndustry,
      highestMedianIndustry,
      biggestCompanyIndustry,
    }
  })

  const headlineKpis = computed(() => {
    const hottestCity = cityStats.value.slice().sort((a, b) => b.sampleCount - a.sampleCount)[0]
    return [
      {
        label: `${filters.focusEducation}新人中位薪资`,
        value: focusSalaryStats.value.median,
        type: 'salary',
      },
      {
        label: '样本量',
        value: focusSalaryStats.value.totalCount,
        type: 'count',
      },
      {
        label: '面议占比',
        value: focusSalaryStats.value.negotiableRatio,
        type: 'ratio',
      },
      {
        label: '最热城市',
        value: hottestCity?.city || '暂无',
        subValue: hottestCity?.sampleCount || 0,
        type: 'city',
      },
    ]
  })

  return {
    loading,
    error,
    loadProgress,
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
  }
}
