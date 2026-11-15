<template>
  <view class="detail-page" v-if="article">
    <view class="hero">
      <image class="hero-img" :src="getCover(article.id)" mode="aspectFill" />
      <view class="hero-mask"></view>
      <view class="back-btn" @click="goBack">‹</view>
      <view class="hero-content">
        <text class="hero-title">{{ article.title }}</text>
        <view class="hero-meta">
          <text class="hero-tag">{{ article.category }}</text>
          <text>{{ article.duration }}</text>
          <text>·</text>
          <text>{{ article.readCount || 0 }} 阅读</text>
        </view>
      </view>
    </view>

    <view class="container">
      <view class="card summary-card">
        <text class="summary-label">内容提要</text>
        <text class="summary-text">{{ article.summary }}</text>
      </view>

      <view class="card">
        <text class="section-title">科普正文</text>
        <text class="article-content">{{ article.content }}</text>
        <view class="publish">发布于 {{ article.publishDate }}</view>
      </view>

      <!-- 健康打卡 -->
      <view class="card checkin-card">
        <view class="card-head">
          <text class="section-title">健康打卡</text>
          <text class="points-tip">完成可得 {{ checkinPoints }} 积分</text>
        </view>

        <view class="form-row">
          <view class="form-label">血压</view>
          <view class="bp-inputs">
            <input class="num-input" type="number" v-model="metrics.systolic" placeholder="收缩压" :disabled="checked" />
            <text class="slash">/</text>
            <input class="num-input" type="number" v-model="metrics.diastolic" placeholder="舒张压" :disabled="checked" />
            <text class="unit">mmHg</text>
          </view>
        </view>
        <view class="form-row">
          <view class="form-label">血糖</view>
          <view class="bp-inputs">
            <input class="num-input wide" type="digit" v-model="metrics.bloodSugar" placeholder="空腹血糖" :disabled="checked" />
            <text class="unit">mmol/L</text>
          </view>
        </view>
        <view class="form-row">
          <view class="form-label">体重</view>
          <view class="bp-inputs">
            <input class="num-input wide" type="digit" v-model="metrics.weight" placeholder="今日体重" :disabled="checked" />
            <text class="unit">kg</text>
          </view>
        </view>
        <view class="form-row">
          <view class="form-label">步数</view>
          <view class="bp-inputs">
            <input class="num-input wide" type="number" v-model="metrics.steps" placeholder="今日步数" :disabled="checked" />
            <text class="unit">步</text>
          </view>
        </view>

        <view class="checkin-btn" :class="{ disabled: checked, shake: shaking }" @click="handleCheckin">
          {{ checked ? '✓ 今日已完成打卡' : '完成健康打卡 +' + checkinPoints + '积分' }}
        </view>
        <text class="form-tip">请如实填写，数据将同步至家庭医生随访档案</text>
      </view>

      <view class="card">
        <text class="section-title">推荐阅读</text>
        <view class="rec-item" v-for="r in recommend" :key="r.id" @click="goDetail(r.id)">
          <text class="rec-title">{{ r.title }}</text>
          <text class="rec-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="float-points" v-if="showFloat">+{{ checkinPoints }} 积分</view>
  </view>

  <view class="loading" v-else>
    <text>加载中...</text>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getKnowledgeById, getKnowledge, getCurrentUser, getUserCheckins, doCheckin, checkLogin, markKnowledgeRead } from '../../utils/api.js'

const article = ref(null)
const allKnowledge = ref([])
const checked = ref(false)
const shaking = ref(false)
const showFloat = ref(false)
const checkinPoints = 10
const metrics = reactive({ systolic: '', diastolic: '', bloodSugar: '', weight: '', steps: '' })

const recommend = computed(() =>
  allKnowledge.value.filter(k => k.id !== article.value?.id && k.status === 'published').slice(0, 3)
)

function getCover(id) { return `/static/image/${((id - 1) % 9) + 1}.jpg` }

function todayStr() { return new Date().toISOString().split('T')[0] }

// 同一次会话内同一篇只计一次阅读：H5 用 sessionStorage（刷新仍算同一会话），小程序用内存标记
const viewedInSession = new Set()
function viewedKey(id) { return 'knowledgeRead:' + id }
function hasViewed(id) {
  if (viewedInSession.has(String(id))) return true
  try { return sessionStorage.getItem(viewedKey(id)) === '1' } catch (e) { return false }
}
function rememberViewed(id) {
  viewedInSession.add(String(id))
  try { sessionStorage.setItem(viewedKey(id), '1') } catch (e) {}
}

async function loadDetail(id) {
  article.value = await getKnowledgeById(id)
  if (!hasViewed(id)) {
    rememberViewed(id)
    markKnowledgeRead(id)
      .then(r => { if (article.value && r && r.ok) article.value.readCount = r.readCount })
      .catch(() => {})
  }
  allKnowledge.value = await getKnowledge()
  const user = getCurrentUser()
  if (user?.id) {
    const list = await getUserCheckins(user.id)
    const todayRecord = list.filter(c => c.knowledgeId === Number(id) && c.checkDate === todayStr()).pop()
    checked.value = !!todayRecord
    if (todayRecord) {
      metrics.systolic = todayRecord.systolic || ''
      metrics.diastolic = todayRecord.diastolic || ''
      metrics.bloodSugar = todayRecord.bloodSugar || ''
      metrics.weight = todayRecord.weight || ''
      metrics.steps = todayRecord.steps || ''
    }
  }
}

function validate() {
  const s = Number(metrics.systolic); const d = Number(metrics.diastolic)
  if (!s || !d) return '请填写血压'
  if (s < 60 || s > 250 || d < 30 || d > 150) return '血压数值超出合理范围'
  if (metrics.bloodSugar && (Number(metrics.bloodSugar) < 2 || Number(metrics.bloodSugar) > 30)) return '血糖数值超出合理范围'
  if (metrics.weight && (Number(metrics.weight) < 20 || Number(metrics.weight) > 200)) return '体重数值超出合理范围'
  return ''
}

async function handleCheckin() {
  if (checked.value) return
  if (!checkLogin()) return
  const err = validate()
  if (err) {
    shaking.value = true
    setTimeout(() => { shaking.value = false }, 400)
    return uni.showToast({ title: err, icon: 'none' })
  }
  const user = getCurrentUser()
  uni.showLoading({ title: '打卡中...' })
  try {
    const res = await doCheckin(user.id, article.value.id, metrics)
    uni.hideLoading()
    checked.value = true
    showFloat.value = true
    setTimeout(() => { showFloat.value = false }, 1600)
    uni.showModal({
      title: '打卡成功',
      content: `获得 ${res.points} 健康积分，已连续打卡 ${res.continuousDays} 天`,
      showCancel: false,
      confirmText: '好的'
    })
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: e.message || '打卡失败', icon: 'none' })
  }
}

function goBack() { uni.navigateBack() }
function goDetail(id) { uni.navigateTo({ url: '/pages/knowledge/detail?id=' + id }) }

onLoad((options) => {
  if (!checkLogin()) return
  const id = options?.id || 1
  loadDetail(id).catch(() => uni.showToast({ title: '加载失败', icon: 'none' }))
})
</script>

<style scoped>
.detail-page { min-height: 100vh; padding-bottom: 40rpx; }
.hero { position: relative; height: 360rpx; margin: 20rpx 24rpx 0; border-radius: 24rpx; overflow: hidden; }
.hero-img { width: 100%; height: 100%; display: block; }
.hero-mask { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.12), rgba(8,42,58,0.82)); }
.back-btn { position: absolute; top: 20rpx; left: 20rpx; width: 56rpx; height: 56rpx; border-radius: 50%; background: rgba(255,255,255,0.24); color: #fff; font-size: 38rpx; display: flex; align-items: center; justify-content: center; padding-bottom: 6rpx; }
.hero-content { position: absolute; left: 24rpx; right: 24rpx; bottom: 24rpx; }
.hero-title { font-size: 38rpx; font-weight: 700; color: #fff; line-height: 1.35; display: block; }
.hero-meta { display: flex; align-items: center; gap: 12rpx; margin-top: 12rpx; font-size: 22rpx; color: rgba(255,255,255,0.85); }
.hero-tag { background: rgba(18,168,160,0.9); padding: 4rpx 14rpx; border-radius: 10rpx; }

.container { padding: 0 24rpx; margin-top: 20rpx; }
.card { background: #fff; border-radius: 24rpx; padding: 28rpx; margin-bottom: 24rpx; box-shadow: 0 8rpx 28rpx rgba(18,168,160,0.1); }
.summary-card { background: linear-gradient(135deg, #E6F5F4, #EAF3FB); }
.summary-label { font-size: 24rpx; color: #12A8A0; font-weight: 700; display: block; }
.summary-text { font-size: 26rpx; color: #456; line-height: 1.7; margin-top: 10rpx; display: block; }
.section-title { font-size: 32rpx; font-weight: 700; color: #0B3B48; }
.article-content { font-size: 29rpx; color: #3A4A55; line-height: 2; display: block; margin-top: 18rpx; }
.publish { font-size: 22rpx; color: #bbb; margin-top: 24rpx; text-align: right; }

.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.points-tip { font-size: 22rpx; color: #F2994A; background: #FFF3E0; padding: 6rpx 16rpx; border-radius: 20rpx; }
.form-row { display: flex; align-items: center; margin-bottom: 20rpx; }
.form-label { width: 100rpx; font-size: 26rpx; color: #666; }
.bp-inputs { flex: 1; display: flex; align-items: center; gap: 10rpx; background: #F5F9FA; border-radius: 14rpx; padding: 12rpx 20rpx; }
.num-input { width: 130rpx; font-size: 28rpx; color: #24414A; text-align: center; }
.num-input.wide { flex: 1; text-align: left; }
.slash { color: #bbb; }
.unit { font-size: 22rpx; color: #999; margin-left: auto; }
.checkin-btn { margin-top: 28rpx; background: linear-gradient(135deg, #12A8A0, #2D9CDB); color: #fff; text-align: center; padding: 24rpx 0; border-radius: 50rpx; font-size: 30rpx; font-weight: 600; box-shadow: 0 8rpx 24rpx rgba(18,168,160,0.3); }
.checkin-btn.disabled { background: #E8F5E9; color: #27AE60; box-shadow: none; }
.form-tip { display: block; text-align: center; font-size: 21rpx; color: #aaa; margin-top: 16rpx; }

.rec-item { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #F5F5F5; }
.rec-item:last-child { border-bottom: none; }
.rec-title { font-size: 27rpx; color: #3A4A55; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rec-arrow { color: #ccc; font-size: 32rpx; }

.loading { display: flex; align-items: center; justify-content: center; height: 60vh; color: #999; font-size: 26rpx; }
.float-points { position: fixed; left: 50%; bottom: 30%; transform: translateX(-50%); background: rgba(18,168,160,0.94); color: #fff; font-size: 32rpx; font-weight: 700; padding: 16rpx 40rpx; border-radius: 40rpx; animation: floatUp 1.6s ease forwards; z-index: 99; }

@media screen and (min-width: 750px) {
  .detail-page { padding-bottom: 32px; }
  .hero { height: 300px; margin: 18px 0 0; border-radius: 16px; }
  .back-btn { top: 16px; left: 16px; width: 36px; height: 36px; font-size: 24px; padding-bottom: 3px; }
  .hero-content { left: 20px; right: 20px; bottom: 18px; }
  .hero-title { font-size: 24px; }
  .hero-meta { gap: 8px; margin-top: 8px; font-size: 13px; }
  .hero-tag { padding: 3px 10px; border-radius: 6px; }
  .container { padding: 0; margin-top: 18px; }
  .card { padding: 20px; border-radius: 16px; margin-bottom: 16px; }
  .summary-label { font-size: 13px; }
  .summary-text { font-size: 14px; margin-top: 6px; }
  .section-title { font-size: 17px; }
  .article-content { font-size: 16px; line-height: 1.8; margin-top: 12px; }
  .publish { font-size: 12px; margin-top: 16px; }
  .card-head { margin-bottom: 16px; }
  .points-tip { font-size: 12px; padding: 3px 10px; }
  .form-row { margin-bottom: 14px; }
  .form-label { width: 64px; font-size: 14px; }
  .bp-inputs { gap: 8px; border-radius: 10px; padding: 8px 14px; }
  .num-input { width: 90px; font-size: 15px; }
  .unit { font-size: 12px; }
  .checkin-btn { margin-top: 20px; padding: 14px 0; font-size: 16px; border-radius: 999px; }
  .form-tip { font-size: 12px; margin-top: 10px; }
  .rec-item { padding: 14px 0; }
  .rec-title { font-size: 15px; }
  .rec-arrow { font-size: 22px; }
}
</style>
