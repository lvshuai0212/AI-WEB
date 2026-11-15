<template>
  <div class="charts-page">
    <el-row :gutter="20" class="chart-row">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="chart-header">
              <span>每日健康打卡人数</span>
              <el-button type="primary" link @click="loadData"><el-icon><Refresh /></el-icon></el-button>
            </div>
          </template>
          <div ref="barChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header><span>近7日血压 / 血糖趋势</span></template>
          <div ref="lineChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header><span>慢病人群分布</span></template>
          <div ref="pieChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span>居民健康积分分布</span></template>
          <div ref="pointsChartRef" class="chart-box-lg"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span>社区健康管理对比</span></template>
          <div ref="classChartRef" class="chart-box-lg"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px" class="chart-row">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header><span>健康数据概览</span></template>
          <el-row :gutter="20" class="overview-row">
            <el-col :span="6" v-for="(item, i) in overview" :key="i">
              <div class="overview-item">
                <p class="overview-label">{{ item.label }}</p>
                <h3 class="overview-value">{{ item.value }}</h3>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getUsers, getKnowledge, getCheckins } from '../utils/api'

const barChartRef = ref(null)
const lineChartRef = ref(null)
const pieChartRef = ref(null)
const pointsChartRef = ref(null)
const classChartRef = ref(null)
const overview = ref([])

const PRIMARY = '#12A8A0'
const SECONDARY = '#2D9CDB'

let charts = []

function initChart(el, option) {
  const chart = echarts.init(el)
  chart.setOption(option)
  charts.push(chart)
  return chart
}

function avg(list) {
  if (!list.length) return 0
  return Math.round(list.reduce((s, v) => s + v, 0) / list.length * 10) / 10
}

async function loadData() {
  charts.forEach(c => c.dispose())
  charts = []

  const [users, knowledge, checkins] = await Promise.all([
    getUsers(), getKnowledge(), getCheckins()
  ])

  // 每日健康打卡人数（柱状图）
  const dateMap = {}
  checkins.forEach(c => {
    dateMap[c.checkDate] = (dateMap[c.checkDate] || 0) + 1
  })
  const dates = Object.keys(dateMap).sort()
  initChart(barChartRef.value, {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: dates.map(d => d.slice(5)) },
    yAxis: { type: 'value', name: '人数' },
    series: [{
      type: 'bar', data: dates.map(d => dateMap[d]),
      itemStyle: { color: PRIMARY, borderRadius: [4, 4, 0, 0] },
      animationDuration: 1000
    }]
  })

  // 近7日血压/血糖趋势（双轴折线图）
  const last7 = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
    last7.push(d)
  }
  const sysData = last7.map(d => avg(checkins.filter(c => c.checkDate === d && c.systolic).map(c => c.systolic)))
  const sugarData = last7.map(d => avg(checkins.filter(c => c.checkDate === d && c.bloodSugar).map(c => c.bloodSugar)))
  initChart(lineChartRef.value, {
    tooltip: { trigger: 'axis' },
    legend: { data: ['平均收缩压', '平均血糖'], top: 0, itemWidth: 14, itemHeight: 8 },
    grid: { left: 40, right: 44, top: 40, bottom: 28 },
    xAxis: { type: 'category', data: last7.map(d => d.slice(5)) },
    yAxis: [
      { type: 'value', name: 'mmHg', min: 90, max: 160 },
      { type: 'value', name: 'mmol/L', min: 4, max: 9 }
    ],
    series: [
      {
        name: '平均收缩压', type: 'line', data: sysData, smooth: true,
        areaStyle: { color: 'rgba(18,168,160,0.12)' },
        lineStyle: { color: PRIMARY, width: 3 },
        itemStyle: { color: PRIMARY },
        animationDuration: 1200
      },
      {
        name: '平均血糖', type: 'line', yAxisIndex: 1, data: sugarData, smooth: true,
        lineStyle: { color: SECONDARY, width: 3 },
        itemStyle: { color: SECONDARY },
        animationDuration: 1200
      }
    ]
  })

  // 慢病人群分布（饼图）
  const tagMap = {}
  users.forEach(u => {
    String(u.chronicTags || '无').split(/[、,，]/).forEach(t => {
      const tag = t.trim()
      if (tag) tagMap[tag] = (tagMap[tag] || 0) + 1
    })
  })
  initChart(pieChartRef.value, {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    series: [{
      type: 'pie', radius: ['42%', '64%'], center: ['50%', '44%'],
      data: Object.entries(tagMap).map(([name, value]) => ({ name, value })),
      label: { show: false },
      legendHoverLink: true,
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
      animationType: 'scale', animationDuration: 1000
    }],
    legend: { bottom: 0, left: 'center', type: 'scroll', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } }
  })

  // 居民健康积分分布
  initChart(pointsChartRef.value, {
    tooltip: { trigger: 'axis' },
    grid: { left: 46, right: 20, top: 40, bottom: 80 },
    xAxis: { type: 'category', data: users.map(u => u.nickname), axisLabel: { interval: 0, rotate: 35, fontSize: 10 } },
    yAxis: { type: 'value', name: '健康积分' },
    series: [{
      type: 'bar', data: users.map(u => u.totalPoints),
      itemStyle: {
        color: (params) => [PRIMARY, SECONDARY, '#56CCF2', '#27AE60'][params.dataIndex % 4],
        borderRadius: [4, 4, 0, 0]
      }
    }]
  })

  // 社区健康管理对比
  const classMap = {}
  users.forEach(u => {
    if (!classMap[u.className]) classMap[u.className] = { total: 0, count: 0 }
    classMap[u.className].total += u.totalPoints
    classMap[u.className].count++
  })
  const classNames = Object.keys(classMap)
  initChart(classChartRef.value, {
    tooltip: { trigger: 'axis' },
    legend: { data: ['平均健康积分', '在管人数'] },
    xAxis: { type: 'category', data: classNames },
    yAxis: [{ type: 'value', name: '积分' }, { type: 'value', name: '人数' }],
    series: [
      {
        name: '平均健康积分', type: 'bar',
        data: classNames.map(c => Math.round(classMap[c].total / classMap[c].count)),
        itemStyle: { color: PRIMARY, borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '在管人数', type: 'line', yAxisIndex: 1,
        data: classNames.map(c => classMap[c].count),
        lineStyle: { color: '#F2994A' }, itemStyle: { color: '#F2994A' }
      }
    ]
  })

  const today = new Date().toISOString().split('T')[0]
  const todayCheckins = checkins.filter(c => c.checkDate === today)
  const checkinRate = users.length ? Math.round(todayCheckins.length / users.length * 100) : 0
  const avgPoints = users.length ? Math.round(users.reduce((s, u) => s + u.totalPoints, 0) / users.length) : 0
  const chronicCount = users.filter(u => u.chronicTags && u.chronicTags !== '无').length

  overview.value = [
    { label: '在管居民', value: users.length },
    { label: '今日打卡率', value: checkinRate + '%' },
    { label: '健康积分均值', value: avgPoints },
    { label: '慢病管理率', value: users.length ? Math.round(chronicCount / users.length * 100) + '%' : '0%' }
  ]
}

function handleResize() {
  charts.forEach(c => c.resize())
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(c => c.dispose())
})
</script>

<style scoped>
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-box {
  height: 300px;
}

.chart-box-lg {
  height: 390px;
}

.overview-item {
  text-align: center;
  padding: 20px;
  background: #F1F8FA;
  border-radius: 8px;
}

.overview-label {
  color: #999;
  font-size: 14px;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 28px;
  color: #12A8A0;
  font-weight: bold;
}

@media screen and (max-width: 1280px) {
  .chart-row :deep(> .el-col) { flex: 0 0 50%; max-width: 50%; margin-bottom: 20px; }
  .chart-row:last-child :deep(> .el-col) { flex: 0 0 100%; max-width: 100%; margin-bottom: 0; }
}

@media screen and (max-width: 900px) {
  .chart-row :deep(> .el-col) { flex: 0 0 100%; max-width: 100%; }
  .overview-row :deep(> .el-col) { flex: 0 0 50%; max-width: 50%; margin-bottom: 12px; }
  .overview-item { padding: 14px 10px; }
  .overview-value { font-size: 22px; }
  .chart-box { height: 240px; }
  .chart-box-lg { height: 280px; }
}
</style>
