<template>
  <view class="notice-page">
    <view class="header">
      <view class="header-text">
        <text class="page-title">健康提醒</text>
        <text class="page-sub">服药、复诊与体检提醒，请及时查看</text>
      </view>
      <text class="header-count" v-if="notices.length">{{ notices.length }} 条</text>
    </view>

    <view class="container">
      <view class="notice-card" v-for="n in notices" :key="n.id" @click="goDetail(n.id)">
        <view class="notice-top">
          <text class="type-tag" :class="noticeTypeClass(n.type)">{{ n.type }}</text>
          <text class="date">{{ n.publishDate }}</text>
        </view>
        <view class="notice-body">
          <text class="title">{{ n.title }}</text>
          <text class="preview">{{ n.content }}</text>
        </view>
        <view class="notice-foot">
          <text class="read-more">查看详情 ›</text>
        </view>
      </view>

      <view class="empty" v-if="!notices.length">
        <text class="empty-icon">🔔</text>
        <text class="empty-text">暂无健康提醒</text>
        <text class="empty-sub">家庭医生发布提醒后会显示在这里</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getNotices } from '../../utils/api.js'
import { noticeTypeClass } from '../../utils/style.js'

const notices = ref([])

function loadData() {
  getNotices().then(d => { notices.value = d }).catch(() => uni.showToast({ title: '加载失败', icon: 'none' }))
}

function goDetail(id) { uni.navigateTo({ url: '/pages/notice/detail?id=' + id }) }

onShow(() => loadData())
</script>

<style scoped>
.notice-page { min-height: 100vh; padding-bottom: 40rpx; }
.header { margin: 20rpx 24rpx 0; padding: 28rpx 24rpx; border-radius: 24rpx; background: linear-gradient(135deg, #12A8A0, #1D7EC9); display: flex; align-items: center; justify-content: space-between; gap: 20rpx; box-sizing: border-box; }
.header-text { min-width: 0; }
.page-title { font-size: 36rpx; font-weight: 700; color: #fff; display: block; }
.page-sub { font-size: 23rpx; color: rgba(255,255,255,0.82); margin-top: 8rpx; display: block; }
.header-count { flex-shrink: 0; font-size: 22rpx; color: #fff; background: rgba(255,255,255,0.22); padding: 6rpx 16rpx; border-radius: 20rpx; }

.container { padding: 0 24rpx; margin-top: 20rpx; }
.notice-card { background: #fff; border-radius: 24rpx; padding: 28rpx; margin-bottom: 20rpx; box-shadow: 0 8rpx 28rpx rgba(18,168,160,0.1); box-sizing: border-box; }
.notice-card:last-child { margin-bottom: 0; }
.notice-top { display: flex; align-items: center; justify-content: flex-end; gap: 12rpx; }
.type-tag { font-size: 20rpx; padding: 6rpx 16rpx; border-radius: 10rpx; background: #E6F5F4; color: #12A8A0; }
.type-tag.type-med { background: #FFF3E0; color: #F2994A; }
.type-tag.type-visit { background: #E8F5E9; color: #27AE60; }
.type-tag.type-exam { background: #E6F5F4; color: #12A8A0; }
.date { font-size: 21rpx; color: #9AAAB2; }
.notice-body { display: block; }
.title { font-size: 31rpx; font-weight: 700; color: #24414A; margin-top: 16rpx; display: block; line-height: 1.45; }
.preview { font-size: 24rpx; color: #888; line-height: 1.75; margin-top: 10rpx; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.notice-foot { display: flex; justify-content: flex-end; margin-top: 14rpx; }
.read-more { font-size: 23rpx; color: #12A8A0; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 140rpx 0; }
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-top: 16rpx; }
.empty-sub { font-size: 22rpx; color: #bbb; margin-top: 8rpx; }

@media screen and (min-width: 750px) {
  .notice-page { padding-bottom: 32px; }
  .header { margin: 18px 0 0; padding: 18px 24px; border-radius: 16px; }
  .page-title { font-size: 20px; }
  .page-sub { margin-top: 5px; font-size: 13px; }
  .header-count { font-size: 12px; padding: 4px 12px; }
  .container { padding: 0; margin-top: 18px; }
  .notice-card { padding: 20px; border-radius: 16px; margin-bottom: 16px; }
  .notice-top { gap: 10px; }
  .type-tag { font-size: 12px; padding: 4px 10px; }
  .date { font-size: 12px; }
  .title { margin-top: 10px; max-width: 820px; font-size: 18px; }
  .preview { margin-top: 8px; max-width: 780px; font-size: 14px; line-height: 1.8; }
  .notice-foot { margin-top: 10px; }
  .read-more { font-size: 13px; }
}
</style>
