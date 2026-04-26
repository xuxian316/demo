<template>
  <section class="map-board">
    <el-card class="map-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <h2>全国制药公司分布</h2>
            <p>按省份聚合着色，悬浮查看城市明细，点击省份查看公司列表。</p>
          </div>
          <el-tag type="success" effect="plain">
            共 {{ totalCompanies }} 家企业
          </el-tag>
        </div>
      </template>

      <div v-if="loading" class="state-panel">正在加载地图数据...</div>
      <div v-else-if="errorMessage" class="state-panel is-error">{{ errorMessage }}</div>
      <div v-else-if="!provinceMapData.length" class="state-panel">暂无公司分布数据</div>
      <div v-else ref="chartRef" class="map-chart"></div>
    </el-card>

    <el-drawer
      v-model="isProvinceDrawerVisible"
      :title="drawerTitle"
      size="420px"
      class="province-drawer"
    >
      <div class="drawer-meta" v-if="selectedProvince">
        <span>{{ selectedProvince }}</span>
        <span>{{ selectedProvinceCompanies.length }} 家企业</span>
      </div>

      <div v-if="!selectedProvinceCompanies.length" class="drawer-empty">
        该省暂无企业明细数据
      </div>

      <div v-else class="company-list">
        <article
          v-for="company in selectedProvinceCompanies"
          :key="company.id ?? `${company.company_name}-${company.location}`"
          class="company-item"
        >
          <div class="company-logo">
            <img
              v-if="company.logoUrl"
              :src="company.logoUrl"
              :alt="company.company_name"
              @error="handleLogoError(company)"
            />
            <div v-else class="company-logo-fallback">
              {{ getCompanyInitial(company.company_name) }}
            </div>
          </div>

          <div class="company-copy">
            <h3>{{ company.company_name || '未命名企业' }}</h3>
            <p>{{ company.location || '未知地区' }}</p>
          </div>
        </article>
      </div>
    </el-drawer>
  </section>
</template>

<script setup>
import * as echarts from 'echarts'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { supabase } from '../lib/supabase'

const TABLE_NAME = 'companies'
const MAP_NAME = 'china'
const MUNICIPALITIES = new Set(['北京', '上海', '天津', '重庆', '香港', '澳门'])

const chartRef = ref(null)
const chartInstance = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const rawCompanies = ref([])
const provinceDetailMap = ref({})
const selectedProvince = ref('')
const selectedProvinceCompanies = ref([])
const isProvinceDrawerVisible = ref(false)

let resizeObserver = null
let isMapRegistered = false
let clickHandlerBound = false

const PROVINCE_CITY_GROUPS = {
  '北京市': ['北京'],
  '天津市': ['天津'],
  '上海市': ['上海'],
  '重庆市': ['重庆'],
  '河北省': ['石家庄', '唐山', '秦皇岛', '邯郸', '邢台', '保定', '张家口', '承德', '沧州', '廊坊', '衡水'],
  '山西省': ['太原', '大同', '阳泉', '长治', '晋城', '朔州', '晋中', '运城', '忻州', '临汾', '吕梁'],
  '辽宁省': ['沈阳', '大连', '鞍山', '抚顺', '本溪', '丹东', '锦州', '营口', '阜新', '辽阳', '盘锦', '铁岭', '朝阳', '葫芦岛'],
  '吉林省': ['长春', '吉林', '四平', '辽源', '通化', '白山', '松原', '白城', '延边'],
  '黑龙江省': ['哈尔滨', '齐齐哈尔', '鸡西', '鹤岗', '双鸭山', '大庆', '伊春', '佳木斯', '七台河', '牡丹江', '黑河', '绥化', '大兴安岭'],
  '江苏省': ['南京', '无锡', '徐州', '常州', '苏州', '南通', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州', '宿迁'],
  '浙江省': ['杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水'],
  '安徽省': ['合肥', '芜湖', '蚌埠', '淮南', '马鞍山', '淮北', '铜陵', '安庆', '黄山', '滁州', '阜阳', '宿州', '六安', '亳州', '池州', '宣城'],
  '福建省': ['福州', '厦门', '莆田', '三明', '泉州', '漳州', '南平', '龙岩', '宁德'],
  '江西省': ['南昌', '景德镇', '萍乡', '九江', '新余', '鹰潭', '赣州', '吉安', '宜春', '抚州', '上饶'],
  '山东省': ['济南', '青岛', '淄博', '枣庄', '东营', '烟台', '潍坊', '济宁', '泰安', '威海', '日照', '临沂', '德州', '聊城', '滨州', '菏泽'],
  '河南省': ['郑州', '开封', '洛阳', '平顶山', '安阳', '鹤壁', '新乡', '焦作', '濮阳', '许昌', '漯河', '三门峡', '南阳', '商丘', '信阳', '周口', '驻马店', '济源'],
  '湖北省': ['武汉', '黄石', '十堰', '宜昌', '襄阳', '鄂州', '荆门', '孝感', '荆州', '黄冈', '咸宁', '随州', '恩施', '仙桃', '潜江', '天门', '神农架'],
  '湖南省': ['长沙', '株洲', '湘潭', '衡阳', '邵阳', '岳阳', '常德', '张家界', '益阳', '郴州', '永州', '怀化', '娄底', '湘西'],
  '广东省': ['广州', '深圳', '珠海', '汕头', '佛山', '韶关', '湛江', '肇庆', '江门', '茂名', '惠州', '梅州', '汕尾', '河源', '阳江', '清远', '东莞', '中山', '潮州', '揭阳', '云浮'],
  '海南省': ['海口', '三亚', '三沙', '儋州'],
  '四川省': ['成都', '自贡', '攀枝花', '泸州', '德阳', '绵阳', '广元', '遂宁', '内江', '乐山', '南充', '眉山', '宜宾', '广安', '达州', '雅安', '巴中', '资阳', '阿坝', '甘孜', '凉山'],
  '贵州省': ['贵阳', '六盘水', '遵义', '安顺', '毕节', '铜仁', '黔西南', '黔东南', '黔南'],
  '云南省': ['昆明', '曲靖', '玉溪', '保山', '昭通', '丽江', '普洱', '临沧', '楚雄', '红河', '文山', '西双版纳', '大理', '德宏', '怒江', '迪庆'],
  '陕西省': ['西安', '铜川', '宝鸡', '咸阳', '渭南', '延安', '汉中', '榆林', '安康', '商洛'],
  '甘肃省': ['兰州', '嘉峪关', '金昌', '白银', '天水', '武威', '张掖', '平凉', '酒泉', '庆阳', '定西', '陇南', '临夏', '甘南'],
  '青海省': ['西宁', '海东', '海北', '黄南', '海南', '果洛', '玉树', '海西'],
  '内蒙古自治区': ['呼和浩特', '包头', '乌海', '赤峰', '通辽', '鄂尔多斯', '呼伦贝尔', '巴彦淖尔', '乌兰察布', '兴安盟', '锡林郭勒盟', '阿拉善盟'],
  '广西壮族自治区': ['南宁', '柳州', '桂林', '梧州', '北海', '防城港', '钦州', '贵港', '玉林', '百色', '贺州', '河池', '来宾', '崇左'],
  '西藏自治区': ['拉萨', '日喀则', '昌都', '林芝', '山南', '那曲', '阿里'],
  '宁夏回族自治区': ['银川', '石嘴山', '吴忠', '固原', '中卫'],
  '新疆维吾尔自治区': ['乌鲁木齐', '克拉玛依', '吐鲁番', '哈密', '昌吉', '博尔塔拉', '巴音郭楞', '阿克苏', '克孜勒苏', '喀什', '和田', '伊犁', '塔城', '阿勒泰', '石河子', '阿拉尔', '图木舒克', '五家渠', '北屯', '铁门关', '双河', '可克达拉', '昆玉', '胡杨河', '新星'],
  '香港特别行政区': ['香港'],
  '澳门特别行政区': ['澳门'],
  '台湾省': ['台北', '新北', '桃园', '台中', '台南', '高雄', '基隆', '新竹', '嘉义']
}

const CITY_TO_PROVINCE_MAP = Object.entries(PROVINCE_CITY_GROUPS).reduce((acc, [province, cities]) => {
  cities.forEach((city) => {
    acc[city] = province
  })
  return acc
}, {})

const totalCompanies = computed(() => rawCompanies.value.length)

const provinceMapData = computed(() => {
  return Object.entries(provinceDetailMap.value).map(([provinceName, detail]) => ({
    name: provinceName,
    value: detail.total
  }))
})

const visualMapMax = computed(() => {
  const values = provinceMapData.value.map((item) => item.value)
  return values.length ? Math.max(...values) : 0
})

const drawerTitle = computed(() => {
  return selectedProvince.value ? `${selectedProvince}药企列表` : '药企列表'
})

function normalizeCityName(location) {
  if (typeof location !== 'string') return ''

  return location
    .split('-')[0]
    .trim()
    .replace(/市$/u, '')
}

function formatCityLabel(cityName) {
  if (MUNICIPALITIES.has(cityName)) {
    return cityName
  }

  return cityName.endsWith('市') ? cityName : `${cityName}市`
}

function getCompanyLogoUrl(company) {
  return (
    company?.logo_url ||
    company?.logoUrl ||
    company?.logo ||
    company?.company_logo ||
    company?.companyLogo ||
    ''
  )
}

function mapCompanyRecord(row) {
  return {
    ...row,
    company_name: row?.company_name || row?.name || '未命名企业',
    logoUrl: getCompanyLogoUrl(row)
  }
}

function buildProvinceAggregation(rows) {
  const cityCounter = new Map()
  const details = {}

  rows.forEach((row) => {
    const cityName = normalizeCityName(row?.location)
    if (!cityName) return

    cityCounter.set(cityName, (cityCounter.get(cityName) ?? 0) + 1)

    const provinceName = CITY_TO_PROVINCE_MAP[cityName]
    if (!provinceName) {
      console.warn(`[ChinaPharmaProvinceMap] Unmapped city: ${cityName}`)
      return
    }

    if (!details[provinceName]) {
      details[provinceName] = {
        total: 0,
        cities: [],
        companies: []
      }
    }

    details[provinceName].companies.push(mapCompanyRecord(row))
  })

  cityCounter.forEach((count, cityName) => {
    const provinceName = CITY_TO_PROVINCE_MAP[cityName]
    if (!provinceName) return

    details[provinceName].total += count
    details[provinceName].cities.push({
      name: cityName,
      value: count
    })
  })

  Object.values(details).forEach((detail) => {
    detail.cities.sort((a, b) => b.value - a.value)
    detail.companies.sort((a, b) => {
      return (a.company_name || '').localeCompare(b.company_name || '', 'zh-CN')
    })
  })

  return details
}

async function ensureChinaMapRegistered() {
  if (isMapRegistered) return

  // 这里使用本地静态 GeoJSON，而不是依赖远程地图服务。
  // registerMap 必须先于 setOption，否则 ECharts 无法识别 map: 'china'。
  const response = await fetch('/china.json')

  if (!response.ok) {
    throw new Error('中国地图 GeoJSON 加载失败，请检查 public/china.json 是否存在。')
  }

  const geoJson = await response.json()
  echarts.registerMap(MAP_NAME, geoJson)
  isMapRegistered = true
}

function getTooltipContent(params) {
  const provinceName = params.name
  const detail = provinceDetailMap.value[provinceName]

  if (!detail || !detail.total) {
    return `${provinceName}<br/>该省暂无药企数据`
  }

  const cityLines = detail.cities
    .map((city) => `${formatCityLabel(city.name)}：${city.value} 家`)
    .join('<br/>')

  return `${provinceName}：总计 ${detail.total} 家<br/>${cityLines}`
}

function buildChartOption() {
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 18, 28, 0.94)',
      borderColor: 'rgba(99, 242, 160, 0.28)',
      borderWidth: 1,
      textStyle: {
        color: '#f4fff8',
        fontSize: 13,
        lineHeight: 20
      },
      formatter: (params) => getTooltipContent(params)
    },
    visualMap: {
      min: 0,
      max: Math.max(visualMapMax.value, 1),
      text: ['高', '低'],
      realtime: false,
      calculable: true,
      inRange: {
        color: ['#e8fff1', '#8de0ac', '#2ea86d', '#176544']
      },
      textStyle: {
        color: '#d9f8e7'
      },
      left: 24,
      bottom: 24
    },
    series: [
      {
        name: '制药公司数量',
        type: 'map',
        map: MAP_NAME,
        roam: true,
        zoom: 1.15,
        label: {
          show: false,
          color: '#f4fff8'
        },
        emphasis: {
          label: {
            show: true,
            color: '#ffffff'
          },
          itemStyle: {
            areaColor: '#63f2a0',
            borderColor: '#dffff0'
          }
        },
        itemStyle: {
          borderColor: 'rgba(255, 255, 255, 0.32)',
          borderWidth: 1,
          areaColor: '#193526'
        },
        data: provinceMapData.value
      }
    ]
  }
}

function openProvinceDrawer(provinceName) {
  const detail = provinceDetailMap.value[provinceName]
  selectedProvince.value = provinceName
  selectedProvinceCompanies.value = detail?.companies ?? []
  isProvinceDrawerVisible.value = true
}

function bindChartEvents() {
  if (!chartInstance.value || clickHandlerBound) return

  chartInstance.value.on('click', (params) => {
    if (!params?.name) return
    openProvinceDrawer(params.name)
  })

  clickHandlerBound = true
}

function renderChart() {
  if (!chartRef.value || !provinceMapData.value.length) return

  if (!chartInstance.value) {
    chartInstance.value = echarts.init(chartRef.value)
  }

  chartInstance.value.setOption(buildChartOption(), true)
  bindChartEvents()
  chartInstance.value.resize()
}

function handleResize() {
  chartInstance.value?.resize()
}

function getCompanyInitial(name) {
  if (!name) return '药'
  return String(name).trim().slice(0, 1) || '药'
}

function handleLogoError(company) {
  company.logoUrl = ''
}

async function fetchCompanies() {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')

    if (error) throw error

    rawCompanies.value = Array.isArray(data) ? data : []
    provinceDetailMap.value = buildProvinceAggregation(rawCompanies.value)
  } catch (error) {
    rawCompanies.value = []
    provinceDetailMap.value = {}
    errorMessage.value = error.message || '地图数据加载失败，请检查 Supabase 配置。'
    console.error('Failed to fetch companies:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    await ensureChinaMapRegistered()
    await fetchCompanies()
    renderChart()
  } catch (error) {
    errorMessage.value = error.message || '地图初始化失败。'
    console.error('Failed to initialize map:', error)
  }

  window.addEventListener('resize', handleResize)

  if (typeof ResizeObserver !== 'undefined' && chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(chartRef.value)
  }
})

watch(
  () => provinceMapData.value,
  () => {
    if (!loading.value && !errorMessage.value) {
      renderChart()
    }
  },
  { deep: true }
)

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  resizeObserver?.disconnect()
  resizeObserver = null
  chartInstance.value?.dispose()
  chartInstance.value = null
  clickHandlerBound = false
})
</script>

<style scoped>
.map-board {
  width: 100%;
  padding: 24px;
  color: #e5edf7;
  background:
    radial-gradient(circle at top right, rgba(74, 222, 128, 0.08), transparent 24%),
    radial-gradient(circle at top left, rgba(56, 178, 172, 0.08), transparent 20%);
}

.map-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(26, 30, 45, 0.94) 0%, rgba(15, 18, 29, 0.98) 100%);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(10px);
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

.map-chart,
.state-panel {
  width: 100%;
  height: 600px;
  border-radius: 16px;
}

.state-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(99, 242, 160, 0.24);
  background: rgba(255, 255, 255, 0.02);
  color: #cfe5d8;
  font-size: 16px;
}

.state-panel.is-error {
  color: #ffd5d5;
  border-color: rgba(255, 120, 120, 0.28);
}

.drawer-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  color: #8f9bb3;
  font-size: 13px;
}

.drawer-empty {
  padding: 18px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  color: #8f9bb3;
}

.company-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.company-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
}

.company-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.16), rgba(56, 178, 172, 0.12));
  flex-shrink: 0;
}

.company-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.company-logo-fallback {
  color: #e9fff2;
  font-size: 18px;
  font-weight: 700;
}

.company-copy {
  min-width: 0;
}

.company-copy h3 {
  margin: 0 0 6px;
  color: #f8fafc;
  font-size: 15px;
  line-height: 1.4;
}

.company-copy p {
  margin: 0;
  color: #8f9bb3;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

:deep(.el-card__header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 20px 24px;
}

:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-tag.el-tag--success) {
  color: #d7ffe6;
  background: rgba(74, 222, 128, 0.12);
  border-color: rgba(74, 222, 128, 0.18);
}

:deep(.province-drawer) {
  background: #101521;
}

:deep(.province-drawer .el-drawer) {
  background: linear-gradient(180deg, rgba(26, 30, 45, 0.98) 0%, rgba(15, 18, 29, 1) 100%);
}

:deep(.province-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 20px 20px 8px;
  color: #f8fafc;
}

:deep(.province-drawer .el-drawer__body) {
  padding: 16px 20px 20px;
}

@media (max-width: 768px) {
  .map-board {
    padding: 16px;
  }

  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .map-chart,
  .state-panel {
    height: 600px;
  }
}
</style>
