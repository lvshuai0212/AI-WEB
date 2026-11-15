<template>
  <view class="detail-page">
    <view class="header">
      <view class="header-top">
        <view class="back-btn" @click="goBack">‹</view>
        <view class="header-text">
          <text class="page-title">药品详情</text>
          <text class="page-sub">社区药房 · 非处方药 OTC</text>
        </view>
        <view class="header-link" @click="goOrders">我的订单 ›</view>
      </view>
    </view>

    <view class="container" v-if="drug">
      <view class="hero-card">
        <view class="hero-cover" :style="{ background: coverMeta(drug.category).bg, color: coverMeta(drug.category).color }">
          <text class="hero-cover-icon">{{ coverMeta(drug.category).icon }}</text>
          <text class="hero-cover-label">{{ drug.category }}</text>
        </view>
        <view class="hero-info">
          <view class="hero-title-row">
            <text class="hero-name">{{ drug.name }}</text>
            <text class="tag" :class="drug.otc ? 'otc' : 'rx'">{{ drug.otc ? 'OTC 非处方药' : '处方药' }}</text>
          </view>
          <text class="hero-generic">{{ drug.genericName }} · {{ drug.spec }}</text>
          <view class="hero-meta">
            <text class="cate">{{ drug.category }}</text>
            <text class="stock" :class="{ empty: drug.stock <= 0 }">{{ drug.stock > 0 ? '库存 ' + drug.stock + ' 件' : '暂时缺货' }}</text>
          </view>
          <text class="hero-price">¥{{ drug.price }}<text class="price-unit"> / {{ drug.spec }}</text></text>
        </view>
      </view>

      <view class="card">
        <text class="card-title">主治症状</text>
        <view class="symptom-list">
          <text class="symptom-chip" v-for="s in drug.symptoms" :key="s">{{ s }}</text>
        </view>
      </view>

      <view class="card">
        <text class="card-title">用法用量</text>
        <text class="card-text">{{ drug.usage }}</text>
      </view>

      <view class="card">
        <text class="card-title">禁忌与注意事项</text>
        <text class="card-text warning">{{ drug.contraindications }}</text>
      </view>

      <view class="card">
        <text class="card-title">适用人群</text>
        <text class="card-text">{{ drug.audience }}</text>
      </view>

      <view class="qty-card">
        <text class="qty-label">购买数量</text>
        <view class="stepper">
          <view class="step" :class="{ disabled: qty <= 1 }" @click="changeQty(-1)">−</view>
          <text class="qty-val">{{ qty }}</text>
          <view class="step" :class="{ disabled: qty >= maxQty }" @click="changeQty(1)">+</view>
        </view>
        <text class="qty-total">合计 <text class="total-num">¥{{ total }}</text></text>
      </view>

      <view class="safety-card">
        <text class="safety-title">用药安全提示</text>
        <text class="safety-text">请仔细阅读说明书并按说明使用或在药师指导下购买；孕产妇、婴幼儿及儿童用药请遵医嘱。如出现胸痛、呼吸困难、意识不清等急症，请立即拨打 120。</text>
      </view>

      <view class="bottom-bar">
        <view class="bottom-inner">
          <view class="price-box">
            <text class="bottom-price">¥{{ total }}</text>
            <text class="bottom-sub">共 {{ qty }} 件</text>
          </view>
          <view class="order-btn" :class="{ disabled: !canOrder }" @click="openConfirm">
            {{ orderBtnText }}
          </view>
        </view>
      </view>
    </view>
    <view class="loading" v-else>{{ loading ? '正在加载药品信息…' : '药品不存在或已下架' }}</view>

    <view class="modal-mask" v-if="confirmVisible" @click="confirmVisible = false">
      <view class="modal" @click.stop>
        <text class="modal-title">确认下单</text>
        <view class="modal-drug">
          <view class="modal-cover" :style="{ background: coverMeta(drug.category).bg, color: coverMeta(drug.category).color }">
            <text class="modal-cover-icon">{{ coverMeta(drug.category).icon }}</text>
          </view>
          <view class="modal-info">
            <text class="modal-name">{{ drug.name }}</text>
            <text class="modal-desc">{{ drug.spec }} × {{ qty }}</text>
          </view>
        </view>
        <view class="modal-row"><text class="modal-label">单价</text><text class="modal-val">¥{{ drug.price }}</text></view>
        <view class="modal-row"><text class="modal-label">数量</text><text class="modal-val">{{ qty }}</text></view>
        <view class="modal-row"><text class="modal-label">合计</text><text class="modal-val minus">¥{{ total }}</text></view>
        <text class="modal-tip">下单后由社区药房配送，订单状态可在「我的药品订单」查看</text>
        <view class="modal-actions">
          <view class="modal-btn ghost" @click="confirmVisible = false">取消</view>
          <view class="modal-btn primary" :class="{ disabled: submitting }" @click="submitOrder">
            {{ submitting ? '提交中…' : '确认下单' }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getDrugById, createDrugOrder, getCurrentUser, drugCoverMeta, checkLogin } from '../../utils/api.js'

const drug = ref(null)
const loading = ref(true)
const qty = ref(1)
const submitting = ref(false)
const confirmVisible = ref(false)
const coverMeta = drugCoverMeta

const maxQty = computed(() => Math.max(1, Number(drug.value?.stock) || 0))
const total = computed(() => {
  if (!drug.value) return '0.00'
  return (Number(drug.value.price) * qty.value).toFixed(2)
})
const canOrder = computed(() => !!drug.value && drug.value.otc && drug.value.status === 'on' && Number(drug.value.stock) > 0)
const orderBtnText = computed(() => {
  if (!drug.value) return '立即下单'
  if (!drug.value.otc) return '处方药需凭处方购买'
  if (drug.value.status !== 'on') return '该药品已下架'
  if (Number(drug.value.stock) <= 0) return '暂时缺货'
  return '立即下单'
})

async function load(id) {
  loading.value = true
  try {
    drug.value = await getDrugById(id)
    qty.value = 1
  } catch (e) {
    drug.value = null
  } finally {
    loading.value = false
  }
}

function changeQty(step) {
  const next = qty.value + step
  if (next < 1 || next > maxQty.value) return
  qty.value = next
}

function openConfirm() {
  if (!canOrder.value) {
    return uni.showToast({ title: orderBtnText.value, icon: 'none' })
  }
  confirmVisible.value = true
}

async function submitOrder() {
  if (submitting.value) return
  const user = getCurrentUser()
  if (!user?.id) return uni.showToast({ title: '请先登录', icon: 'none' })
  submitting.value = true
  try {
    await createDrugOrder(user.id, [{ drugId: drug.value.id, qty: qty.value }])
    confirmVisible.value = false
    uni.showToast({ title: '下单成功', icon: 'success' })
    await load(drug.value.id)
    setTimeout(() => { uni.navigateTo({ url: '/pages/drug/orders' }) }, 900)
  } catch (err) {
    const msg = err?.response?.data?.message || '下单失败，请稍后重试'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    submitting.value = false
  }
}

function goOrders() { uni.navigateTo({ url: '/pages/drug/orders' }) }
function goBack() { uni.navigateBack() }

onLoad((options) => {
  if (!checkLogin()) return
  load(options?.id || 1)
})
</script>

<style scoped>
.detail-page { min-height: 100vh; padding-bottom: 240rpx; }
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
.page-title { display: block; font-size: 34rpx; font-weight: 700; color: #fff; }
.page-sub { display: block; font-size: 20rpx; color: rgba(255,255,255,0.82); margin-top: 4rpx; }
.header-link {
  flex-shrink: 0; font-size: 22rpx; color: #fff; padding: 8rpx 18rpx; border-radius: 999rpx;
  background: rgba(255,255,255,0.18); border: 1rpx solid rgba(255,255,255,0.35);
}

.container { padding: 20rpx 24rpx 0; }
.hero-card {
  display: flex; gap: 20rpx; background: #fff; border-radius: 24rpx; padding: 20rpx;
  box-shadow: 0 10rpx 28rpx rgba(18,168,160,0.1);
}
.hero-cover {
  width: 200rpx; height: 200rpx; border-radius: 18rpx; flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6rpx;
}
.hero-cover-icon { font-size: 64rpx; line-height: 1; }
.hero-cover-label { font-size: 19rpx; opacity: 0.72; }
.hero-info { flex: 1; min-width: 0; }
.hero-title-row { display: flex; align-items: flex-start; gap: 10rpx; }
.hero-name { flex: 1; font-size: 32rpx; font-weight: 700; color: #0B3B48; }
.tag { flex-shrink: 0; font-size: 18rpx; padding: 4rpx 10rpx; border-radius: 8rpx; }
.tag.otc { color: #27AE60; background: #E9F9F0; }
.tag.rx { color: #EB5757; background: #FDECEC; }
.hero-generic { display: block; font-size: 22rpx; color: #8E9AAB; margin-top: 8rpx; }
.hero-meta { display: flex; align-items: center; gap: 12rpx; margin-top: 12rpx; }
.cate { font-size: 20rpx; color: #12A8A0; background: #E8F7F5; border-radius: 8rpx; padding: 3rpx 12rpx; }
.stock { font-size: 20rpx; color: #8E9AAB; }
.stock.empty { color: #EB5757; }
.hero-price { display: block; font-size: 36rpx; font-weight: 700; color: #EB5757; margin-top: 16rpx; }
.price-unit { font-size: 20rpx; font-weight: 400; color: #9AA7B2; }

.card { background: #fff; border-radius: 20rpx; padding: 22rpx; margin-top: 18rpx; box-shadow: 0 8rpx 24rpx rgba(18,168,160,0.07); }
.card-title { display: block; font-size: 26rpx; font-weight: 700; color: #0B3B48; margin-bottom: 10rpx; }
.card-text { font-size: 23rpx; color: #4C6670; line-height: 1.8; }
.card-text.warning { color: #A94A32; }
.symptom-list { display: flex; flex-wrap: wrap; gap: 10rpx; }
.symptom-chip { font-size: 20rpx; color: #127F79; background: #EFF9F8; border-radius: 8rpx; padding: 4rpx 12rpx; }

.qty-card {
  display: flex; align-items: center; gap: 16rpx;
  background: #fff; border-radius: 20rpx; padding: 20rpx 22rpx; margin-top: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(18,168,160,0.07);
}
.qty-label { font-size: 24rpx; color: #24414A; }
.stepper { display: flex; align-items: center; gap: 6rpx; background: #F3F8F9; border-radius: 999rpx; padding: 4rpx; }
.step { width: 52rpx; height: 52rpx; border-radius: 50%; background: #fff; color: #12A8A0; font-size: 30rpx; display: flex; align-items: center; justify-content: center; }
.step.disabled { color: #C6D2D8; }
.qty-val { min-width: 52rpx; text-align: center; font-size: 26rpx; font-weight: 700; color: #0B3B48; }
.qty-total { margin-left: auto; font-size: 22rpx; color: #8E9AAB; }
.total-num { font-size: 28rpx; font-weight: 700; color: #EB5757; }

.safety-card { margin-top: 18rpx; background: #FFF9F2; border: 1rpx solid #FCE7CE; border-radius: 18rpx; padding: 20rpx 22rpx; }
.safety-title { display: block; font-size: 24rpx; font-weight: 700; color: #B7791F; }
.safety-text { display: block; font-size: 21rpx; color: #A9752E; line-height: 1.7; margin-top: 8rpx; }

.bottom-bar {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
  background: #fff; box-shadow: 0 -6rpx 24rpx rgba(11,59,72,0.08);
}
.bottom-inner {
  display: flex; align-items: center; gap: 18rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
}
.price-box { flex: 1; }
.bottom-price { display: block; font-size: 34rpx; font-weight: 700; color: #EB5757; }
.bottom-sub { display: block; font-size: 20rpx; color: #9AA7B2; }
.order-btn {
  padding: 20rpx 56rpx; border-radius: 999rpx; color: #fff; font-size: 27rpx; font-weight: 600;
  background: linear-gradient(135deg, #12A8A0, #2D9CDB);
  box-shadow: 0 8rpx 20rpx rgba(45,156,219,0.25);
}
.order-btn.disabled { background: #DCE5E9; color: #93A5AE; box-shadow: none; }

.loading { padding: 120rpx 0; text-align: center; font-size: 24rpx; color: #9AA7B2; }

.modal-mask { position: fixed; inset: 0; background: rgba(6,32,40,0.45); display: flex; align-items: center; justify-content: center; z-index: 99; }
.modal { width: 600rpx; background: #fff; border-radius: 24rpx; padding: 32rpx 28rpx 24rpx; box-sizing: border-box; }
.modal-title { display: block; text-align: center; font-size: 32rpx; font-weight: 700; color: #0B3B48; }
.modal-drug { display: flex; align-items: center; gap: 16rpx; margin: 24rpx 0 8rpx; }
.modal-cover {
  width: 96rpx; height: 96rpx; border-radius: 14rpx; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.modal-cover-icon { font-size: 44rpx; line-height: 1; }
.modal-name { display: block; font-size: 28rpx; font-weight: 700; color: #24414A; }
.modal-desc { display: block; font-size: 22rpx; color: #8E9AAB; margin-top: 6rpx; }
.modal-row { display: flex; justify-content: space-between; padding: 10rpx 0; font-size: 24rpx; }
.modal-label { color: #8E9AAB; }
.modal-val { color: #24414A; font-weight: 700; }
.modal-val.minus { color: #EB5757; }
.modal-tip { display: block; font-size: 21rpx; color: #9AA7B2; margin-top: 10rpx; line-height: 1.6; }
.modal-actions { display: flex; gap: 16rpx; margin-top: 24rpx; }
.modal-btn { flex: 1; text-align: center; padding: 20rpx 0; border-radius: 999rpx; font-size: 26rpx; }
.modal-btn.ghost { background: #F2F6F7; color: #5A6B75; }
.modal-btn.primary { background: linear-gradient(135deg, #12A8A0, #2D9CDB); color: #fff; }
.modal-btn.disabled { opacity: 0.5; }

@media screen and (min-width: 750px) {
  .detail-page { padding-bottom: 160px; }
  .header { margin: 18px 0 0; padding: 18px 24px; border-radius: 16px; }
  .header-top { gap: 14px; }
  .back-btn { width: 34px; height: 34px; font-size: 22px; }
  .page-title { font-size: 22px; }
  .page-sub { font-size: 13px; margin-top: 3px; }
  .header-link { font-size: 13px; padding: 6px 14px; }
  .container { padding: 18px 0 0; }
  .hero-card { padding: 18px; border-radius: 16px; gap: 18px; }
  .hero-cover { width: 150px; height: 150px; border-radius: 12px; gap: 5px; }
  .hero-cover-icon { font-size: 48px; }
  .hero-cover-label { font-size: 12px; }
  .hero-name { font-size: 22px; }
  .tag { font-size: 11px; padding: 3px 8px; }
  .hero-generic { font-size: 13px; margin-top: 6px; }
  .hero-meta { margin-top: 8px; gap: 10px; }
  .cate { font-size: 12px; padding: 2px 9px; }
  .stock { font-size: 12px; }
  .hero-price { font-size: 24px; margin-top: 12px; }
  .price-unit { font-size: 12px; }
  .card { padding: 18px 20px; margin-top: 14px; border-radius: 14px; }
  .card-title { font-size: 15px; margin-bottom: 8px; }
  .card-text { font-size: 13px; line-height: 1.8; }
  .symptom-chip { font-size: 12px; padding: 3px 9px; }
  .qty-card { padding: 14px 20px; margin-top: 14px; border-radius: 14px; }
  .qty-label { font-size: 14px; }
  .step { width: 32px; height: 32px; font-size: 18px; }
  .qty-val { min-width: 32px; font-size: 15px; }
  .qty-total { font-size: 13px; }
  .total-num { font-size: 17px; }
  .safety-card { margin-top: 14px; border-radius: 12px; padding: 14px 18px; }
  .safety-title { font-size: 14px; }
  .safety-text { font-size: 12px; }
  .bottom-inner { max-width: 1080px; margin: 0 auto; padding: 12px 28px calc(12px + env(safe-area-inset-bottom)); gap: 18px; }
  .bottom-price { font-size: 24px; }
  .bottom-sub { font-size: 12px; }
  .order-btn { padding: 12px 40px; font-size: 15px; }
  .loading { font-size: 13px; padding: 60px 0; }
  .modal { width: 420px; border-radius: 16px; padding: 24px 24px 20px; }
  .modal-title { font-size: 18px; }
  .modal-cover { width: 56px; height: 56px; border-radius: 10px; }
  .modal-cover-icon { font-size: 28px; }
  .modal-name { font-size: 16px; }
  .modal-desc { font-size: 12px; }
  .modal-row { font-size: 14px; padding: 7px 0; }
  .modal-tip { font-size: 12px; }
  .modal-actions { margin-top: 18px; gap: 12px; }
  .modal-btn { padding: 12px 0; font-size: 14px; }
}
@media screen and (min-width: 1136px) {
  .bottom-inner { padding-left: 0; padding-right: 0; }
}
</style>
