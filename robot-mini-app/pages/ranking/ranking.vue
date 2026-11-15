<template>
  <view class="rank-page">
    <view class="header">
      <view class="header-top">
        <image class="header-logo" src="/static/image/logo.jpg" mode="aspectFill" />
        <view class="header-text">
          <text class="page-title">社区健康积分榜</text>
          <text class="page-sub">{{ className }} · 坚持打卡，健康积分按月累计</text>
        </view>
        <view class="header-stats">
          <view class="h-stat">
            <text class="h-val">{{ ranking.length }}</text>
            <text class="h-lbl">参评居民</text>
          </view>
          <view class="h-divider"></view>
          <view class="h-stat">
            <text class="h-val">{{ ranking[0]?.totalPoints || 0 }}</text>
            <text class="h-lbl">最高积分</text>
          </view>
        </view>
      </view>
      <view class="my-rank" v-if="myRank">
        <view class="my-left">
          <text class="my-rank-no">{{ myRank.rank }}</text>
          <view>
            <text class="my-name">我的排名</text>
            <text class="my-points">{{ myRank.totalPoints }} 健康积分</text>
          </view>
        </view>
        <text class="my-days">连续 {{ myRank.continuousDays || 0 }} 天</text>
      </view>
    </view>

    <view class="container">
      <!-- 前三名 -->
      <view class="podium">
        <view class="podium-item second" v-if="top3[1]" @click="showUser(top3[1])">
          <view class="avatar-wrap">
            <image v-if="hasAvatar(top3[1])" class="avatar" :src="avatarOf(top3[1])" mode="aspectFill" />
            <view v-else class="avatar avatar-text" :style="{ background: avatarColor(top3[1].nickname) }">{{ avatarInitial(top3[1].nickname) }}</view>
            <view class="medal silver">2</view>
          </view>
          <text class="p-name">{{ top3[1].nickname }}</text>
          <text class="p-points">{{ top3[1].totalPoints }}</text>
        </view>
        <view class="podium-item first" v-if="top3[0]" @click="showUser(top3[0])">
          <text class="crown">👑</text>
          <view class="avatar-wrap">
            <image v-if="hasAvatar(top3[0])" class="avatar big" :src="avatarOf(top3[0])" mode="aspectFill" />
            <view v-else class="avatar big avatar-text" :style="{ background: avatarColor(top3[0].nickname) }">{{ avatarInitial(top3[0].nickname) }}</view>
            <view class="medal gold">1</view>
          </view>
          <text class="p-name">{{ top3[0].nickname }}</text>
          <text class="p-points">{{ top3[0].totalPoints }}</text>
        </view>
        <view class="podium-item third" v-if="top3[2]" @click="showUser(top3[2])">
          <view class="avatar-wrap">
            <image v-if="hasAvatar(top3[2])" class="avatar" :src="avatarOf(top3[2])" mode="aspectFill" />
            <view v-else class="avatar avatar-text" :style="{ background: avatarColor(top3[2].nickname) }">{{ avatarInitial(top3[2].nickname) }}</view>
            <view class="medal bronze">3</view>
          </view>
          <text class="p-name">{{ top3[2].nickname }}</text>
          <text class="p-points">{{ top3[2].totalPoints }}</text>
        </view>
      </view>

      <!-- 完整榜单 -->
      <view class="card list-card">
        <view class="list-head">
          <text class="section-title">全部排行</text>
          <text class="list-tip">{{ ranking.length }} 位居民</text>
        </view>
        <view class="rank-item" v-for="item in ranking" :key="item.id" :class="{ me: item.id === myId }">
          <text class="rank-no" :class="'top' + item.rank">{{ item.rank }}</text>
          <image v-if="hasAvatar(item)" class="rank-avatar" :src="avatarOf(item)" mode="aspectFill" />
          <view v-else class="rank-avatar avatar-text" :style="{ background: avatarColor(item.nickname) }">{{ avatarInitial(item.nickname) }}</view>
          <view class="rank-info">
            <text class="rank-name">{{ item.nickname }}<text class="tag" v-if="item.chronicTags && item.chronicTags !== '无'">{{ item.chronicTags }}</text></text>
            <text class="rank-meta">打卡 {{ item.totalCheckins }} 次 · 连续 {{ item.continuousDays }} 天</text>
          </view>
          <text class="rank-points">{{ item.totalPoints }}</text>
        </view>
        <view class="empty" v-if="!ranking.length">
          <text class="empty-icon">🏅</text>
          <text class="empty-text">本社区暂无排行数据</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { getClassRanking, getCurrentUser, checkLogin, resolveAvatar, avatarInitial, avatarColor } from '../../utils/api.js'

const ranking = ref([])
const user = ref(getCurrentUser())

const myId = computed(() => user.value?.id)
const className = computed(() => user.value?.className || '本社区')
const top3 = computed(() => ranking.value.slice(0, 3))
const myRank = computed(() => ranking.value.find(u => u.id === myId.value))

function avatarOf(u) {
  return resolveAvatar(u.avatar)
}
function hasAvatar(u) { return !!resolveAvatar(u.avatar) }

function showUser(u) {
  uni.showModal({ title: u.nickname, content: `健康积分：${u.totalPoints}\n连续打卡：${u.continuousDays} 天\n累计打卡：${u.totalCheckins} 次`, showCancel: false })
}

function loadData() {
  if (!checkLogin()) return Promise.resolve()
  user.value = getCurrentUser()
  return getClassRanking(user.value.className).then(d => { ranking.value = d })
}

onShow(() => loadData())
onPullDownRefresh(() => loadData().finally(() => uni.stopPullDownRefresh()))
</script>

<style scoped>
.rank-page { min-height: 100vh; padding-bottom: 40rpx; }
.header {
  margin: 20rpx 24rpx 0;
  padding: 24rpx 24rpx 20rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #12A8A0, #1D7EC9);
  box-shadow: 0 10rpx 28rpx rgba(7, 38, 48, 0.16);
}
.header-top { display: flex; align-items: center; gap: 16rpx; }
.header-logo { width: 68rpx; height: 68rpx; border-radius: 18rpx; border: 2rpx solid rgba(255,255,255,0.5); flex-shrink: 0; }
.header-text { flex: 1; min-width: 0; }
.page-title { font-size: 34rpx; font-weight: 700; color: #fff; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.page-sub { font-size: 20rpx; color: rgba(255,255,255,0.82); margin-top: 6rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header-stats { display: flex; align-items: center; gap: 16rpx; flex-shrink: 0; }
.h-stat { text-align: center; }
.h-val { font-size: 30rpx; font-weight: 700; color: #fff; display: block; }
.h-lbl { font-size: 16rpx; color: rgba(255,255,255,0.78); margin-top: 2rpx; display: block; }
.h-divider { width: 1rpx; height: 34rpx; background: rgba(255,255,255,0.28); }
.my-rank { display: flex; justify-content: space-between; align-items: center; margin-top: 18rpx; background: rgba(255,255,255,0.18); border-radius: 20rpx; padding: 18rpx 24rpx; }
.my-left { display: flex; align-items: center; gap: 18rpx; }
.my-rank-no { font-size: 42rpx; font-weight: 700; color: #fff; }
.my-name { font-size: 24rpx; color: rgba(255,255,255,0.8); display: block; }
.my-points { font-size: 28rpx; color: #fff; font-weight: 600; display: block; margin-top: 2rpx; }
.my-days { font-size: 22rpx; color: rgba(255,255,255,0.85); }

.container { padding: 0 24rpx; margin-top: 16rpx; }
.podium { display: flex; align-items: flex-end; justify-content: center; gap: 16rpx; background: #fff; border-radius: 24rpx; padding: 32rpx 20rpx 24rpx; box-shadow: 0 10rpx 32rpx rgba(18,168,160,0.14); }
.podium-item { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; }
.podium-item.first { margin-bottom: 18rpx; }
.avatar-wrap { position: relative; }
.avatar { width: 110rpx; height: 110rpx; border-radius: 50%; border: 4rpx solid #D7EFF0; }
.avatar.big { width: 140rpx; height: 140rpx; border-color: #F2C94C; }
.medal { position: absolute; bottom: -6rpx; right: -6rpx; width: 40rpx; height: 40rpx; border-radius: 50%; color: #fff; font-size: 22rpx; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.medal.gold { background: linear-gradient(135deg, #F2C94C, #F2994A); }
.medal.silver { background: linear-gradient(135deg, #BDBDBD, #9E9E9E); }
.medal.bronze { background: linear-gradient(135deg, #E0A96D, #C0824A); }
.avatar-text { display: flex; align-items: center; justify-content: center; color: #fff; font-size: 40rpx; font-weight: 700; }
.avatar-text.big { font-size: 52rpx; }
.rank-avatar.avatar-text { font-size: 30rpx; }
.crown { position: absolute; top: -26rpx; font-size: 34rpx; z-index: 3; }
.p-name { font-size: 26rpx; color: #24414A; margin-top: 14rpx; font-weight: 600; }
.p-points { font-size: 24rpx; color: #12A8A0; font-weight: 700; margin-top: 4rpx; }

.list-card { background: #fff; border-radius: 24rpx; padding: 28rpx; margin-top: 24rpx; box-shadow: 0 8rpx 28rpx rgba(18,168,160,0.08); }
.list-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.section-title { font-size: 32rpx; font-weight: 700; color: #0B3B48; }
.list-tip { font-size: 22rpx; color: #999; }
.rank-item { display: flex; align-items: center; gap: 18rpx; padding: 20rpx 0; border-bottom: 1rpx solid #F5F5F5; }
.rank-item:last-child { border-bottom: none; }
.rank-item.me { background: #F0FAF9; border-radius: 16rpx; padding: 20rpx 12rpx; }
.rank-no { width: 46rpx; text-align: center; font-size: 28rpx; color: #999; font-weight: 700; }
.rank-no.top1 { color: #F2C94C; }
.rank-no.top2 { color: #9E9E9E; }
.rank-no.top3 { color: #C0824A; }
.rank-avatar { width: 72rpx; height: 72rpx; border-radius: 50%; background: #E6F5F4; }
.rank-info { flex: 1; min-width: 0; }
.rank-name { font-size: 28rpx; color: #24414A; font-weight: 600; display: flex; align-items: center; gap: 8rpx; }
.rank-name .tag { font-size: 18rpx; color: #12A8A0; background: #E6F5F4; padding: 2rpx 10rpx; border-radius: 8rpx; font-weight: 400; }
.rank-meta { font-size: 21rpx; color: #999; margin-top: 4rpx; display: block; }
.rank-points { font-size: 30rpx; color: #12A8A0; font-weight: 700; }
.empty { display: flex; flex-direction: column; align-items: center; padding: 80rpx 0; }
.empty-icon { font-size: 70rpx; }
.empty-text { font-size: 24rpx; color: #aaa; margin-top: 12rpx; }

/* 宽屏：领奖台加高，全部排行两列排布 */
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
  .my-rank { margin-top: 16px; border-radius: 12px; padding: 14px 20px; }
  .my-rank-no { font-size: 30px; }
  .my-name { font-size: 13px; }
  .my-points { font-size: 16px; }
  .my-days { font-size: 13px; }
  .container { padding: 0; margin-top: 18px; }
  .podium { border-radius: 16px; padding: 26px 20px 20px; gap: 24px; }
  .avatar { width: 76px; height: 76px; border-width: 3px; }
  .avatar.big { width: 96px; height: 96px; }
  .medal { width: 24px; height: 24px; font-size: 13px; }
  .crown { font-size: 22px; top: -18px; }
  .p-name { font-size: 15px; margin-top: 10px; }
  .p-points { font-size: 14px; }
  .list-card {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 26px;
    margin-top: 18px;
    padding: 20px 24px;
    border-radius: 16px;
  }
  .list-head { grid-column: 1 / -1; margin-bottom: 6px; }
  .empty { grid-column: 1 / -1; padding: 48px 0; }
  .section-title { font-size: 17px; }
  .list-tip { font-size: 12px; }
  .rank-item { padding: 13px 8px; gap: 14px; border-bottom: 1px solid #F3F7F8; }
  .rank-item.me { padding: 13px 8px; border-radius: 10px; }
  .rank-no { width: 28px; font-size: 15px; }
  .rank-avatar { width: 40px; height: 40px; }
  .avatar-text { font-size: 26px; }
  .avatar-text.big { font-size: 32px; }
  .rank-avatar.avatar-text { font-size: 16px; }
  .rank-name { font-size: 15px; gap: 6px; }
  .rank-name .tag { font-size: 11px; padding: 1px 7px; border-radius: 6px; }
  .rank-meta { font-size: 12px; margin-top: 2px; }
  .rank-points { font-size: 18px; }
  .empty-text { font-size: 13px; }
}
</style>
