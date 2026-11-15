<template>
  <view class="drug-page">
    <view class="header">
      <view class="header-top">
        <image class="header-logo" src="/static/image/logo.jpg" mode="aspectFill" />
        <view class="header-text">
          <text class="page-title">社区药库</text>
          <text class="page-sub">仅售非处方药（OTC），下单后社区药房配送到家</text>
        </view>
        <view class="header-stats">
          <view class="h-stat">
            <text class="h-val">{{ onSale.length }}</text>
            <text class="h-lbl">在售品种</text>
          </view>
          <view class="h-divider"></view>
          <view class="h-stat">
            <text class="h-val">{{ myOrderCount }}</text>
            <text class="h-lbl">我的订单</text>
          </view>
        </view>
      </view>
    </view>

    <view class="container">
      <view class="filter-bar">
        <view class="search-shell">
          <text class="search-icon">🔍</text>
          <input class="search-input" v-model="keyword" placeholder="搜索药品名 / 症状，如 感冒、头痛" />
          <text class="search-clear" v-if="keyword" @click="keyword = ''">×</text>
        </view>
        <scroll-view class="cate-scroll" scroll-x>
          <view class="cate-chip" :class="{ active: category === '' }" @click="category = ''">全部</view>
          <view class="cate-chip" v-for="c in categories" :key="c" :class="{ active: category === c }" @click="category = c">{{ c }}</view>
        </scroll-view>
      </view>

      <view class="section-head">
        <text class="section-title">在售药品</text>
        <text class="tip">共 {{ filtered.length }} 种 · 均为 OTC</text>
      </view>

      <view class="drug-grid" v-if="!loading">
        <view class="drug-card" v-for="d in filtered" :key="d.id" @click="goDetail(d)">
          <view class="drug-cover" :style="{ background: coverMeta(d.category).bg, color: coverMeta(d.category).color }">
            <text class="drug-cover-icon">{{ coverMeta(d.category).icon }}</text>
            <text class="drug-cover-label">{{ d.category }}</text>
          </view>
          <view class="drug-info">
            <view class="drug-title-row">
              <text class="drug-name">{{ d.name }}</text>
              <text class="otc-tag">OTC</text>
            </view>
            <text class="drug-generic">{{ d.genericName }} · {{ d.spec }}</text>
            <view class="drug-meta">
              <text class="drug-cate">{{ d.category }}</text>
              <text class="drug-stock" :class="{ empty: d.stock <= 0 }">{{ d.stock > 0 ? '库存 ' + d.stock : '暂时缺货' }}</text>
            </view>
            <view class="drug-bottom">
              <text class="drug-price">¥{{ d.price }}</text>
              <view class="buy-btn" :class="{ disabled: d.stock <= 0 }">{{ d.stock > 0 ? '查看 / 下单' : '缺货' }}</view>
            </view>
          </view>
        </view>
        <view class="empty" v-if="!filtered.length">
          <text class="empty-icon">💊</text>
          <text class="empty-text">没有找到匹配的药品，换个关键词试试</text>
        </view>
      </view>
      <view class="loading" v-else>正在加载药库…</view>

      <view class="order-entry" @click="goOrders">
        <view class="entry-left">
          <text class="entry-icon">📦</text>
          <view>
            <text class="entry-title">我的药品订单</text>
            <text class="entry-sub">查看订单状态与配送进度</text>
          </view>
        </view>
        <text class="entry-arrow">›</text>
      </view>

      <view class="notice-card">
        <text class="notice-title">用药安全提示</text>
        <text class="notice-text">本药库仅提供非处方药（OTC），页面信息仅供参考。处方药需凭医生处方到院购买；孕产妇、婴幼儿及儿童用药请遵医嘱。如出现胸痛、呼吸困难、意识不清等急症，请立即拨打 120。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { getDrugs, getDrugOrders, getCurrentUser, drugCoverMeta, checkLogin } from '../../utils/api.js'

const user = ref(getCurrentUser())
const drugs = ref([])
const orders = ref([])
const loading = ref(true)
const keyword = ref('')
const category = ref('')
const coverMeta = drugCoverMeta

const onSale = computed(() => drugs.value.filter(d => d.status === 'on' && d.otc))
const categories = computed(() => [...new Set(onSale.value.map(d => d.category))])
const myOrderCount = computed(() => orders.value.filter(o => String(o.userId) === String(user.value?.id)).length)

const filtered = computed(() => {
  let list = onSale.value
  if (category.value) list = list.filter(d => d.category === category.value)
  const key = keyword.value.trim()
  if (key) {
    list = list.filter(d =>
      d.name.includes(key) || d.genericName.includes(key) || d.category.includes(key) ||
      (d.symptoms || []).some(s => s.includes(key))
    )
  }
  return list
})

async function load() {
  loading.value = true
  try {
    const [d, o] = await Promise.all([getDrugs(), getDrugOrders()])
    drugs.value = Array.isArray(d) ? d : []
    orders.value = Array.isArray(o) ? o : []
  } catch (e) {
    uni.showToast({ title: '加载失败，请确认服务端已启动', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function goDetail(d) {
  uni.navigateTo({ url: '/pages/drug/detail?id=' + d.id })
}

function goOrders() {
  uni.navigateTo({ url: '/pages/drug/orders' })
}

onLoad((options) => {
  const c = options && options.category
  if (!c) return
  let name = c
  try { name = decodeURIComponent(c) } catch (e) { name = c }
  category.value = name
})

onShow(() => {
  if (!checkLogin()) return
  user.value = getCurrentUser()
  load()
})
</script>

<style scoped>
.drug-page { min-height: 100vh; padding-bottom: 40rpx; }
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
.header-stats { display: flex; align-items: center; gap: 16rpx; flex-shrink: 0; }
.h-stat { text-align: center; }
.h-val { font-size: 30rpx; font-weight: 700; color: #fff; display: block; }
.h-lbl { font-size: 16rpx; color: rgba(255,255,255,0.78); margin-top: 2rpx; display: block; }
.h-divider { width: 1rpx; height: 34rpx; background: rgba(255,255,255,0.28); }

.container { padding: 0 24rpx; margin-top: 16rpx; }
.filter-bar { display: flex; flex-direction: column; gap: 14rpx; padding-bottom: 4rpx; }
.search-shell {
  display: flex; align-items: center; gap: 10rpx;
  background: #fff; border-radius: 999rpx; padding: 14rpx 22rpx;
  border: 1rpx solid rgba(18,168,160,0.12);
}
.search-icon { font-size: 24rpx; }
.search-input { flex: 1; font-size: 24rpx; color: #24414A; }
.search-clear { font-size: 30rpx; color: #A8B4BE; padding: 0 6rpx; }
.cate-scroll { white-space: nowrap; }
.cate-chip {
  display: inline-block; font-size: 22rpx; color: #5A6B75;
  background: #fff; border: 1rpx solid rgba(18,168,160,0.14);
  border-radius: 999rpx; padding: 8rpx 20rpx; margin-right: 12rpx;
}
.cate-chip.active { background: linear-gradient(135deg, #12A8A0, #2D9CDB); color: #fff; border-color: transparent; }

.section-head { display: flex; justify-content: space-between; align-items: center; padding: 18rpx 4rpx 12rpx; }
.section-title { font-size: 30rpx; font-weight: 700; color: #0B3B48; }
.tip { font-size: 22rpx; color: #8E9AAB; }

.drug-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16rpx; }
.drug-card { background: #fff; border-radius: 20rpx; overflow: hidden; box-shadow: 0 8rpx 24rpx rgba(18,168,160,0.08); }
.drug-cover {
  width: 100%; height: 200rpx;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6rpx;
}
.drug-cover-icon { font-size: 68rpx; line-height: 1; }
.drug-cover-label { font-size: 20rpx; opacity: 0.72; }
.drug-info { padding: 16rpx; }
.drug-title-row { display: flex; align-items: center; gap: 8rpx; }
.drug-name { flex: 1; min-width: 0; font-size: 26rpx; font-weight: 700; color: #0B3B48; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.otc-tag { flex-shrink: 0; font-size: 18rpx; color: #27AE60; background: #E9F9F0; border-radius: 8rpx; padding: 2rpx 8rpx; }
.drug-generic { display: block; font-size: 20rpx; color: #8E9AAB; margin-top: 6rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.drug-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 8rpx; }
.drug-cate { font-size: 18rpx; color: #12A8A0; background: #E8F7F5; border-radius: 8rpx; padding: 2rpx 10rpx; }
.drug-stock { font-size: 18rpx; color: #A8B4BE; }
.drug-stock.empty { color: #EB5757; }
.drug-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 14rpx; }
.drug-price { font-size: 30rpx; font-weight: 700; color: #EB5757; }
.buy-btn {
  font-size: 20rpx; color: #fff; padding: 8rpx 16rpx; border-radius: 999rpx;
  background: linear-gradient(135deg, #12A8A0, #2D9CDB);
}
.buy-btn.disabled { background: #EEF2F4; color: #A8B4BE; }
.loading { padding: 60rpx 0; text-align: center; font-size: 24rpx; color: #9AA7B2; }
.empty { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; padding: 50rpx 0; }
.empty-icon { font-size: 56rpx; }
.empty-text { font-size: 22rpx; color: #A8B4BE; margin-top: 12rpx; }

.order-entry {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 24rpx; background: #fff; border-radius: 20rpx; padding: 22rpx 22rpx;
  box-shadow: 0 8rpx 24rpx rgba(18,168,160,0.08);
}
.entry-left { display: flex; align-items: center; gap: 16rpx; }
.entry-icon { font-size: 34rpx; }
.entry-title { display: block; font-size: 26rpx; font-weight: 700; color: #0B3B48; }
.entry-sub { display: block; font-size: 20rpx; color: #9AA7B2; margin-top: 4rpx; }
.entry-arrow { font-size: 34rpx; color: #B7C4CC; }

.notice-card { margin-top: 20rpx; background: #FFF9F2; border: 1rpx solid #FCE7CE; border-radius: 18rpx; padding: 20rpx 22rpx; }
.notice-title { display: block; font-size: 24rpx; font-weight: 700; color: #B7791F; }
.notice-text { display: block; font-size: 21rpx; color: #A9752E; line-height: 1.7; margin-top: 8rpx; }

@media screen and (min-width: 750px) {
  .drug-page { padding-bottom: 24px; }
  .header { margin: 18px 0 0; padding: 20px 24px; border-radius: 16px; }
  .header-top { gap: 16px; }
  .header-logo { width: 46px; height: 46px; border-radius: 12px; border-width: 2px; }
  .page-title { font-size: 24px; }
  .page-sub { font-size: 13px; margin-top: 4px; }
  .h-val { font-size: 22px; }
  .h-lbl { font-size: 12px; }
  .h-divider { height: 26px; }
  .header-stats { gap: 22px; }
  .container { padding: 0; margin-top: 18px; }
  .filter-bar { flex-direction: row; align-items: center; justify-content: space-between; gap: 18px; }
  .search-shell { width: 320px; padding: 10px 18px; border-radius: 999px; background: #fff; }
  .search-input { font-size: 14px; }
  .cate-scroll { flex: 1; min-width: 0; }
  .cate-chip { font-size: 13px; padding: 6px 14px; margin-right: 8px; }
  .section-head { padding: 16px 0 12px; }
  .section-title { font-size: 17px; }
  .tip { font-size: 12px; }
  .drug-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
  .drug-cover { height: 168px; gap: 5px; }
  .drug-cover-icon { font-size: 52px; }
  .drug-cover-label { font-size: 12px; }
  .drug-info { padding: 14px 16px 16px; }
  .drug-name { font-size: 16px; }
  .otc-tag { font-size: 11px; padding: 2px 6px; }
  .drug-generic { font-size: 12px; }
  .drug-cate { font-size: 11px; padding: 2px 8px; }
  .drug-stock { font-size: 12px; }
  .drug-bottom { margin-top: 12px; }
  .drug-price { font-size: 20px; }
  .buy-btn { font-size: 13px; padding: 7px 14px; }
  .loading { font-size: 13px; padding: 40px 0; }
  .empty-icon { font-size: 28px; }
  .empty-text { font-size: 13px; }
  .order-entry { margin-top: 20px; padding: 16px 20px; border-radius: 14px; }
  .entry-icon { font-size: 22px; }
  .entry-title { font-size: 15px; }
  .entry-sub { font-size: 12px; }
  .notice-card { margin-top: 16px; border-radius: 12px; padding: 16px 18px; }
  .notice-title { font-size: 14px; }
  .notice-text { font-size: 12px; }
}
@media screen and (min-width: 1100px) {
  .drug-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .drug-cover { height: 180px; }
}
</style>
