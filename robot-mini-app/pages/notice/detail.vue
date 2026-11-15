<template>
  <view class="detail-page" v-if="notice">
    <view class="header">
      <view class="header-top">
        <view class="back-btn" @click="goBack">‹</view>
        <view class="header-text">
          <text class="page-title">{{ notice.title }}</text>
          <text class="page-sub">发布于 {{ notice.publishDate }}</text>
        </view>
        <view class="header-link" @click="goNoticeList">全部提醒 <text>›</text></view>
      </view>
    </view>

    <view class="container">
      <view class="card content-card">
        <view class="card-head">
          <text class="section-title">公告正文</text>
          <text class="type-tag" :class="noticeTypeClass(notice.type)">{{ notice.type }}</text>
        </view>
        <text class="content">{{ notice.content }}</text>
      </view>

      <view class="tips-card">
        <text class="tips-title">温馨提示</text>
        <text class="tips-line">· 用药调整请先咨询家庭医生，不要自行停药或加量</text>
        <text class="tips-line">· 出现胸闷、口角歪斜、单侧肢体无力，请立即拨打 120</text>
        <text class="tips-line">· 体检请携带身份证、医保卡并保持空腹</text>
      </view>

      <view class="btn-primary contact-btn" @click="callDoctor">联系家庭医生</view>

      <view class="card related-card" v-if="related.length">
        <view class="card-head">
          <text class="section-title">其他健康提醒</text>
          <text class="more-link" @click="goNoticeList">查看全部 ›</text>
        </view>
        <view class="related-item" v-for="item in related" :key="item.id" @click="goNotice(item.id)">
          <view class="related-main">
            <text class="related-title">{{ item.title }}</text>
            <text class="related-date">{{ item.publishDate }}</text>
          </view>
          <text class="related-arrow">›</text>
        </view>
      </view>

      <text class="footer-tip">社区健康守护 · 与你一起关注日常健康</text>
    </view>
  </view>
  <view class="loading" v-else><text>加载中...</text></view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getNotices } from '../../utils/api.js'
import { noticeTypeClass } from '../../utils/style.js'

const notice = ref(null)
const related = ref([])

function loadDetail(id) {
  getNotices().then(list => {
    const current = list.find(n => String(n.id) === String(id)) || list[0]
    notice.value = current
    related.value = current ? list.filter(n => n.id !== current.id).slice(0, 3) : []
  }).catch(() => uni.showToast({ title: '加载失败', icon: 'none' }))
}

function callDoctor() {
  uni.showModal({
    title: '联系家庭医生',
    content: '社区卫生服务中心：0571-8888 1200\n服务时间：周一至周五 8:00-17:00',
    confirmText: '拨打电话',
    success: (res) => {
      if (res.confirm) uni.makePhoneCall({ phoneNumber: '057188881200', fail: () => {} })
    }
  })
}

function goBack() { uni.navigateBack() }
function goNoticeList() { uni.navigateTo({ url: '/pages/notice/list' }) }
function goNotice(id) { uni.navigateTo({ url: '/pages/notice/detail?id=' + id }) }

onLoad((options) => loadDetail(options?.id || 1))
</script>

<style scoped>
.detail-page { min-height: 100vh; padding-bottom: 40rpx; }
.header { margin: 20rpx 24rpx 0; padding: 28rpx 24rpx; border-radius: 24rpx; background: linear-gradient(135deg, #12A8A0, #1D7EC9); box-sizing: border-box; }
.header-top { display: flex; align-items: center; gap: 20rpx; }
.back-btn { width: 60rpx; height: 60rpx; flex: 0 0 60rpx; border-radius: 50%; background: rgba(255,255,255,0.22); color: #fff; font-size: 42rpx; display: flex; align-items: center; justify-content: center; padding-bottom: 6rpx; box-sizing: border-box; }
.header-text { flex: 1; min-width: 0; }
.page-title { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; font-size: 32rpx; font-weight: 700; color: #fff; line-height: 1.4; }
.page-sub { display: block; font-size: 22rpx; color: rgba(255,255,255,0.82); margin-top: 8rpx; }
.header-link { flex-shrink: 0; color: rgba(255,255,255,0.92); font-size: 23rpx; white-space: nowrap; }

.container { padding: 0 24rpx; margin-top: 24rpx; }
.card { background: #fff; border-radius: 24rpx; padding: 28rpx; margin-bottom: 24rpx; box-shadow: 0 8rpx 28rpx rgba(18,168,160,0.1); box-sizing: border-box; }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-bottom: 20rpx; }
.section-title { font-size: 30rpx; font-weight: 700; color: #0B3B48; }
.type-tag { display: inline-block; flex-shrink: 0; font-size: 22rpx; padding: 6rpx 18rpx; border-radius: 20rpx; background: rgba(18,168,160,0.1); color: #12A8A0; }
.type-tag.type-med { background: #FFF3E0; color: #F2994A; }
.type-tag.type-visit { background: #E8F5E9; color: #27AE60; }
.type-tag.type-exam { background: #E6F5F4; color: #12A8A0; }
.content { display: block; font-size: 29rpx; color: #3A4A55; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; }
.tips-card { background: linear-gradient(135deg, #E6F5F4, #EAF3FB); border-radius: 24rpx; padding: 28rpx; margin-bottom: 28rpx; box-sizing: border-box; }
.tips-title { font-size: 28rpx; font-weight: 700; color: #0B7C8A; display: block; margin-bottom: 10rpx; }
.tips-line { font-size: 23rpx; color: #567; line-height: 1.9; display: block; }
.contact-btn { max-width: 520rpx; margin: 0 auto 32rpx; box-sizing: border-box; }
.more-link { color: #12A8A0; font-size: 23rpx; white-space: nowrap; }
.related-item { display: flex; align-items: center; gap: 20rpx; padding: 20rpx 0; border-bottom: 1rpx solid #EDF2F3; }
.related-item:last-child { border-bottom: none; padding-bottom: 0; }
.related-main { flex: 1; min-width: 0; }
.related-title { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 27rpx; color: #3A4A55; }
.related-date { display: block; margin-top: 8rpx; font-size: 22rpx; color: #9AAAB2; }
.related-arrow { color: #B4C2C8; font-size: 34rpx; }
.footer-tip { display: block; padding: 4rpx 0 16rpx; text-align: center; color: #9AAAB2; font-size: 22rpx; }
.loading { display: flex; align-items: center; justify-content: center; height: 60vh; color: #999; font-size: 26rpx; }

@media screen and (min-width: 750px) {
  .detail-page { padding-bottom: 32px; }
  .header { margin: 18px 0 0; padding: 18px 24px; border-radius: 16px; }
  .header-top { gap: 16px; }
  .back-btn { width: 40px; height: 40px; flex-basis: 40px; font-size: 30px; padding-bottom: 4px; }
  .page-title { font-size: 21px; -webkit-line-clamp: 1; }
  .page-sub { margin-top: 5px; font-size: 13px; }
  .header-link { font-size: 14px; }
  .container { padding: 0; margin-top: 18px; }
  .card { padding: 20px; border-radius: 16px; margin-bottom: 16px; }
  .card-head { margin-bottom: 12px; }
  .section-title { font-size: 17px; }
  .type-tag { font-size: 12px; padding: 4px 12px; }
  .content { max-width: 780px; font-size: 16px; line-height: 1.8; }
  .tips-card { padding: 20px; border-radius: 16px; margin-bottom: 20px; }
  .tips-title { font-size: 16px; margin-bottom: 8px; }
  .tips-line { font-size: 14px; line-height: 1.8; }
  .contact-btn { max-width: 320px; margin: 0 auto 24px; }
  .more-link { font-size: 13px; }
  .related-item { padding: 14px 0; }
  .related-title { font-size: 15px; }
  .related-date { margin-top: 5px; font-size: 12px; }
  .related-arrow { font-size: 24px; }
  .footer-tip { padding-bottom: 8px; font-size: 13px; }
}
</style>
