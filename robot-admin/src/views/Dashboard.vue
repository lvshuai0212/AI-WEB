<template>
  <div class="dashboard">
    <div class="welcome card-block">
      <div class="welcome-text">
        <h2>欢迎回来，{{ adminName }}</h2>
        <p>社区健康守护管理平台 · 健康数据总览</p>
      </div>
      <img src="/image/logo.jpg" class="welcome-img" />
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6" v-for="(s, i) in stats" :key="i">
        <div class="stat-card" :style="{ '--accent': s.color }">
          <div class="stat-icon" :style="{ background: s.color }"><el-icon :size="26"><component :is="s.icon" /></el-icon></div>
          <div><p class="stat-label">{{ s.label }}</p><h3 class="stat-val">{{ s.value }}</h3></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="8">
        <el-card shadow="never" class="block-card">
          <template #header><span>快捷管理</span></template>
          <div class="quick-grid">
            <div class="quick-item" v-for="q in quickLinks" :key="q.path" @click="$router.push(q.path)">
              <el-icon :size="22"><component :is="q.icon" /></el-icon>
              <span>{{ q.label }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="never" class="block-card">
          <template #header><span>最近健康打卡</span></template>
          <div class="table-scroll">
            <el-table :data="recentCheckins" stripe size="small">
              <el-table-column prop="userName" label="居民" width="100" />
              <el-table-column prop="bloodPressure" label="血压" width="120" />
              <el-table-column prop="bloodSugar" label="血糖" width="100" />
              <el-table-column prop="checkDate" label="打卡日期" width="110" />
              <el-table-column prop="steps" label="步数" width="90" />
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUsers, getKnowledge, getCheckins, getBanners, getNotices } from '../utils/api'

const stats = ref([
  { label: '在管居民', value: 0, icon: 'User', color: '#12A8A0' },
  { label: '科普文章', value: 0, icon: 'Reading', color: '#2D9CDB' },
  { label: '宣教横幅', value: 0, icon: 'Picture', color: '#F2994A' },
  { label: '健康打卡', value: 0, icon: 'Calendar', color: '#EB5757' }
])
const recentCheckins = ref([])

const adminName = computed(() => {
  try { return JSON.parse(sessionStorage.getItem('adminInfo') || '{}').nickname || '管理员' } catch { return '管理员' }
})

const quickLinks = [
  { path: '/users', label: '居民健康档案', icon: 'User' },
  { path: '/knowledge', label: '健康科普管理', icon: 'Reading' },
  { path: '/banners', label: '健康宣教横幅', icon: 'Picture' },
  { path: '/notices', label: '健康提醒公告', icon: 'Bell' },
  { path: '/checkins', label: '健康打卡记录', icon: 'Calendar' },
  { path: '/charts', label: '健康数据统计', icon: 'DataAnalysis' }
]

async function loadData() {
  try {
    const [users, knowledge, checkins, banners, notices] = await Promise.all([
      getUsers(), getKnowledge(), getCheckins(), getBanners(), getNotices()
    ])
    stats.value[0].value = users.length
    stats.value[1].value = knowledge.length
    stats.value[2].value = banners.filter(b => b.status === 'active').length
    stats.value[3].value = checkins.length

    const userMap = {}; users.forEach(u => userMap[u.id] = u.nickname)
    recentCheckins.value = checkins.slice(-6).reverse().map(c => ({
      ...c,
      userName: userMap[c.userId] || '-',
      bloodPressure: `${c.systolic || '-'}/${c.diastolic || '-'} mmHg`,
      bloodSugar: `${c.bloodSugar ?? '-'} mmol/L`
    }))
  } catch { ElMessage.error('数据加载失败') }
}

onMounted(loadData)
</script>

<style scoped>
.dashboard { min-width: 0; }
.content-row { margin-top: 20px; }
.welcome {
  display: flex; justify-content: space-between; align-items: center;
  background: linear-gradient(135deg, #12A8A0, #1D7EC9);
  border-radius: 16px; padding: 28px 32px; color: #fff; margin-bottom: 20px;
}
.welcome h2 { margin: 0 0 8px; font-size: 22px; }
.welcome p { margin: 0; opacity: 0.85; font-size: 14px; }
.welcome-img { width: 64px; height: 64px; border-radius: 16px; border: 2px solid rgba(255,255,255,0.4); }

.stat-card {
  min-width: 0; height: 100%; background: #fff; border-radius: 16px; padding: 24px;
  display: flex; align-items: center; gap: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  border-left: 4px solid var(--accent);
}
.stat-card > div:last-child { min-width: 0; }
.stat-icon { width: 52px; height: 52px; flex: 0 0 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #fff; }
.stat-label { margin: 0 0 4px; color: #999; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stat-val { margin: 0; font-size: 28px; color: #0B3B48; font-weight: 700; }

.block-card { border-radius: 16px; border: none; }
.quick-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.quick-item {
  min-width: 0; display: flex; align-items: center; gap: 10px; padding: 16px;
  background: #F1F8FA; border-radius: 12px; cursor: pointer; transition: all 0.2s; color: #333; font-size: 14px;
}
.quick-item span { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.quick-item:hover { background: #E4F3F4; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(18,168,160,0.14); }
.table-scroll { width: 100%; overflow-x: auto; }
.table-scroll :deep(.el-table) { min-width: 560px; }

@media screen and (max-width: 1280px) {
  .stat-row :deep(> .el-col) { flex: 0 0 50%; max-width: 50%; margin-bottom: 20px; }
  .content-row :deep(> .el-col) { flex: 0 0 100%; max-width: 100%; }
  .content-row :deep(> .el-col + .el-col) { margin-top: 20px; }
  .stat-card { padding: 20px; }
  .quick-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media screen and (max-width: 900px) {
  .welcome { padding: 22px 24px; }
  .stat-card { padding: 16px; gap: 12px; }
  .stat-icon { width: 44px; height: 44px; flex-basis: 44px; border-radius: 12px; }
  .stat-val { font-size: 24px; }
  .quick-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .quick-item { padding: 14px 12px; }
}
</style>
