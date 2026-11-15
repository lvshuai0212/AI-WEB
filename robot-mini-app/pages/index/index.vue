<template>
  <view class="page home-page">
    <!-- 自定义导航 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-inner">
        <image class="nav-logo" src="/static/image/logo.jpg" mode="aspectFill" />
        <view class="nav-greet">
          <text class="greet-title">{{ greeting }}，{{ user?.nickname || '居民' }}</text>
          <text class="greet-sub">{{ user?.className || '社区' }} · 慢病随访已开启</text>
        </view>
        <view class="nav-bell" @click="goNotices">🔔</view>
      </view>
      <view class="nav-search" @click="goSearch">
        <text class="search-icon">🔍</text>
        <text class="search-ph">搜索慢病、饮食、运动建议</text>
        <text class="search-go">搜索</text>
      </view>
    </view>

    <!-- 健康宣教横幅 + 缩略图切换 -->
    <view class="banner-section fade-in">
      <swiper class="main-swiper" :current="bannerIndex" @change="onSwiperChange"
        :indicator-dots="false" :autoplay="autoplay" :interval="4500" :duration="500" circular>
        <swiper-item v-for="item in banners" :key="item.id" @click="onBannerTap(item)">
          <view class="banner-slide">
            <image class="banner-img" :src="item.image" mode="aspectFill" />
            <view class="banner-mask">
              <text class="banner-title">{{ item.title }}</text>
              <text class="banner-desc">{{ item.desc }}</text>
            </view>
          </view>
        </swiper-item>
      </swiper>
      <scroll-view scroll-x class="thumb-scroll" :scroll-into-view="'thumb-' + bannerIndex">
        <view class="thumb-list">
          <view v-for="(item, i) in banners" :key="item.id" :id="'thumb-' + i"
            class="thumb-item" :class="{ active: bannerIndex === i }" @click="switchBanner(i)">
            <image :src="item.image" mode="aspectFill" />
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 最近健康数据 -->
    <view class="card fade-in vitals-card">
      <view class="card-head">
        <text class="section-title">📈 最近健康数据</text>
        <text class="more" @click="goCheckin">去打卡 ›</text>
      </view>
      <view class="vitals-grid" v-if="vitals.length">
        <view class="vital-item" v-for="v in vitals" :key="v.label">
          <text class="vital-label">{{ v.label }}</text>
          <view class="vital-val">
            <text class="vital-num">{{ v.value }}</text>
            <text class="vital-unit">{{ v.unit }}</text>
          </view>
          <text class="vital-state" :class="v.ok ? 'state-ok' : 'state-warn'">{{ v.state }}</text>
        </view>
      </view>
      <view class="vitals-empty" v-else>
        <text>还没有健康记录，完成一次健康打卡即可查看血压、血糖变化</text>
        <text class="vitals-link" @click="goCheckin">立即打卡 ›</text>
      </view>
    </view>

    <!-- 健康数据概览 -->
    <view class="stats-card fade-in">
      <view class="stat-item" v-for="(s, i) in stats" :key="i">
        <text class="stat-val">{{ s.value }}</text>
        <text class="stat-lbl">{{ s.label }}</text>
      </view>
    </view>

    <!-- 快捷功能 -->
    <view class="quick-grid fade-in">
      <view class="quick-cell" v-for="q in quickMenus" :key="q.label" @click="q.action">
        <view class="quick-icon" :style="{ background: q.bg }">{{ q.icon }}</view>
        <text>{{ q.label }}</text>
      </view>
    </view>

    <!-- 健康分类 -->
    <view class="card fade-in cate-card">
      <view class="card-head">
        <text class="section-title">🗂 健康分类</text>
        <text class="more" @click="goKnowledge">全部科普 ›</text>
      </view>
      <view class="cate-grid">
        <view class="cate-item" v-for="c in categories" :key="c.name" @click="goCategory(c)">
          <view class="cate-icon" :style="{ background: c.bg }">{{ c.icon }}</view>
          <text class="cate-name">{{ c.name }}</text>
        </view>
      </view>
    </view>

    <!-- 健康提醒 -->
    <view class="card fade-in notices-card" v-if="notices.length">
      <view class="card-head">
        <text class="section-title">🔔 健康提醒</text>
        <text class="more" @click="goNotices">更多 ›</text>
      </view>
      <view class="notice-item" v-for="n in notices.slice(0, 3)" :key="n.id" @click="goNoticeDetail(n.id)">
        <view class="notice-tag" :class="noticeTypeClass(n.type)">{{ n.type }}</view>
        <text class="notice-title">{{ n.title }}</text>
        <text class="notice-date">{{ n.publishDate }}</text>
      </view>
    </view>

    <!-- 社区药库 · 常用药 -->
    <view class="card fade-in drug-strip">
      <view class="strip-main">
        <view class="strip-head">
          <view class="strip-badge">💊</view>
          <view class="strip-text">
            <text class="strip-title">社区药库 · 常用药</text>
            <text class="strip-sub">OTC 非处方药 · 社区药房配送到家</text>
          </view>
        </view>
        <text class="strip-more" @click="goDrugList">全部药品 ›</text>
      </view>
      <view class="strip-chips">
        <view class="strip-chip" v-for="c in drugQuickCates" :key="c" @click="goDrugCate(c)">
          <text class="chip-icon">{{ coverMeta(c).icon }}</text>
          <text class="chip-name">{{ c }}</text>
        </view>
      </view>
    </view>

    <!-- 今日健康任务 -->
    <view class="card fade-in learn-card">
      <view class="card-head">
        <text class="section-title">📖 今日健康科普</text>
        <text class="more" @click="goKnowledge">全部 ›</text>
      </view>
      <view class="learn-item" v-for="item in todayList" :key="item.id" @click="goDetail(item.id)">
        <image class="learn-cover" :src="getCover(item.id)" mode="aspectFill" />
        <view class="learn-info">
          <text class="learn-title">{{ item.title }}</text>
          <text class="learn-meta">{{ item.duration }} · {{ item.category }}</text>
          <view class="learn-foot">
            <text class="tag" :class="isChecked(item.id) ? 'tag-success' : 'tag-warning'">
              {{ isChecked(item.id) ? '✓ 已打卡' : '待完成' }}
            </text>
            <text class="learn-go">去阅读 ›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 健康任务完成度 -->
    <view class="card fade-in progress-card">
      <text class="section-title">📊 健康任务完成度</text>
      <view class="progress-wrap">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <text class="progress-text">已完成 {{ checkedCount }}/{{ totalKnowledge }} 篇科普 ({{ progressPercent }}%)</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { getBanners, getNotices, getKnowledge, getUserCheckins, getCurrentUser, checkLogin, drugCoverMeta } from '../../utils/api.js'
import { noticeTypeClass } from '../../utils/style.js'

const statusBarHeight = ref(20)
const bannerIndex = ref(0)
const autoplay = ref(true)
const banners = ref([])
const notices = ref([])
const knowledgeList = ref([])
const userCheckins = ref([])

uni.getSystemInfo({ success: (res) => { statusBarHeight.value = res.statusBarHeight || 20 } })

const user = computed(() => getCurrentUser())
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const latestCheckin = computed(() => {
  const list = [...userCheckins.value].sort((a, b) =>
    String(b.recordTime || b.date || '').localeCompare(String(a.recordTime || a.date || ''))
  )
  return list[0] || null
})

const vitals = computed(() => {
  const c = latestCheckin.value
  if (!c) return []
  const bpOk = c.systolic >= 90 && c.systolic < 140 && c.diastolic >= 60 && c.diastolic < 90
  const bsOk = c.bloodSugar >= 3.9 && c.bloodSugar <= 6.1
  return [
    { label: '血压', value: `${c.systolic || '-'}/${c.diastolic || '-'}`, unit: 'mmHg', state: bpOk ? '正常' : '偏高', ok: bpOk },
    { label: '血糖', value: c.bloodSugar ?? '-', unit: 'mmol/L', state: bsOk ? '正常' : '偏高', ok: bsOk },
    { label: '体重', value: c.weight ?? '-', unit: 'kg', state: '已记录', ok: true },
    { label: '步数', value: c.steps ?? '-', unit: '步', state: '今日', ok: true }
  ]
})

const stats = computed(() => [
  { label: '健康积分', value: user.value?.totalPoints || 0 },
  { label: '连续打卡', value: (user.value?.continuousDays || 0) + '天' },
  { label: '累计打卡', value: (user.value?.totalCheckins || 0) + '次' },
  { label: '社区排名', value: user.value ? '查看' : '-' }
])

const todayList = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const pub = knowledgeList.value.filter(k => k.status === 'published')
  const t = pub.filter(k => k.publishDate === today)
  return (t.length ? t : pub.slice(0, 3))
})

const totalKnowledge = computed(() => knowledgeList.value.filter(k => k.status === 'published').length)
const checkedCount = computed(() => {
  const ids = new Set(userCheckins.value.map(c => c.knowledgeId))
  return ids.size
})
const progressPercent = computed(() => totalKnowledge.value ? Math.round(checkedCount.value / totalKnowledge.value * 100) : 0)

const quickMenus = [
  { icon: '🩺', label: 'AI健康顾问', bg: 'linear-gradient(135deg,#12A8A0,#2D9CDB)', action: () => uni.navigateTo({ url: '/pages/chat/chat' }) },
  { icon: '📖', label: '健康科普', bg: 'linear-gradient(135deg,#56CCF2,#2F80ED)', action: () => uni.switchTab({ url: '/pages/knowledge/list' }) },
  { icon: '✅', label: '健康打卡', bg: 'linear-gradient(135deg,#11998e,#38ef7d)', action: () => uni.switchTab({ url: '/pages/checkin/checkin' }) },
  { icon: '🏅', label: '积分榜', bg: 'linear-gradient(135deg,#F2994A,#F2C94C)', action: () => uni.switchTab({ url: '/pages/ranking/ranking' }) },
  { icon: '💊', label: '社区药库', bg: 'linear-gradient(135deg,#27AE60,#12A8A0)', action: () => uni.navigateTo({ url: '/pages/drug/list' }) }
]

const coverMeta = drugCoverMeta
const drugQuickCates = ['感冒用药', '胃肠用药', '解热镇痛', '外用']
function goDrugList() { uni.navigateTo({ url: '/pages/drug/list' }) }
function goDrugCate(name) {
  uni.navigateTo({ url: '/pages/drug/list?category=' + name })
}

const categories = [
  { name: '慢病管理', icon: '🩺', bg: 'linear-gradient(135deg,#12A8A0,#2D9CDB)' },
  { name: '饮食营养', icon: '🥗', bg: 'linear-gradient(135deg,#27AE60,#6FCF97)' },
  { name: '运动健身', icon: '🏃', bg: 'linear-gradient(135deg,#2D9CDB,#56CCF2)' },
  { name: '用药指导', icon: '💊', bg: 'linear-gradient(135deg,#F2994A,#F2C94C)' },
  { name: '心理健康', icon: '🧘', bg: 'linear-gradient(135deg,#9B51E0,#BB6BD9)' },
  { name: '急救常识', icon: '🚑', bg: 'linear-gradient(135deg,#EB5757,#F2994A)' }
]

function goCheckin() { uni.switchTab({ url: '/pages/checkin/checkin' }) }
function goCategory(c) {
  uni.setStorageSync('knowledgeCategory', c.name)
  uni.switchTab({ url: '/pages/knowledge/list' })
}

function getCover(id) { return `/static/image/${((id - 1) % 9) + 1}.jpg` }
function isChecked(kid) { return userCheckins.value.some(c => c.knowledgeId === kid) }
function onSwiperChange(e) { bannerIndex.value = e.detail.current }
function switchBanner(i) { autoplay.value = false; bannerIndex.value = i; setTimeout(() => { autoplay.value = true }, 5000) }

function onBannerTap(item) {
  if (item.linkType === 'knowledge') uni.navigateTo({ url: '/pages/knowledge/detail?id=' + item.linkId })
  else if (item.linkType === 'checkin') uni.switchTab({ url: '/pages/checkin/checkin' })
  else if (item.linkType === 'ranking') uni.switchTab({ url: '/pages/ranking/ranking' })
}

function loadData() {
  if (!checkLogin()) return Promise.resolve()
  const uid = user.value?.id
  return Promise.all([
    getBanners().then(d => { banners.value = d }),
    getNotices().then(d => { notices.value = d }),
    getKnowledge().then(d => { knowledgeList.value = d }),
    uid ? getUserCheckins(uid).then(d => { userCheckins.value = d }) : Promise.resolve()
  ])
}

onShow(() => loadData())
onPullDownRefresh(() => loadData().finally(() => uni.stopPullDownRefresh()))

function goSearch() { uni.switchTab({ url: '/pages/knowledge/list' }) }
function goKnowledge() { uni.switchTab({ url: '/pages/knowledge/list' }) }
function goNotices() { uni.navigateTo({ url: '/pages/notice/list' }) }
function goNoticeDetail(id) { uni.navigateTo({ url: '/pages/notice/detail?id=' + id }) }
function goDetail(id) { uni.navigateTo({ url: '/pages/knowledge/detail?id=' + id }) }
</script>

<style scoped>
.page { padding-bottom: 30rpx; }
.nav-bar { background: linear-gradient(135deg, #12A8A0, #1D7EC9); }
.nav-inner { display: flex; align-items: center; padding: 16rpx 24rpx 20rpx; gap: 16rpx; }
.nav-logo { width: 64rpx; height: 64rpx; border-radius: 16rpx; border: 2rpx solid rgba(255,255,255,0.5); }
.nav-greet { flex: 1; min-width: 0; }
.greet-title { display: block; font-size: 30rpx; font-weight: 700; color: #fff; }
.greet-sub { display: block; font-size: 20rpx; color: rgba(255,255,255,0.78); margin-top: 6rpx; }
.nav-search {
  display: flex; align-items: center; gap: 12rpx;
  margin: 0 24rpx 24rpx; padding: 12rpx 12rpx 12rpx 28rpx;
  background: #fff; border-radius: 999rpx;
  box-shadow: 0 10rpx 28rpx rgba(7,38,48,0.22);
}
.search-icon { font-size: 26rpx; opacity: 0.7; }
.search-ph { flex: 1; font-size: 25rpx; color: #9AAAB2; }
.search-go {
  font-size: 24rpx; color: #fff; padding: 10rpx 28rpx; border-radius: 999rpx;
  background: linear-gradient(135deg,#12A8A0,#2D9CDB);
}
.nav-bell { font-size: 40rpx; padding: 8rpx; }

.banner-section { margin: 20rpx 24rpx 0; }
.main-swiper { height: 360rpx; border-radius: 24rpx; overflow: hidden; }
.banner-slide { position: relative; width: 100%; height: 100%; }
.banner-img { width: 100%; height: 100%; }
.banner-mask { position: absolute; bottom: 0; left: 0; right: 0; padding: 40rpx 28rpx 28rpx; background: linear-gradient(transparent, rgba(0,0,0,0.65)); }
.banner-title { font-size: 36rpx; font-weight: 700; color: #fff; display: block; }
.banner-desc { font-size: 24rpx; color: rgba(255,255,255,0.9); margin-top: 8rpx; display: block; }

.thumb-scroll { margin-top: 16rpx; white-space: nowrap; }
.thumb-list { display: inline-flex; gap: 12rpx; padding: 4rpx; }
.thumb-item { width: 100rpx; height: 64rpx; border-radius: 12rpx; overflow: hidden; border: 3rpx solid transparent; opacity: 0.6; transition: all 0.3s; }
.thumb-item.active { border-color: #12A8A0; opacity: 1; transform: scale(1.08); }
.thumb-item image { width: 100%; height: 100%; }

.stats-card { display: flex; margin: 24rpx; background: #fff; border-radius: 24rpx; padding: 28rpx 0; box-shadow: 0 8rpx 32rpx rgba(18,168,160,0.1); }
.stat-item { flex: 1; text-align: center; border-right: 1rpx solid #F0F2F5; }
.stat-item:last-child { border-right: none; }
.stat-val { font-size: 36rpx; font-weight: 700; color: #12A8A0; display: block; }
.stat-lbl { font-size: 22rpx; color: #999; margin-top: 6rpx; display: block; }

.quick-grid { display: flex; margin: 0 24rpx 24rpx; gap: 12rpx; }
.quick-cell { flex: 1; min-width: 0; background: #fff; border-radius: 20rpx; padding: 24rpx 2rpx; text-align: center; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06); font-size: 22rpx; color: #555; }
.quick-cell > text { display: block; white-space: nowrap; }
.quick-icon { width: 72rpx; height: 72rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; font-size: 36rpx; margin: 0 auto 12rpx; }

/* 社区药库 · 常用药 */
.strip-main { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; }
.strip-head { display: flex; align-items: center; gap: 14rpx; min-width: 0; }
.strip-badge { width: 64rpx; height: 64rpx; border-radius: 18rpx; background: linear-gradient(135deg,#12A8A0,#2D9CDB); display: flex; align-items: center; justify-content: center; font-size: 32rpx; flex-shrink: 0; }
.strip-text { min-width: 0; }
.strip-title { display: block; font-size: 28rpx; font-weight: 700; color: #0B3B48; }
.strip-sub { display: block; font-size: 20rpx; color: #8E9AAB; margin-top: 6rpx; }
.strip-more { flex-shrink: 0; font-size: 24rpx; color: #12A8A0; }
.strip-chips { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12rpx; margin-top: 18rpx; }
.strip-chip { display: flex; align-items: center; justify-content: center; gap: 6rpx; background: #F1F9F8; border: 1rpx solid rgba(18,168,160,0.14); border-radius: 14rpx; padding: 12rpx 4rpx; }
.chip-icon { font-size: 24rpx; }
.chip-name { font-size: 22rpx; color: #127F79; white-space: nowrap; }

.card { margin: 0 24rpx 24rpx; background: #fff; border-radius: 24rpx; padding: 28rpx; box-shadow: 0 8rpx 32rpx rgba(18,168,160,0.08); }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18rpx; }
.card-head .section-title { margin-bottom: 0; }
.more { font-size: 26rpx; color: #12A8A0; }

/* 最近健康数据 */
.vitals-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16rpx; }
.vital-item { min-width: 0; background: #F5FAFB; border-radius: 16rpx; padding: 18rpx 8rpx; text-align: center; }
.vital-label { display: block; font-size: 22rpx; color: #8E9AAB; }
.vital-val { margin: 8rpx 0 10rpx; }
.vital-num { font-size: 32rpx; font-weight: 700; color: #0B3B48; }
.vital-unit { font-size: 18rpx; color: #8E9AAB; margin-left: 4rpx; }
.vital-state { display: inline-block; font-size: 20rpx; padding: 2rpx 12rpx; border-radius: 8rpx; }
.state-ok { background: rgba(39,174,96,0.12); color: #27AE60; }
.state-warn { background: rgba(242,153,74,0.16); color: #F2994A; }
.vitals-empty { font-size: 24rpx; color: #8E9AAB; line-height: 1.7; }
.vitals-link { display: block; margin-top: 8rpx; color: #12A8A0; font-size: 24rpx; }

/* 健康分类 */
.cate-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16rpx; }
.cate-item { display: flex; flex-direction: column; align-items: center; gap: 10rpx; background: #F5FAFB; border-radius: 16rpx; padding: 20rpx 8rpx; }
.cate-icon { width: 52rpx; height: 52rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; font-size: 26rpx; flex-shrink: 0; }
.cate-name { font-size: 24rpx; color: #24414A; white-space: nowrap; }

.notice-item { display: flex; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #F5F5F5; gap: 12rpx; }
.notice-item:last-child { border-bottom: none; }
.notice-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; background: #E6F5F4; color: #12A8A0; flex-shrink: 0; }
.notice-tag.type-med { background: #FFF3E0; color: #F2994A; }
.notice-tag.type-visit { background: #E8F5E9; color: #27AE60; }
.notice-tag.type-exam { background: #E6F5F4; color: #12A8A0; }
.notice-title { flex: 1; font-size: 28rpx; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.notice-date { font-size: 22rpx; color: #bbb; flex-shrink: 0; }

.learn-item { display: flex; gap: 20rpx; padding: 20rpx 0; border-bottom: 1rpx solid #F5F5F5; }
.learn-item:last-child { border-bottom: none; }
.learn-cover { width: 140rpx; height: 100rpx; border-radius: 16rpx; flex-shrink: 0; }
.learn-info { flex: 1; }
.learn-title { font-size: 30rpx; font-weight: 600; color: #333; display: block; }
.learn-meta { font-size: 24rpx; color: #999; margin: 8rpx 0; display: block; }
.learn-foot { display: flex; justify-content: space-between; align-items: center; }
.learn-go { font-size: 24rpx; color: #12A8A0; }

.progress-card .section-title { margin-bottom: 0; }
.progress-wrap { margin-top: 16rpx; }
.progress-bar { height: 16rpx; background: #E6F5F4; border-radius: 8rpx; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #12A8A0, #2D9CDB); border-radius: 8rpx; transition: width 0.6s; }
.progress-text { font-size: 24rpx; color: #999; margin-top: 12rpx; display: block; }

@media screen and (min-width: 750px) {
  .card { padding: 20px; }
  .card-head { margin-bottom: 12px; }
  .card .section-title { font-size: 17px; margin-bottom: 0; }
  .progress-wrap { margin-top: 10px; }
  .progress-text { font-size: 12px; margin-top: 8px; }
  .drug-strip { display: flex; align-items: center; justify-content: space-between; gap: 28px; padding: 20px; }
  .strip-main { flex: 1; min-width: 0; }
  .strip-head { gap: 14px; }
  .strip-badge { width: 42px; height: 42px; border-radius: 12px; font-size: 20px; }
  .strip-title { font-size: 17px; }
  .strip-sub { font-size: 12px; margin-top: 3px; }
  .strip-more { font-size: 13px; }
  .strip-chips { display: flex; gap: 10px; margin-top: 0; flex-shrink: 0; }
  .strip-chip { padding: 9px 16px; border-radius: 999px; }
  .chip-icon { font-size: 14px; }
  .chip-name { font-size: 13px; }
}

</style>
