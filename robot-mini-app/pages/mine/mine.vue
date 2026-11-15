<template>
  <view class="mine-page">
    <view class="header">
      <view class="header-top">
        <image class="header-logo" src="/static/image/logo.jpg" mode="aspectFill" />
        <view class="header-text">
          <text class="page-title">我的</text>
          <text class="page-sub">{{ user?.className || '本社区' }} · 个人健康档案与打卡记录</text>
        </view>
        <view class="header-stats">
          <view class="h-stat">
            <text class="h-val">{{ user?.totalCheckins || 0 }}</text>
            <text class="h-lbl">累计打卡</text>
          </view>
          <view class="h-divider"></view>
          <view class="h-stat">
            <text class="h-val">{{ user?.continuousDays || 0 }}</text>
            <text class="h-lbl">连续天数</text>
          </view>
        </view>
      </view>
      <view class="user-row" @click="pickAvatar">
        <image v-if="hasAvatar" class="avatar" :src="avatarUrl" mode="aspectFill" />
        <view v-else class="avatar avatar-text" :style="{ background: avatarColor(user?.nickname) }">{{ avatarInitial(user?.nickname) }}</view>
        <view class="user-info">
          <text class="name">{{ user?.nickname || '未登录' }}</text>
          <text class="meta">{{ user?.className || '-' }} · {{ user?.gender || '-' }} · {{ user?.age || '-' }}岁</text>
          <text class="phone">{{ user?.phone || '请先登录' }}</text>
        </view>
        <text class="edit-tip">更换头像</text>
      </view>
      <view class="point-card">
        <view>
          <text class="point-label">健康积分</text>
          <text class="point-val">{{ user?.totalPoints || 0 }}</text>
        </view>
        <view class="point-right">
          <text class="point-sub">慢病标签</text>
          <text class="chronic">{{ user?.chronicTags || '无' }}</text>
        </view>
      </view>
    </view>

    <view class="container">
      <view class="card">
        <view class="menu-item" v-for="m in menus" :key="m.label" @click="m.action">
          <view class="menu-left">
            <view class="menu-icon" :style="{ background: m.bg }">{{ m.icon }}</view>
            <text class="menu-label">{{ m.label }}</text>
          </view>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="card">
        <view class="card-head">
          <text class="section-title">最近健康记录</text>
          <text class="more" @click="goCheckin">去打卡 ›</text>
        </view>
        <view class="record-item" v-for="r in recentRecords" :key="r.id">
          <view class="record-left">
            <text class="record-date">{{ r.checkDate }}</text>
            <text class="record-time">{{ r.recordTime }}</text>
          </view>
          <view class="record-metrics">
            <text class="metric">血压 {{ r.systolic || '-' }}/{{ r.diastolic || '-' }}</text>
            <text class="metric">血糖 {{ r.bloodSugar || '-' }}</text>
            <text class="metric">体重 {{ r.weight || '-' }}kg</text>
          </view>
          <text class="record-points">+{{ r.points }}</text>
        </view>
        <view class="empty" v-if="!recentRecords.length">
          <text class="empty-icon">📋</text>
          <text class="empty-text">暂无健康记录，去完成第一次打卡吧</text>
        </view>
      </view>

      <view class="logout-btn" @click="handleLogout">退出登录</view>
      <text class="version">社区健康守护 v1.0.0</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, getUserCheckins, getUserById, updateUser, logout, checkLogin, resolveAvatar, avatarInitial, avatarColor } from '../../utils/api.js'

const user = ref(getCurrentUser())
const checkins = ref([])

// 后端头像为 /image/xxx.jpg，H5 静态资源在 /static/image 下
const avatarUrl = computed(() => resolveAvatar(user.value?.avatar))
const hasAvatar = computed(() => !!avatarUrl.value)

const todayPoints = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return checkins.value.filter(c => c.checkDate === today).reduce((s, c) => s + (c.points || 0), 0)
})

const recentRecords = computed(() => [...checkins.value].sort((a, b) => b.checkDate.localeCompare(a.checkDate)).slice(0, 5))

const menus = [
  { icon: '🩺', label: 'AI 健康顾问', bg: 'linear-gradient(135deg,#12A8A0,#2D9CDB)', action: () => uni.navigateTo({ url: '/pages/chat/chat' }) },
  { icon: '✅', label: '健康打卡', bg: 'linear-gradient(135deg,#11998e,#38ef7d)', action: () => uni.switchTab({ url: '/pages/checkin/checkin' }) },
  { icon: '📖', label: '健康科普', bg: 'linear-gradient(135deg,#56CCF2,#2F80ED)', action: () => uni.switchTab({ url: '/pages/knowledge/list' }) },
  { icon: '🏅', label: '社区积分榜', bg: 'linear-gradient(135deg,#F2994A,#F2C94C)', action: () => uni.switchTab({ url: '/pages/ranking/ranking' }) },
  { icon: '🎁', label: '积分兑换', bg: 'linear-gradient(135deg,#9B51E0,#56CCF2)', action: () => uni.navigateTo({ url: '/pages/mall/mall' }) },
  { icon: '💊', label: '社区药库', bg: 'linear-gradient(135deg,#27AE60,#12A8A0)', action: () => uni.navigateTo({ url: '/pages/drug/list' }) },
  { icon: '📦', label: '药品订单', bg: 'linear-gradient(135deg,#2D9CDB,#9B51E0)', action: () => uni.navigateTo({ url: '/pages/drug/orders' }) },
  { icon: '🔔', label: '健康提醒', bg: 'linear-gradient(135deg,#EB5757,#F2994A)', action: () => uni.navigateTo({ url: '/pages/notice/list' }) }
]

async function refreshUser() {
  const u = getCurrentUser()
  if (!u?.id) return
  try {
    const latest = await getUserById(u.id)
    uni.setStorageSync('userInfo', latest)
    user.value = latest
    checkins.value = await getUserCheckins(u.id)
  } catch (e) {
    uni.showToast({ title: '数据刷新失败', icon: 'none' })
  }
}

function goCheckin() { uni.switchTab({ url: '/pages/checkin/checkin' }) }

function pickAvatar() {
  const avatars = ['', '/static/image/logo1.jpg', '/static/image/logo2.jpg', '/static/image/logo3.jpg']
  uni.showActionSheet({
    itemList: ['使用默认头像', '头像 1', '头像 2', '头像 3'],
    success: async (res) => {
      const avatar = avatars[res.tapIndex]
      const updated = await updateUser(user.value.id, { ...user.value, avatar })
      uni.setStorageSync('userInfo', updated)
      user.value = updated
      uni.showToast({ title: '头像已更新', icon: 'success' })
    }
  })
}

function handleLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    success: (res) => {
      if (res.confirm) {
        logout()
        uni.reLaunch({ url: '/pages/login/login' })
      }
    }
  })
}

onShow(() => {
  if (!checkLogin()) return
  refreshUser()
})
</script>

<style scoped>
.mine-page { min-height: 100vh; padding-bottom: 40rpx; }
.header {
  margin: 20rpx 24rpx 0;
  padding: 24rpx 24rpx 26rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #12A8A0, #1D7EC9);
  box-shadow: 0 10rpx 28rpx rgba(7, 38, 48, 0.16);
}
.header-top { display: flex; align-items: center; gap: 16rpx; margin-bottom: 22rpx; }
.header-logo { width: 68rpx; height: 68rpx; border-radius: 18rpx; border: 2rpx solid rgba(255,255,255,0.5); flex-shrink: 0; }
.header-text { flex: 1; min-width: 0; }
.page-title { font-size: 34rpx; font-weight: 700; color: #fff; display: block; }
.page-sub { font-size: 20rpx; color: rgba(255,255,255,0.82); margin-top: 6rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header-stats { display: flex; align-items: center; gap: 16rpx; flex-shrink: 0; }
.h-stat { text-align: center; }
.h-val { font-size: 30rpx; font-weight: 700; color: #fff; display: block; }
.h-lbl { font-size: 16rpx; color: rgba(255,255,255,0.78); margin-top: 2rpx; display: block; }
.h-divider { width: 1rpx; height: 34rpx; background: rgba(255,255,255,0.28); }
.user-row { display: flex; align-items: center; gap: 24rpx; }
.avatar { width: 124rpx; height: 124rpx; border-radius: 50%; border: 4rpx solid rgba(255,255,255,0.6); background: #fff; }
.avatar-text { display: flex; align-items: center; justify-content: center; color: #fff; font-size: 52rpx; font-weight: 700; }
.user-info { flex: 1; }
.name { font-size: 38rpx; font-weight: 700; color: #fff; display: block; }
.meta { font-size: 24rpx; color: rgba(255,255,255,0.85); margin-top: 6rpx; display: block; }
.phone { font-size: 22rpx; color: rgba(255,255,255,0.7); margin-top: 4rpx; display: block; }
.edit-tip { font-size: 20rpx; color: rgba(255,255,255,0.8); border: 1rpx solid rgba(255,255,255,0.5); padding: 6rpx 14rpx; border-radius: 20rpx; }

.point-card { display: flex; justify-content: space-between; align-items: center; margin-top: 32rpx; background: rgba(255,255,255,0.16); border-radius: 24rpx; padding: 24rpx 28rpx; }
.point-label { font-size: 22rpx; color: rgba(255,255,255,0.8); display: block; }
.point-val { font-size: 48rpx; font-weight: 700; color: #fff; }
.point-right { text-align: right; }
.point-sub { font-size: 22rpx; color: rgba(255,255,255,0.8); display: block; }
.chronic { font-size: 24rpx; color: #fff; margin-top: 6rpx; display: block; }

.container { padding: 0 24rpx; margin-top: 16rpx; }

.card { background: #fff; border-radius: 24rpx; padding: 12rpx 28rpx; margin-bottom: 24rpx; box-shadow: 0 8rpx 28rpx rgba(18,168,160,0.08); }
.card-head { display: flex; justify-content: space-between; align-items: center; padding: 18rpx 0; }
.section-title { font-size: 30rpx; font-weight: 700; color: #0B3B48; }
.more { font-size: 24rpx; color: #12A8A0; }
.menu-item { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 0; border-bottom: 1rpx solid #F5F5F5; }
.menu-item:last-child { border-bottom: none; }
.menu-left { display: flex; align-items: center; gap: 20rpx; }
.menu-icon { width: 64rpx; height: 64rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; font-size: 32rpx; }
.menu-label { font-size: 28rpx; color: #24414A; }
.arrow { font-size: 36rpx; color: #ccc; }

.record-item { display: flex; align-items: center; padding: 18rpx 0; border-bottom: 1rpx solid #F5F5F5; gap: 16rpx; }
.record-item:last-child { border-bottom: none; }
.record-left { display: flex; flex-direction: column; }
.record-date { font-size: 24rpx; color: #24414A; font-weight: 600; }
.record-time { font-size: 20rpx; color: #bbb; margin-top: 2rpx; }
.record-metrics { flex: 1; display: flex; flex-wrap: wrap; gap: 10rpx; }
.metric { font-size: 20rpx; color: #12A8A0; background: #E6F5F4; padding: 4rpx 12rpx; border-radius: 8rpx; }
.record-points { font-size: 26rpx; color: #F2994A; font-weight: 700; }
.empty { display: flex; flex-direction: column; align-items: center; padding: 50rpx 0; }
.empty-icon { font-size: 60rpx; }
.empty-text { font-size: 24rpx; color: #aaa; margin-top: 10rpx; }

.logout-btn { background: #fff; border-radius: 24rpx; padding: 26rpx 0; text-align: center; font-size: 28rpx; color: #EB5757; box-shadow: 0 8rpx 28rpx rgba(18,168,160,0.08); }
.version { display: block; text-align: center; font-size: 20rpx; color: #bbb; margin-top: 24rpx; }

/* 宽屏：资料卡横向铺开，功能入口与最近记录并排 */
@media screen and (min-width: 750px) {
  .header { margin: 18px 0 0; padding: 20px 24px 22px; border-radius: 16px; }
  .header-top { gap: 16px; margin-bottom: 18px; }
  .header-logo { width: 46px; height: 46px; border-radius: 12px; border-width: 2px; }
  .page-title { font-size: 24px; }
  .page-sub { font-size: 13px; margin-top: 4px; }
  .h-val { font-size: 22px; }
  .h-lbl { font-size: 12px; }
  .h-divider { height: 26px; }
  .header-stats { gap: 22px; }
  .user-row { gap: 18px; }
  .avatar { width: 72px; height: 72px; border-width: 3px; }
  .avatar-text { font-size: 28px; }
  .name { font-size: 22px; }
  .meta { font-size: 13px; margin-top: 4px; }
  .phone { font-size: 12px; margin-top: 2px; }
  .edit-tip { font-size: 12px; padding: 4px 12px; border-radius: 999px; }
  .point-card { margin-top: 20px; border-radius: 14px; padding: 16px 22px; }
  .point-label { font-size: 12px; }
  .point-val { font-size: 30px; }
  .point-sub { font-size: 12px; }
  .chronic { font-size: 14px; margin-top: 4px; }

  .container {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    align-items: start;
    padding: 0;
    margin-top: 18px;
  }
  .card { margin-bottom: 0; border-radius: 14px; padding: 8px 20px; }
  .card-head { padding: 12px 0; }
  .section-title { font-size: 16px; }
  .more { font-size: 13px; }
  .menu-item { padding: 14px 0; }
  .menu-left { gap: 14px; }
  .menu-icon { width: 40px; height: 40px; border-radius: 12px; font-size: 19px; }
  .menu-label { font-size: 15px; }
  .arrow { font-size: 20px; }
  .record-item { padding: 12px 0; gap: 12px; }
  .record-date { font-size: 13px; }
  .record-time { font-size: 11px; }
  .record-metrics { gap: 6px; }
  .metric { font-size: 11px; padding: 2px 8px; border-radius: 6px; }
  .record-points { font-size: 15px; }
  .empty { padding: 32px 0; }
  .empty-text { font-size: 13px; }
  .logout-btn {
    grid-column: 1 / -1;
    justify-self: center;
    width: 100%;
    max-width: 280px;
    border-radius: 14px;
    padding: 14px 0;
    font-size: 14px;
  }
  .version { grid-column: 1 / -1; margin-top: 0; font-size: 11px; }
}
</style>
