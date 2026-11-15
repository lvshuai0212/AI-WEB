<template>
  <view class="mall-page">
    <view class="header">
      <view class="header-top">
        <image class="header-logo" src="/static/image/logo.jpg" mode="aspectFill" />
        <view class="header-text">
          <text class="page-title">积分兑换</text>
          <text class="page-sub">坚持打卡攒健康积分，兑换体检服务与健康好礼</text>
        </view>
        <view class="header-stats">
          <view class="h-stat">
            <text class="h-val">{{ points }}</text>
            <text class="h-lbl">我的积分</text>
          </view>
          <view class="h-divider"></view>
          <view class="h-stat">
            <text class="h-val">{{ exchangedCount }}</text>
            <text class="h-lbl">已兑换</text>
          </view>
        </view>
      </view>
    </view>

    <view class="container">
      <view class="section-head">
        <text class="section-title">可兑换好礼</text>
        <text class="tip">积分不足可继续打卡获取</text>
      </view>

      <view class="goods-grid" v-if="!loading">
        <view class="goods-card" v-for="g in goods" :key="g.id" @click="confirmExchange(g)">
          <image class="goods-cover" :src="assetUrl(g.cover)" mode="aspectFill" />
          <view class="goods-info">
            <text class="goods-name">{{ g.name }}</text>
            <text class="goods-desc">{{ g.desc }}</text>
            <view class="goods-meta">
              <text class="goods-tag">{{ g.category }}</text>
              <text class="goods-stock">库存 {{ g.stock }} · 已兑 {{ g.redeemed }}</text>
            </view>
            <view class="goods-bottom">
              <text class="goods-points">{{ g.points }}<text class="points-unit"> 积分</text></text>
              <view class="exchange-btn" :class="{ done: g.stock <= 0, lack: g.stock > 0 && points < g.points }">
                {{ g.stock <= 0 ? '已兑完' : (points < g.points ? '积分不足' : '立即兑换') }}
              </view>
            </view>
          </view>
        </view>
      </view>
      <view class="loading" v-else>正在加载礼品…</view>

      <view class="records-card">
        <view class="section-head">
          <text class="section-title">我的兑换记录</text>
          <text class="tip">{{ exchangedCount }} 条</text>
        </view>
        <view class="record" v-for="r in myRecords" :key="r.id">
          <image class="record-cover" :src="assetUrl(r.cover)" mode="aspectFill" />
          <view class="record-main">
            <text class="record-name">{{ r.goodsName }}</text>
            <text class="record-time">{{ r.createdAt }} · {{ r.status }}</text>
          </view>
          <text class="record-points">-{{ r.points }}</text>
        </view>
        <view class="empty" v-if="!loading && !myRecords.length">
          <text class="empty-icon">🎁</text>
          <text class="empty-text">还没有兑换记录，攒够积分来换健康好礼吧</text>
        </view>
      </view>
    </view>

    <!-- 兑换确认 -->
    <view class="modal-mask" v-if="picked" @click="closeModal">
      <view class="modal" @click.stop>
        <text class="modal-title">确认兑换</text>
        <view class="modal-goods">
          <image class="modal-cover" :src="assetUrl(picked.cover)" mode="aspectFill" />
          <view class="modal-info">
            <text class="modal-name">{{ picked.name }}</text>
            <text class="modal-desc">{{ picked.points }} 积分 · 库存 {{ picked.stock }}</text>
          </view>
        </view>
        <view class="modal-row">
          <text class="modal-label">当前积分</text>
          <text class="modal-val">{{ points }}</text>
        </view>
        <view class="modal-row">
          <text class="modal-label">本次消耗</text>
          <text class="modal-val minus">-{{ picked.points }}</text>
        </view>
        <view class="modal-row">
          <text class="modal-label">兑换后剩余</text>
          <text class="modal-val">{{ points < picked.points ? '—' : points - picked.points }}</text>
        </view>
        <text class="modal-tip" v-if="points < picked.points">积分不足，还差 {{ picked.points - points }} 分</text>
        <view class="modal-actions">
          <view class="modal-btn ghost" @click="closeModal">取消</view>
          <view class="modal-btn primary" :class="{ disabled: points < picked.points || picked.stock <= 0 || exchanging }" @click="doExchange">
            {{ exchanging ? '兑换中…' : '确认兑换' }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getGoods, getExchangeRecords, exchangeGoods, getCurrentUser, getUserById, assetUrl, checkLogin } from '../../utils/api.js'

const user = ref(getCurrentUser())
const goods = ref([])
const records = ref([])
const loading = ref(true)
const exchanging = ref(false)
const picked = ref(null)

const points = computed(() => Number(user.value?.totalPoints) || 0)
const myRecords = computed(() => records.value.filter(r => String(r.userId) === String(user.value?.id)))
const exchangedCount = computed(() => myRecords.value.length)

async function load() {
  try {
    const [g, r] = await Promise.all([getGoods(), getExchangeRecords()])
    goods.value = Array.isArray(g) ? g : []
    records.value = Array.isArray(r) ? r : []
  } catch (e) {
    uni.showToast({ title: '加载失败，请确认服务端已启动', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function refreshUser() {
  if (!user.value?.id) return
  try {
    const latest = await getUserById(user.value.id)
    if (latest) {
      user.value = latest
      uni.setStorageSync('userInfo', latest)
    }
  } catch (e) { /* 静默：使用本地缓存的积分 */ }
}

function confirmExchange(g) {
  if (Number(g.stock) <= 0) return uni.showToast({ title: '该礼品已兑完', icon: 'none' })
  picked.value = g
}

function closeModal() { picked.value = null }

async function doExchange() {
  if (exchanging.value || !picked.value) return
  if (points.value < Number(picked.value.points)) {
    return uni.showToast({ title: `积分不足，还差 ${picked.value.points - points.value} 分`, icon: 'none' })
  }
  exchanging.value = true
  try {
    const res = await exchangeGoods(user.value.id, picked.value.id)
    const stored = getCurrentUser() || {}
    const nextUser = { ...stored, totalPoints: res.totalPoints }
    uni.setStorageSync('userInfo', nextUser)
    user.value = nextUser
    picked.value = null
    uni.showToast({ title: '兑换成功', icon: 'success' })
    await load()
  } catch (err) {
    const msg = err?.response?.data?.message || '兑换失败，请稍后重试'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    exchanging.value = false
  }
}

onShow(async () => {
  if (!checkLogin()) return
  user.value = getCurrentUser()
  await refreshUser()
  await load()
})
</script>

<style scoped>
.mall-page { min-height: 100vh; padding-bottom: 40rpx; }
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
.section-head { display: flex; justify-content: space-between; align-items: center; padding: 12rpx 4rpx; }
.section-title { font-size: 30rpx; font-weight: 700; color: #0B3B48; }
.tip { font-size: 22rpx; color: #8E9AAB; }

.goods-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16rpx; }
.goods-card { background: #fff; border-radius: 20rpx; overflow: hidden; box-shadow: 0 8rpx 24rpx rgba(18,168,160,0.08); }
.goods-cover { width: 100%; height: 200rpx; display: block; }
.goods-info { padding: 16rpx; }
.goods-name { font-size: 26rpx; font-weight: 700; color: #0B3B48; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.goods-desc {
  font-size: 20rpx; color: #8E9AAB; margin-top: 6rpx; line-height: 1.5;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; min-height: 60rpx;
}
.goods-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 8rpx; }
.goods-tag { font-size: 18rpx; color: #12A8A0; background: #E8F7F5; border-radius: 8rpx; padding: 2rpx 10rpx; }
.goods-stock { font-size: 18rpx; color: #A8B4BE; }
.goods-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 14rpx; }
.goods-points { font-size: 30rpx; font-weight: 700; color: #EB5757; }
.points-unit { font-size: 18rpx; font-weight: 400; color: #8E9AAB; }
.exchange-btn {
  font-size: 20rpx; color: #fff; padding: 8rpx 18rpx; border-radius: 999rpx;
  background: linear-gradient(135deg, #12A8A0, #2D9CDB);
}
.exchange-btn.lack { background: #FFE8E0; color: #EB5757; }
.exchange-btn.done { background: #EEF2F4; color: #A8B4BE; }
.loading { padding: 60rpx 0; text-align: center; font-size: 24rpx; color: #9AA7B2; }

.records-card { margin-top: 24rpx; background: #fff; border-radius: 20rpx; padding: 8rpx 20rpx 16rpx; box-shadow: 0 8rpx 24rpx rgba(18,168,160,0.08); }
.record { display: flex; align-items: center; gap: 16rpx; padding: 16rpx 0; border-top: 1rpx solid #F2F6F7; }
.record-cover { width: 72rpx; height: 72rpx; border-radius: 12rpx; flex-shrink: 0; }
.record-main { flex: 1; min-width: 0; }
.record-name { font-size: 26rpx; color: #24414A; display: block; }
.record-time { font-size: 20rpx; color: #9AA7B2; margin-top: 4rpx; display: block; }
.record-points { font-size: 26rpx; font-weight: 700; color: #EB5757; }
.empty { display: flex; flex-direction: column; align-items: center; padding: 40rpx 0; }
.empty-icon { font-size: 56rpx; }
.empty-text { font-size: 22rpx; color: #A8B4BE; margin-top: 12rpx; }

.modal-mask {
  position: fixed; left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(6, 32, 40, 0.45);
  display: flex; align-items: center; justify-content: center; z-index: 99;
}
.modal { width: 600rpx; background: #fff; border-radius: 24rpx; padding: 32rpx 28rpx 24rpx; box-sizing: border-box; }
.modal-title { font-size: 32rpx; font-weight: 700; color: #0B3B48; display: block; text-align: center; }
.modal-goods { display: flex; align-items: center; gap: 16rpx; margin: 24rpx 0 8rpx; }
.modal-cover { width: 96rpx; height: 96rpx; border-radius: 14rpx; flex-shrink: 0; }
.modal-name { font-size: 28rpx; font-weight: 700; color: #24414A; display: block; }
.modal-desc { font-size: 22rpx; color: #8E9AAB; margin-top: 6rpx; display: block; }
.modal-row { display: flex; justify-content: space-between; padding: 12rpx 0; font-size: 24rpx; }
.modal-label { color: #8E9AAB; }
.modal-val { color: #24414A; font-weight: 700; }
.modal-val.minus { color: #EB5757; }
.modal-tip { display: block; font-size: 22rpx; color: #EB5757; margin-top: 8rpx; }
.modal-actions { display: flex; gap: 16rpx; margin-top: 24rpx; }
.modal-btn { flex: 1; text-align: center; padding: 20rpx 0; border-radius: 999rpx; font-size: 26rpx; }
.modal-btn.ghost { background: #F2F6F7; color: #5A6B75; }
.modal-btn.primary { background: linear-gradient(135deg, #12A8A0, #2D9CDB); color: #fff; }
.modal-btn.disabled { opacity: 0.5; }

@media screen and (min-width: 750px) {
  .mall-page { padding-bottom: 24px; }
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
  .section-head { padding: 4px 0 12px; }
  .section-title { font-size: 17px; }
  .tip { font-size: 12px; }
  .goods-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
  .goods-cover { height: 168px; }
  .goods-info { padding: 14px 16px 16px; }
  .goods-name { font-size: 16px; }
  .goods-desc { font-size: 13px; min-height: 40px; margin-top: 6px; }
  .goods-tag { font-size: 12px; padding: 3px 8px; border-radius: 6px; }
  .goods-stock { font-size: 12px; }
  .goods-bottom { margin-top: 12px; }
  .goods-points { font-size: 20px; }
  .points-unit { font-size: 12px; }
  .exchange-btn { font-size: 13px; padding: 7px 16px; }
  .loading { font-size: 13px; padding: 40px 0; }
  .records-card { margin-top: 20px; border-radius: 14px; padding: 8px 20px 12px; }
  .record { padding: 12px 0; gap: 14px; }
  .record-cover { width: 40px; height: 40px; border-radius: 8px; }
  .record-name { font-size: 15px; }
  .record-time { font-size: 12px; margin-top: 2px; }
  .record-points { font-size: 16px; }
  .empty { padding: 32px 0; }
  .empty-icon { font-size: 28px; }
  .empty-text { font-size: 13px; }
  .modal { width: 420px; border-radius: 16px; padding: 24px 24px 20px; }
  .modal-title { font-size: 18px; }
  .modal-cover { width: 56px; height: 56px; border-radius: 10px; }
  .modal-name { font-size: 16px; }
  .modal-desc { font-size: 12px; }
  .modal-row { font-size: 14px; padding: 8px 0; }
  .modal-tip { font-size: 12px; }
  .modal-actions { margin-top: 18px; gap: 12px; }
  .modal-btn { padding: 12px 0; font-size: 14px; }
}
@media screen and (min-width: 1100px) {
  .goods-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .goods-cover { height: 180px; }
}
</style>
