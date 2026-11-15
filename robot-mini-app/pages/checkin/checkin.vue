<template>
  <view class="checkin-page">
    <view class="header">
      <view class="header-top">
        <image class="header-logo" src="/static/image/logo.jpg" mode="aspectFill" />
        <view class="header-text">
          <text class="page-title">健康打卡</text>
          <text class="page-sub">{{ currentMonthLabel }} · 已打卡 {{ monthCheckinDays }} 天</text>
        </view>
        <view class="header-stats">
          <view class="h-stat">
            <text class="h-val">{{ user?.continuousDays || 0 }}</text>
            <text class="h-lbl">连续天数</text>
          </view>
          <view class="h-stat">
            <text class="h-val">{{ todayCompleted }}/{{ todayTasks.length }}</text>
            <text class="h-lbl">今日完成</text>
          </view>
          <view class="h-stat">
            <text class="h-val">+{{ todayPoints }}</text>
            <text class="h-lbl">今日积分</text>
          </view>
        </view>
      </view>
    </view>

    <view class="container">
      <!-- 今日健康数据 -->
      <view class="card today-data">
        <view class="card-head">
          <text class="section-title">今日健康数据</text>
          <text class="update-tip" v-if="todayLatest">{{ todayLatest.recordTime }} 记录</text>
        </view>
        <view class="metric-grid" v-if="todayLatest">
          <view class="metric-cell">
            <text class="metric-val">{{ todayLatest.systolic || '-' }}/{{ todayLatest.diastolic || '-' }}</text>
            <text class="metric-lbl">血压 mmHg</text>
          </view>
          <view class="metric-cell">
            <text class="metric-val">{{ todayLatest.bloodSugar || '-' }}</text>
            <text class="metric-lbl">血糖 mmol/L</text>
          </view>
          <view class="metric-cell">
            <text class="metric-val">{{ todayLatest.weight || '-' }}</text>
            <text class="metric-lbl">体重 kg</text>
          </view>
          <view class="metric-cell">
            <text class="metric-val">{{ todayLatest.steps || 0 }}</text>
            <text class="metric-lbl">步数</text>
          </view>
        </view>
        <view class="empty-data" v-else>
          <text class="empty-icon">🩺</text>
          <text class="empty-text">今天还没有记录健康数据</text>
          <text class="empty-sub">阅读一篇科普后完成健康打卡吧</text>
          <view class="empty-btn" @click="goKnowledge">去科普页打卡</view>
        </view>
      </view>

      <!-- 打卡日历 -->
      <view class="card">
        <view class="card-head">
          <text class="section-title">本月打卡日历</text>
          <text class="month-badge">{{ monthCheckinDays }} 天</text>
        </view>
        <view class="week-row">
          <text v-for="w in ['日','一','二','三','四','五','六']" :key="w" class="week-cell">{{ w }}</text>
        </view>
        <view class="calendar-grid">
          <view v-for="(day, idx) in calendarDays" :key="idx" class="day-cell"
            :class="{ empty: !day, checked: day && checkedDates.includes(day.date), today: day && day.isToday }">
            <text v-if="day">{{ day.day }}</text>
            <view v-if="day && checkedDates.includes(day.date)" class="dot"></view>
          </view>
        </view>
      </view>

      <!-- 今日健康任务 -->
      <view class="card">
        <view class="card-head">
          <text class="section-title">今日健康任务</text>
          <text class="update-tip">完成科普阅读 + 健康打卡</text>
        </view>
        <view class="task-item" v-for="k in todayTasks" :key="k.id" @click="goTask(k)">
          <view class="task-left">
            <view class="task-status" :class="{ done: isDone(k.id) }">{{ isDone(k.id) ? '✓' : '!' }}</view>
            <view>
              <text class="task-title">{{ k.title }}</text>
              <text class="task-meta">{{ k.category }} · {{ k.duration }}</text>
            </view>
          </view>
          <text class="task-btn" :class="{ done: isDone(k.id) }">{{ isDone(k.id) ? '已完成' : '去打卡' }}</text>
        </view>
        <view class="empty-task" v-if="!todayTasks.length">今日暂无健康任务，去科普页看看吧</view>
      </view>

      <!-- 打卡说明 -->
      <view class="card rules">
        <text class="section-title">健康打卡说明</text>
        <view class="rule-line">· 每天完成一次健康任务打卡，可获得 10 健康积分</view>
        <view class="rule-line">· 连续打卡满 3 天起，每次额外奖励 5 积分</view>
        <view class="rule-line">· 请如实填写血压、血糖、体重与步数，便于家庭医生随访</view>
        <view class="rule-line">· 数据异常（如血压≥140/90）请及时联系家庭医生</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { getKnowledge, getUserCheckins, getCurrentUser, checkLogin } from '../../utils/api.js'

const user = ref(getCurrentUser())
const knowledgeList = ref([])
const checkins = ref([])

const now = new Date()
const currentMonthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`
const today = now.toISOString().split('T')[0]

const published = computed(() => knowledgeList.value.filter(k => k.status === 'published'))

const todayTasks = computed(() => {
  const t = published.value.filter(k => k.publishDate === today)
  return t.length ? t : published.value.slice(0, 3)
})

const todayLatest = computed(() => {
  const list = checkins.value.filter(c => c.checkDate === today)
  return list.length ? list[list.length - 1] : null
})

const todayPoints = computed(() => checkins.value.filter(c => c.checkDate === today).reduce((s, c) => s + (c.points || 0), 0))
const todayCompleted = computed(() => todayTasks.value.filter(k => isDone(k.id)).length)

const monthCheckinDays = computed(() => {
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return new Set(checkins.value.filter(c => c.checkDate.startsWith(prefix)).map(c => c.checkDate)).size
})

const checkedDates = computed(() => [...new Set(checkins.value.map(c => c.checkDate))])

const calendarDays = computed(() => {
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const arr = []
  for (let i = 0; i < firstDay; i++) arr.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    arr.push({ day: d, date: dateStr, isToday: dateStr === today })
  }
  return arr
})

function isDone(kid) { return checkins.value.some(c => c.knowledgeId === kid && c.checkDate === today) }
function goTask(k) { uni.navigateTo({ url: '/pages/knowledge/detail?id=' + k.id }) }
function goKnowledge() { uni.switchTab({ url: '/pages/knowledge/list' }) }

function loadData() {
  if (!checkLogin()) return Promise.resolve()
  user.value = getCurrentUser()
  const uid = user.value?.id
  return Promise.all([
    getKnowledge().then(d => { knowledgeList.value = d }),
    uid ? getUserCheckins(uid).then(d => { checkins.value = d }) : Promise.resolve()
  ])
}

onShow(() => loadData())
onPullDownRefresh(() => loadData().finally(() => uni.stopPullDownRefresh()))
</script>

<style scoped>
.checkin-page { min-height: 100vh; padding-bottom: 40rpx; }
.header {
  margin: 20rpx 24rpx 0;
  padding: 24rpx 24rpx 22rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #12A8A0, #1D7EC9);
  box-shadow: 0 10rpx 28rpx rgba(7, 38, 48, 0.16);
}
.header-top { display: flex; align-items: center; gap: 16rpx; }
.header-logo { width: 68rpx; height: 68rpx; border-radius: 18rpx; border: 2rpx solid rgba(255,255,255,0.5); flex-shrink: 0; }
.header-text { flex: 1; min-width: 0; }
.page-title { font-size: 34rpx; font-weight: 700; color: #fff; display: block; }
.page-sub { font-size: 20rpx; color: rgba(255,255,255,0.82); margin-top: 6rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header-stats { display: flex; align-items: center; gap: 18rpx; flex-shrink: 0; }
.h-stat { text-align: center; }
.h-val { font-size: 28rpx; font-weight: 700; color: #fff; display: block; }
.h-lbl { font-size: 16rpx; color: rgba(255,255,255,0.78); margin-top: 2rpx; display: block; }

.container { padding: 0 24rpx; margin-top: 16rpx; }
.card { background: #fff; border-radius: 24rpx; padding: 28rpx; margin-bottom: 24rpx; box-shadow: 0 8rpx 28rpx rgba(18,168,160,0.1); }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.section-title { font-size: 32rpx; font-weight: 700; color: #0B3B48; }
.update-tip { font-size: 22rpx; color: #999; }
.month-badge { font-size: 22rpx; color: #12A8A0; background: #E6F5F4; padding: 4rpx 16rpx; border-radius: 20rpx; }

.metric-grid { display: flex; flex-wrap: wrap; }
.metric-cell { width: 50%; padding: 16rpx 0; }
.metric-val { font-size: 36rpx; font-weight: 700; color: #12A8A0; display: block; }
.metric-lbl { font-size: 22rpx; color: #999; margin-top: 4rpx; display: block; }

.empty-data { display: flex; flex-direction: column; align-items: center; padding: 30rpx 0; }
.empty-icon { font-size: 60rpx; }
.empty-text { font-size: 28rpx; color: #666; margin-top: 12rpx; }
.empty-sub { font-size: 22rpx; color: #aaa; margin-top: 6rpx; }

.week-row { display: flex; }
.week-cell { flex: 1; text-align: center; font-size: 22rpx; color: #999; padding-bottom: 10rpx; }
.calendar-grid { display: flex; flex-wrap: wrap; }
.day-cell { width: 14.28%; height: 72rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; font-size: 26rpx; color: #555; border-radius: 16rpx; }
.day-cell.today { background: #E6F5F4; color: #12A8A0; font-weight: 700; }
.day-cell.checked { color: #12A8A0; font-weight: 600; }
.dot { width: 8rpx; height: 8rpx; border-radius: 50%; background: #12A8A0; position: absolute; bottom: 8rpx; }

.task-item { display: flex; align-items: center; justify-content: space-between; padding: 22rpx 0; border-bottom: 1rpx solid #F5F5F5; }
.task-item:last-child { border-bottom: none; }
.task-left { display: flex; align-items: center; gap: 18rpx; flex: 1; min-width: 0; }
.task-status { width: 44rpx; height: 44rpx; border-radius: 50%; background: #FFF3E0; color: #F2994A; display: flex; align-items: center; justify-content: center; font-size: 26rpx; font-weight: 700; flex-shrink: 0; }
.task-status.done { background: #E8F5E9; color: #27AE60; }
.task-title { font-size: 28rpx; color: #333; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 380rpx; }
.task-meta { font-size: 22rpx; color: #999; margin-top: 4rpx; display: block; }
.task-btn { font-size: 24rpx; color: #fff; background: linear-gradient(135deg, #12A8A0, #2D9CDB); padding: 10rpx 24rpx; border-radius: 24rpx; flex-shrink: 0; }
.task-btn.done { background: #E8F5E9; color: #27AE60; }
.empty-task { font-size: 24rpx; color: #aaa; text-align: center; padding: 24rpx 0; }

.rules .rule-line { font-size: 24rpx; color: #777; line-height: 1.9; }
.empty-btn { margin-top: 18rpx; font-size: 24rpx; color: #fff; background: linear-gradient(135deg, #12A8A0, #2D9CDB); padding: 12rpx 32rpx; border-radius: 999rpx; }

/* 宽屏：两栏布局，今日数据与说明通栏 */
@media screen and (min-width: 750px) {
  .header { margin: 18px 0 0; padding: 20px 24px; border-radius: 16px; }
  .header-top { gap: 16px; }
  .header-logo { width: 46px; height: 46px; border-radius: 12px; border-width: 2px; }
  .page-title { font-size: 24px; }
  .page-sub { font-size: 13px; margin-top: 4px; }
  .header-stats { gap: 30px; }
  .h-val { font-size: 22px; }
  .h-lbl { font-size: 12px; }
  .container {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    align-items: start;
    padding: 0;
    margin-top: 18px;
  }
  .card { margin-bottom: 0; border-radius: 14px; padding: 20px 22px; }
  .today-data, .rules { grid-column: 1 / -1; }
  .section-title { font-size: 17px; }
  .update-tip, .month-badge { font-size: 12px; }
  .card-head { margin-bottom: 14px; }
  .metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
  .metric-cell { width: auto; padding: 6px 0; }
  .metric-val { font-size: 24px; }
  .metric-lbl { font-size: 12px; margin-top: 2px; }
  .empty-data { padding: 18px 0 10px; }
  .empty-icon { font-size: 34px; }
  .empty-text { font-size: 15px; margin-top: 8px; }
  .empty-sub { font-size: 12px; }
  .week-cell { font-size: 12px; padding-bottom: 8px; }
  .day-cell { height: 46px; font-size: 15px; border-radius: 10px; }
  .dot { width: 5px; height: 5px; bottom: 5px; }
  .task-item { padding: 14px 0; }
  .task-title { font-size: 15px; max-width: none; }
  .task-meta { font-size: 12px; }
  .task-btn { font-size: 13px; padding: 6px 16px; border-radius: 999px; }
  .rules .rule-line { font-size: 13px; line-height: 1.95; }
}
</style>
