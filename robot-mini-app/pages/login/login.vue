<template>
  <view class="login-page">
    <view class="bg-decoration">
      <view class="circle c1"></view>
      <view class="circle c2"></view>
      <view class="circle c3"></view>
    </view>

    <view class="login-container">
      <view class="brand fade-in">
        <image class="logo" src="/static/image/logo.jpg" mode="aspectFill" />
        <text class="app-name">社区健康守护</text>
        <text class="app-slogan">每日记录健康数据 · 科学管理慢病</text>
      </view>

      <view class="form-card fade-in">
        <view class="tabs">
          <view class="tab" :class="{ active: mode === 'login' }" @click="mode = 'login'">登录</view>
          <view class="tab" :class="{ active: mode === 'register' }" @click="mode = 'register'">建档</view>
        </view>

        <view class="input-group">
          <text class="input-icon">📱</text>
          <input class="input" v-model="form.phone" placeholder="请输入手机号" maxlength="11" type="number" />
        </view>

        <view class="input-group" v-if="mode === 'register'">
          <text class="input-icon">👤</text>
          <input class="input" v-model="form.nickname" placeholder="请输入姓名" />
        </view>

        <view class="input-group" v-if="mode === 'register'">
          <text class="input-icon">🏘️</text>
          <input class="input" v-model="form.className" placeholder="所属社区，如：康乐社区" />
        </view>

        <view class="input-group" v-if="mode === 'register'">
          <text class="input-icon">🩺</text>
          <input class="input" v-model="form.chronicTags" placeholder="慢病标签，如高血压，无则填「无」" />
        </view>

        <view class="input-group">
          <text class="input-icon">🔒</text>
          <input class="input" v-model="form.password" placeholder="请输入密码" password />
        </view>

        <view class="btn-primary login-btn" :class="{ shake: shaking }" @click="handleSubmit">
          {{ mode === 'login' ? '登录' : '完成建档' }}
        </view>

        <view class="hint">
          <text v-if="mode === 'login'">演示账号：13800138002 / 123456</text>
          <text v-else>建档后即可开始健康打卡</text>
        </view>
      </view>

      <view class="footer">
        <text>社区健康守护 · 慢病随访与健康科普</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { loginUser, registerUser } from '../../utils/api.js'

const mode = ref('login')
const shaking = ref(false)
const form = reactive({
  phone: '13800138002',
  password: '123456',
  nickname: '',
  className: '康乐社区',
  chronicTags: '无'
})

function showError(msg) {
  shaking.value = true
  setTimeout(() => { shaking.value = false }, 400)
  uni.showToast({ title: msg, icon: 'none' })
}

async function handleSubmit() {
  if (!form.phone || !form.password) return showError('请填写手机号和密码')
  if (mode.value === 'register' && !form.nickname) return showError('请填写姓名')

  uni.showLoading({ title: mode.value === 'login' ? '登录中...' : '建档中...' })
  try {
    if (mode.value === 'login') {
      const user = await loginUser(form.phone, form.password)
      uni.hideLoading()
      uni.showToast({ title: `欢迎，${user.nickname}`, icon: 'success' })
      setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 800)
    } else {
      const newUser = await registerUser(form)
      uni.hideLoading()
      uni.setStorageSync('userInfo', newUser)
      uni.setStorageSync('isLogin', true)
      uni.showToast({ title: '建档成功', icon: 'success' })
      setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 800)
    }
  } catch (e) {
    uni.hideLoading()
    showError(e.message || '操作失败')
  }
}
</script>

<style scoped>
.login-page { min-height: 100vh; background: linear-gradient(160deg, #0B3B48 0%, #12A8A0 55%, #2D9CDB 100%); position: relative; overflow: hidden; }
.bg-decoration .circle { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.06); }
.circle.c1 { width: 500rpx; height: 500rpx; top: -140rpx; right: -140rpx; }
.circle.c2 { width: 300rpx; height: 300rpx; bottom: 120rpx; left: -80rpx; }
.circle.c3 { width: 200rpx; height: 200rpx; top: 40%; right: 40rpx; background: rgba(255,255,255,0.05); }

.login-container { position: relative; z-index: 1; padding: 120rpx 48rpx 40rpx; display: flex; flex-direction: column; min-height: 100vh; }
.brand { display: flex; flex-direction: column; align-items: center; margin-bottom: 56rpx; }
.logo { width: 132rpx; height: 132rpx; border-radius: 32rpx; border: 4rpx solid rgba(255,255,255,0.65); box-shadow: 0 12rpx 36rpx rgba(0,0,0,0.2); }
.app-name { font-size: 46rpx; font-weight: 700; color: #fff; margin-top: 24rpx; letter-spacing: 2rpx; }
.app-slogan { font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 12rpx; }

.form-card { background: rgba(255,255,255,0.98); border-radius: 32rpx; padding: 40rpx 36rpx; box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.16); }
.tabs { display: flex; margin-bottom: 36rpx; border-bottom: 1rpx solid #EEF2F3; }
.tab { flex: 1; text-align: center; padding: 18rpx 0; font-size: 30rpx; color: #999; position: relative; }
.tab.active { color: #12A8A0; font-weight: 600; }
.tab.active::after { content: ''; position: absolute; bottom: 0; left: 30%; width: 40%; height: 6rpx; border-radius: 3rpx; background: linear-gradient(90deg, #12A8A0, #2D9CDB); }

.input-group { display: flex; align-items: center; background: #F5F9FA; border-radius: 16rpx; padding: 24rpx 24rpx; margin-bottom: 24rpx; }
.input-icon { font-size: 34rpx; margin-right: 16rpx; }
.input { flex: 1; font-size: 30rpx; color: #24414A; }

.login-btn { margin-top: 32rpx; }
.hint { text-align: center; margin-top: 24rpx; font-size: 22rpx; color: #aaa; }
.footer { margin-top: auto; text-align: center; font-size: 22rpx; color: rgba(255,255,255,0.7); padding-top: 48rpx; }

@media screen and (min-width: 750px) {
  .login-container { max-width: 420px; margin: 0 auto; padding: 56px 0 32px; box-sizing: border-box; }
  .brand { margin-bottom: 28px; }
  .logo { width: 76px; height: 76px; border-radius: 18px; border-width: 3px; }
  .app-name { font-size: 24px; margin-top: 14px; letter-spacing: 1px; }
  .app-slogan { font-size: 13px; margin-top: 7px; }
  .form-card { padding: 24px 22px; border-radius: 20px; }
  .tabs { margin-bottom: 20px; }
  .tab { padding: 10px 0; font-size: 16px; }
  .tab.active::after { height: 3px; border-radius: 2px; }
  .input-group { padding: 13px 14px; margin-bottom: 14px; border-radius: 10px; }
  .input-icon { font-size: 18px; margin-right: 9px; }
  .input { font-size: 15px; }
  .login-btn { margin-top: 18px; }
  .hint { margin-top: 14px; font-size: 12px; }
  .footer { padding-top: 24px; font-size: 12px; }
}
</style>
