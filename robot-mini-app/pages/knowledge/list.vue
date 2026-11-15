<template>
  <view class="list-page">
    <view class="header">
      <view class="header-top">
        <image class="header-logo" src="/static/image/logo.jpg" mode="aspectFill" />
        <view class="header-text">
          <text class="page-title">健康科普</text>
          <text class="page-sub">权威、易懂的慢病管理与健康生活知识</text>
        </view>
        <view class="header-stats">
          <view class="h-stat">
            <text class="h-val">{{ checkedCount }}</text>
            <text class="h-lbl">已打卡</text>
          </view>
          <view class="h-divider"></view>
          <view class="h-stat">
            <text class="h-val">{{ publishedCount }}</text>
            <text class="h-lbl">总篇数</text>
          </view>
        </view>
      </view>
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input class="search-input" v-model="keyword" placeholder="搜索科普文章、分类，如：高血压" confirm-type="search" />
      </view>
    </view>

    <view class="tabs">
      <view class="tab" v-for="t in tabs" :key="t.value"
        :class="{ active: currentTab === t.value }" @click="currentTab = t.value">
        {{ t.label }}
      </view>
    </view>

    <view class="container">
      <view class="total-tip">共 {{ filteredList.length }} 篇科普</view>

      <view class="know-card fade-in" v-for="item in filteredList" :key="item.id" @click="goDetail(item.id)">
        <image class="cover" :src="getCover(item.id)" mode="aspectFill" />
        <view class="info">
          <text class="title">{{ item.title }}</text>
          <text class="summary">{{ item.summary }}</text>
          <view class="meta">
            <text class="tag">{{ item.category }}</text>
            <text class="dot-sep">·</text>
            <text class="duration">{{ item.duration }}</text>
            <text class="read">{{ item.readCount || 0 }} 阅读</text>
          </view>
        </view>
        <text class="status" :class="{ done: isChecked(item.id) }">{{ isChecked(item.id) ? '✓' : '›' }}</text>
      </view>

      <view class="empty" v-if="!filteredList.length">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无相关科普文章</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { getKnowledge, getUserCheckins, getCurrentUser, checkLogin } from '../../utils/api.js'

const tabs = [
  { label: '全部', value: 'all' },
  { label: '已打卡', value: 'checked' },
  { label: '待打卡', value: 'unchecked' }
]
const currentTab = ref('all')
const keyword = ref('')
const knowledgeList = ref([])
const checkins = ref([])

const checkedIds = computed(() => new Set(checkins.value.map(c => c.knowledgeId)))
const publishedCount = computed(() => knowledgeList.value.filter(k => k.status === 'published').length)
const checkedCount = computed(() => checkedIds.value.size)

const filteredList = computed(() => {
  let list = knowledgeList.value.filter(k => k.status === 'published')
  if (keyword.value) {
    const key = keyword.value.toLowerCase()
    list = list.filter(k => k.title.toLowerCase().includes(key) || k.category.toLowerCase().includes(key))
  }
  if (currentTab.value === 'checked') list = list.filter(k => checkedIds.value.has(k.id))
  if (currentTab.value === 'unchecked') list = list.filter(k => !checkedIds.value.has(k.id))
  return list
})

function isChecked(id) { return checkedIds.value.has(id) }
function getCover(id) { return `/static/image/${((id - 1) % 9) + 1}.jpg` }
function goDetail(id) { uni.navigateTo({ url: '/pages/knowledge/detail?id=' + id }) }

function loadData() {
  if (!checkLogin()) return Promise.resolve()
  const user = getCurrentUser()
  return Promise.all([
    getKnowledge().then(d => { knowledgeList.value = d }),
    user?.id ? getUserCheckins(user.id).then(d => { checkins.value = d }) : Promise.resolve()
  ])
}

onShow(() => {
  const cat = uni.getStorageSync('knowledgeCategory')
  if (cat) {
    keyword.value = cat
    uni.removeStorageSync('knowledgeCategory')
  }
  loadData()
})
onPullDownRefresh(() => loadData().finally(() => uni.stopPullDownRefresh()))
</script>

<style scoped>
.list-page { min-height: 100vh; }
.header {
  margin: 20rpx 24rpx 0;
  padding: 24rpx 24rpx 20rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #12A8A0, #1D7EC9);
  box-shadow: 0 10rpx 28rpx rgba(7, 38, 48, 0.16);
}
.header-top { display: flex; align-items: center; gap: 18rpx; }
.header-logo { width: 68rpx; height: 68rpx; border-radius: 18rpx; border: 2rpx solid rgba(255,255,255,0.5); flex-shrink: 0; }
.header-text { flex: 1; min-width: 0; }
.page-title { font-size: 34rpx; font-weight: 700; color: #fff; display: block; }
.page-sub { font-size: 20rpx; color: rgba(255,255,255,0.8); margin-top: 6rpx; display: block; }
.page-sub, .page-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header-stats { display: flex; align-items: center; gap: 16rpx; flex-shrink: 0; }
.h-stat { text-align: center; }
.h-val { font-size: 32rpx; font-weight: 700; color: #fff; display: block; }
.h-lbl { font-size: 18rpx; color: rgba(255,255,255,0.75); margin-top: 2rpx; display: block; }
.h-divider { width: 1rpx; height: 36rpx; background: rgba(255,255,255,0.28); }

.search-bar {
  display: flex; align-items: center; gap: 12rpx;
  margin-top: 20rpx; padding: 12rpx 12rpx 12rpx 28rpx;
  background: #fff; border-radius: 999rpx;
  box-shadow: 0 10rpx 28rpx rgba(7, 38, 48, 0.16);
}
.search-icon { font-size: 26rpx; opacity: 0.7; }
.search-input { flex: 1; font-size: 25rpx; color: #24414A; }

.tabs { display: flex; background: #fff; margin: 20rpx 24rpx 0; border-radius: 24rpx; padding: 12rpx; box-shadow: 0 8rpx 24rpx rgba(18,168,160,0.1); position: relative; z-index: 2; }
.tab { flex: 1; text-align: center; padding: 16rpx 0; font-size: 26rpx; color: #888; border-radius: 16rpx; }
.tab.active { background: linear-gradient(135deg, #12A8A0, #2D9CDB); color: #fff; font-weight: 600; }

.container { padding: 24rpx; }
.total-tip { font-size: 24rpx; color: #999; margin-bottom: 16rpx; }
.know-card { display: flex; gap: 20rpx; background: #fff; border-radius: 24rpx; padding: 24rpx; margin-bottom: 20rpx; box-shadow: 0 6rpx 24rpx rgba(18,168,160,0.08); position: relative; }
.cover { width: 160rpx; height: 130rpx; border-radius: 16rpx; flex-shrink: 0; }
.info { flex: 1; min-width: 0; }
.title { font-size: 30rpx; font-weight: 600; color: #24414A; display: block; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.summary { font-size: 22rpx; color: #999; margin-top: 8rpx; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.meta { display: flex; align-items: center; gap: 8rpx; margin-top: 12rpx; }
.tag { font-size: 20rpx; color: #12A8A0; background: #E6F5F4; padding: 4rpx 12rpx; border-radius: 8rpx; }
.dot-sep, .duration { font-size: 20rpx; color: #bbb; }
.read { font-size: 20rpx; color: #bbb; margin-left: auto; }
.status { position: absolute; right: 24rpx; bottom: 24rpx; font-size: 32rpx; color: #ccc; }
.status.done { color: #27AE60; font-weight: 700; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 26rpx; color: #aaa; margin-top: 16rpx; }

/* 宽屏：两列/三列卡片栅格，封面固定比例 */
@media screen and (min-width: 750px) {
  .header { margin: 18px 0 0; padding: 20px 24px; border-radius: 16px; }
  .header-top { gap: 16px; }
  .header-logo { width: 46px; height: 46px; border-radius: 12px; border-width: 2px; }
  .page-title { font-size: 24px; }
  .page-sub { font-size: 13px; margin-top: 4px; }
  .h-val { font-size: 22px; }
  .h-lbl { font-size: 12px; }
  .h-divider { height: 26px; }
  .header-stats { gap: 22px; }
  .search-bar { margin-top: 16px; padding: 8px 8px 8px 20px; box-shadow: 0 6px 20px rgba(7, 38, 48, 0.14); }
  .search-icon { font-size: 15px; }
  .search-input { font-size: 14px; }
  .tabs { width: 100% !important; max-width: 1080px !important; margin: 16px auto 0; border-radius: 14px; padding: 6px; gap: 6px; }
  .tab { font-size: 14px; padding: 9px 0; border-radius: 10px; }
  .container {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    align-items: start;
    padding: 24px 0;
  }
  .total-tip { grid-column: 1 / -1; margin: 0; font-size: 13px; }
  .empty { grid-column: 1 / -1; padding: 60px 0; }
  .empty-text { font-size: 14px; }
  .know-card {
    flex-direction: column;
    gap: 0;
    margin-bottom: 0;
    padding: 0;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 4px 18px rgba(11, 59, 72, 0.07);
  }
  .cover { width: 100%; height: 168px; border-radius: 0; }
  .info { padding: 14px 16px 16px; }
  .title { font-size: 16px; line-height: 1.5; }
  .summary { font-size: 13px; margin-top: 6px; line-height: 1.6; }
  .meta { margin-top: 10px; gap: 6px; }
  .tag { font-size: 12px; padding: 3px 8px; border-radius: 6px; }
  .dot-sep, .duration, .read { font-size: 12px; }
  .status {
    position: absolute;
    top: 10px;
    right: 10px;
    bottom: auto;
    width: 24px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    font-size: 14px;
    color: #7B919A;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(11, 59, 72, 0.12);
  }
  .status.done { color: #27AE60; font-weight: 700; }
}
@media screen and (min-width: 1100px) {
  .container { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .cover { height: 180px; }
}
</style>
