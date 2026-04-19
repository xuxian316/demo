<template>
  <div class="tree-wrapper">
    <div ref="chartRef" class="tree-chart"></div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts';
import treeData from './treedata.json'
import { onMounted, onUnmounted, ref } from 'vue';
const emit = defineEmits(['node-click'])
const chartRef = ref(null)
let myChart = null
let resizeObserver = null
const handleResize = () => {
  myChart?.resize()
}

onMounted(() => {
  const chartDom = chartRef.value

  if (!chartDom) return

  myChart = echarts.init(chartDom);
  
  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: 'rgba(11, 18, 26, 0.96)',
      borderColor: 'rgba(157, 247, 192, 0.22)',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: {
        color: '#eefcf4',
        fontSize: 13,
        lineHeight: 20
      },
      extraCssText: 'border-radius: 12px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.26);',
      formatter: (params) => {
        return params.data.desc || params.name;},
    },
    series: [
      {
        type: 'tree',
        // 引用你 import 进来的 treeData
        data: [treeData],

        // 布局设置
        top: '5%',
        left: '40%',
        bottom: '5%',
        right: '50%',

        symbol: 'circle',
        symbolSize: 14, // 圆点大小
        edgeShape: 'polyline', // 连线样式：折线（可选 'curve' 曲线）
        orient: 'LR', // 方向：从左到右 (Left to Right)
        lineStyle: {
          color: 'rgba(157, 247, 192, 0.28)',
          width: 2.2,
          curveness: 0.08
        },
        itemStyle: {
          color: '#13261d',
          borderColor: '#7ce5a7',
          borderWidth: 3,
          shadowBlur: 16,
          shadowColor: 'rgba(74, 222, 128, 0.24)'
        },

        // 默认状态下的文字样式
        label: {
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
          distance: 14,
          color: '#eefcf4',
          backgroundColor: 'rgba(15, 39, 27, 0.9)',
          borderColor: 'rgba(157, 247, 192, 0.14)',
          borderWidth: 1,
          borderRadius: 999,
          padding: [7, 12],
          fontSize: 15,
          fontWeight: 'bold',
          shadowBlur: 18,
          shadowColor: 'rgba(0, 0, 0, 0.14)'
        },
        leaves: {
          itemStyle: {
            color: '#0f1f19',
            borderColor: '#38b2ac',
            borderWidth: 2
          },
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left',
            color: '#dff8ea',
            backgroundColor: 'rgba(12, 53, 45, 0.94)',
            borderColor: 'rgba(56, 178, 172, 0.18)',
            borderWidth: 1,
            borderRadius: 999,
            padding: [6, 11],
            fontSize: 14,
            fontWeight: 600
          }
        },
        emphasis: {
          focus: 'descendant',
          itemStyle: {
            borderColor: '#9df7c0',
            shadowBlur: 20,
            shadowColor: 'rgba(74, 222, 128, 0.34)'
          },
          lineStyle: {
            color: 'rgba(157, 247, 192, 0.54)',
            width: 3
          },
          label: {
            color: '#ffffff'
          }
        },

        // 初始展开层级（2 表示展开到第二层）
        initialTreeDepth: 2,

        // 交互：点击展开/收起
        expandAndCollapse: true,
        animationDuration: 550,
        animationDurationUpdate: 750
      }
    ]
  }
  
  option && myChart.setOption(option);  
  myChart.on('click', (params) => {
    console.log("点击了节点，节点信息为:", params.data);
    emit("node-click",params.data)
  })
  window.addEventListener('resize', handleResize)

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(chartDom)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  resizeObserver?.disconnect()
  resizeObserver = null
  myChart?.dispose()
  myChart = null
})

</script>


<style scoped>
.tree-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 1px;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(74, 222, 128, 0.1), transparent 34%),
    radial-gradient(circle at right bottom, rgba(56, 178, 172, 0.08), transparent 32%),
    linear-gradient(180deg, rgba(18, 34, 28, 0.96) 0%, rgba(9, 20, 16, 0.98) 100%);
  
  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}



.tree-chart {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(74, 222, 128, 0.08), transparent 28%),
    linear-gradient(180deg, rgba(17, 40, 31, 0.9) 0%, rgba(8, 21, 17, 0.92) 100%);
  backdrop-filter: blur(8px);
}
</style>
