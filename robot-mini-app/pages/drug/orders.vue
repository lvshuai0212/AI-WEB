<template>
  <view class="orders-page">
    <view class="header">
      <view class="header-top">
        <view class="back-btn" @click="goBack">‹</view>
        <view class="header-text">
          <text class="page-title">药品订单</text>
          <text class="page-sub">社区药房配送 · 查看订单状态</text>
        </view>
        <view class="header-link" @click="goLibrary">去药库 ›</view>
      </view>
    </view>

    <view class="container">
      <view class="section-head">
        <text class="section-title">订单列表</text>
        <text class="tip">共 {{ myOrders.length }} 笔 · 待发货 {{ pendingCount }}</text>
      </view>

      <view class="order-card" v-for="o in myOrders" :key="o.id">
        <view class="order-head">
          <view class="order-no">
            <text class="no-label">订单号</text>
            <text class="no-val">{{ o.orderNo }}</text>
          </view>
          <text class="status" :class="statusClass(o.status)">{{ o.status }}</text>
        </view>
        <view class="order-items">
          <view class="item" v-for="(it, i) in o.items" :key="i">
            <view class="item-cover" :style="{ background: coverMeta(it.category).bg, color: coverMeta(it.category).color }">
              <text class="item-cover-icon">{{ coverMeta(it.category).icon }}</text>
            </view>
            <view class="item-main">
              <text class="item-name">{{ it.name }}</text>
              <text class="item-spec">{{ it.spec }} × {{ it.qty }}</text>
            </view>
            <text class="item-price">¥{{ (Number(it.price) * Number(it.qty)).toFixed(2) }}</text>
          </view>
        </view>
        <view class="order-foot">
          <text class="order-time">{{ o.createdAt }}</text>
          <text class="order-total">合计 <text class="total-num">¥{{ Number(o.totalAmount).toFixed(2) }}</text></text>
        </view>
      </view>

      <view class="empty" v-if="!loading && !myOrders.length">
        <text class="empty-icon">📦</text>
        <text class="empty-text">还没有药品订单，去药库看看吧</text>
        <view class="empty-btn" @click="goLibrary">前往药库</view>
      </view>
      <view class="loading" v-if="loading">正在加载订单…</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getDrugOrders, getCurrentUser, drugCoverMeta, checkLogin } from '../../utils/api.js'

const user = ref(getCurrentUser())
const orders = ref([])
const loading = ref(true)
const coverMeta = drugCoverMeta

const myOrders = computed(() => orders.value.filter(o => String(o.userId) === String(user.value?.id)))
const pendingCount = computed(() => myOrders.value.filter(o => o.status === '待发货').length)

function statusClass(s) {
  return { '待发货': 'pending', '已发货': 'shipping', '已完成': 'done', '已取消': 'cancel' }[s] || 'pending'
}

async function load() {
  loading.value = true
  try {
    const list = await getDrugOrders()
    orders.value = Array.isArray(list) ? list : []
  } catch (e) {
    uni.showToast({ title: '加载失败，请确认服务端已启动', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function goLibrary() { uni.navigateTo({ url: '/pages/drug/list' }) }
function goBack() { uni.navigateBack() }

onShow(() => {
  if (!checkLogin()) return
  user.value = getCurrentUser()
  load()
})
</script>

<style scoped>
.orders-page { min-height: 100vh; padding-bottom: 40rpx; }
.header {
  margin: 20rpx 24rpx 0;
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #12A8A0, #1D7EC9);
  box-shadow: 0 10rpx 28rpx rgba(7, 38, 48, 0.16);
}
.header-top { display: flex; align-items: center; gap: 16rpx; }
.back-btn {
  width: 56rpx; height: 56rpx; border-radius: 50%; flex-shrink: 0;
  background: rgba(255,255,255,0.22); color: #fff; font-size: 38rpx;
  display: flex; align-items: center; justify-content: center; padding-bottom: 4rpx;
}
.header-text { flex: 1; min-width: 0; }
.page-title { font-size: 34rpx; font-weight: 700; color: #fff; display: block; }
.page-sub { font-size: 20rpx; color: rgba(255,255,255,0.82); margin-top: 4rpx; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header-link {
  flex-shrink: 0; font-size: 22rpx; color: #fff; padding: 8rpx 18rpx; border-radius: 999rpx;
  background: rgba(255,255,255,0.18); border: 1rpx solid rgba(255,255,255,0.35);
}

.container { padding: 20rpx 24rpx 0; }

.section-head { display: flex; justify-content: space-between; align-items: center; padding: 18rpx 4rpx 10rpx; }
.section-title { font-size: 30rpx; font-weight: 700; color: #0B3B48; }
.tip { font-size: 22rpx; color: #8E9AAB; }

.order-card { background: #fff; border-radius: 20rpx; padding: 20rpx 22rpx; margin-bottom: 16rpx; box-shadow: 0 8rpx 24rpx rgba(18,168,160,0.08); }
.order-head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14rpx; border-bottom: 1rpx solid #F2F6F7; }
.no-label { font-size: 20rpx; color: #9AA7B2; }
.no-val { font-size: 22rpx; color: #24414A; margin-left: 8rpx; }
.status { font-size: 20rpx; padding: 5rpx 16rpx; border-radius: 999rpx; }
.status.pending { color: #B7791F; background: #FFF4E0; }
.status.shipping { color: #1D7EC9; background: #E8F2FC; }
.status.done { color: #27AE60; background: #E9F9F0; }
.status.cancel { color: #8E9AAB; background: #F1F4F6; }

.order-items { padding: 6rpx 0; }
.item { display: flex; align-items: center; gap: 14rpx; padding: 12rpx 0; }
.item-cover {
  width: 76rpx; height: 76rpx; border-radius: 12rpx; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.item-cover-icon { font-size: 38rpx; line-height: 1; }
.item-main { flex: 1; min-width: 0; }
.item-name { display: block; font-size: 25rpx; color: #24414A; font-weight: 600; }
.item-spec { display: block; font-size: 20rpx; color: #9AA7B2; margin-top: 4rpx; }
.item-price { font-size: 24rpx; color: #24414A; font-weight: 700; }

.order-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 12rpx; border-top: 1rpx solid #F2F6F7; }
.order-time { font-size: 20rpx; color: #9AA7B2; }
.order-total { font-size: 22rpx; color: #8E9AAB; }
.total-num { font-size: 30rpx; font-weight: 700; color: #EB5757; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 60rpx 0; }
.empty-icon { font-size: 60rpx; }
.empty-text { font-size: 23rpx; color: #A8B4BE; margin-top: 14rpx; }
.empty-btn {
  margin-top: 20rpx; font-size: 24rpx; color: #fff; padding: 14rpx 40rpx; border-radius: 999rpx;
  background: linear-gradient(135deg, #12A8A0, #2D9CDB);
}
.loading { padding: 40rpx 0; text-align: center; font-size: 24rpx; color: #9AA7B2; }

@media screen and (min-width: 750px) {
  .orders-page { padding-bottom: 24px; }
  .header { margin: 18px 0 0; padding: 18px 24px; border-radius: 16px; }
  .header-top { gap: 14px; }
  .back-btn { width: 34px; height: 34px; font-size: 22px; }
  .page-title { font-size: 22px; }
  .page-sub { font-size: 13px; margin-top: 3px; }
  .header-link { font-size: 13px; padding: 6px 14px; }
  .container { padding: 18px 0 0; }
  .section-head { padding: 16px 0 10px; }
  .section-title { font-size: 17px; }
  .tip { font-size: 12px; }
  .order-card { padding: 16px 20px; border-radius: 14px; margin-bottom: 12px; }
  .no-label, .no-val { font-size: 12px; }
  .no-val { margin-left: 6px; }
  .status { font-size: 12px; padding: 3px 10px; }
  .item-cover { width: 44px; height: 44px; border-radius: 8px; }
  .item-cover-icon { font-size: 22px; }
  .item-name { font-size: 14px; }
  .item-spec { font-size: 12px; }
  .item-price { font-size: 14px; }
  .order-time { font-size: 12px; }
  .order-total { font-size: 13px; }
  .total-num { font-size: 17px; }
  .empty-icon { font-size: 30px; }
  .empty-text { font-size: 13px; }
  .empty-btn { font-size: 13px; padding: 9px 26px; }
  .loading { font-size: 13px; }
}
</style>
