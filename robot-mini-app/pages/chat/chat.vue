<template>
  <view class="chat-page">
    <view class="chat-header">
      <view class="back" @click="goBack">‹</view>
      <view class="ai-avatar">
        <text class="ai-avatar-emoji">🩺</text>
      </view>
      <view class="header-info">
        <text class="ai-name">AI 健康顾问</text>
        <view class="status">
          <view class="dot"></view>
          <text class="status-text">在线 · 慢病管理与健康咨询</text>
        </view>
      </view>
      <text class="clear" @click="clearHistory">清空</text>
    </view>

    <scroll-view class="chat-body" scroll-y :scroll-into-view="scrollToId" scroll-with-animation @scroll="onScroll">
      <view class="welcome-card" v-if="messages.length <= 1">
        <view class="welcome-icon">🩺</view>
        <text class="welcome-title">你好，我是豆包 AI 健康顾问</text>
        <text class="welcome-desc">高血压、糖尿病等慢病管理，饮食运动建议、用药注意事项都可以问我。回答仅供参考，不能替代医生面诊。</text>
        <text class="quick-label">你可以这样问</text>
        <view class="quick-list">
          <view class="quick-item" v-for="(q, i) in quickQuestions" :key="i" @click="sendQuick(q)">
            <text class="quick-text">{{ q }}</text>
            <text class="quick-arrow">›</text>
          </view>
        </view>
      </view>

      <view v-for="(msg, i) in messages" :key="i" :id="'msg-' + i" class="msg-block">
        <view class="msg-row" :class="msg.role">
          <view class="bubble-avatar" v-if="msg.role === 'assistant'">
            <text class="bubble-avatar-emoji">🩺</text>
          </view>
          <view class="bubble" :class="[msg.role, { error: msg.error, emergency: msg.emergency }]">
            <text class="bubble-text">{{ msg.content }}</text>
            <view class="retry" v-if="msg.error" @click="retry(msg)">
              <text class="retry-text">重新发送 ›</text>
            </view>
          </view>
          <image class="bubble-avatar img" v-if="msg.role === 'user' && hasUserAvatar" :src="userAvatar" mode="aspectFill" />
          <view class="bubble-avatar bubble-avatar-text" v-else-if="msg.role === 'user'" :style="{ background: userColor }">{{ userInitial }}</view>
        </view>

        <view class="drug-cards" v-if="msg.recommend && msg.recommend.length">
          <view class="drug-cards-head">
            <text class="drug-cards-title">可参考的 OTC 药品</text>
            <text class="drug-cards-tip">按需购买 · 请阅读说明书</text>
          </view>
          <view class="drug-card" v-for="d in msg.recommend" :key="d.id">
            <view class="drug-cover" :style="{ background: coverMeta(d.category).bg, color: coverMeta(d.category).color }">
              <text class="drug-cover-icon">{{ coverMeta(d.category).icon }}</text>
            </view>
            <view class="drug-main">
              <view class="drug-name-row">
                <text class="drug-name">{{ d.name }}</text>
                <text class="otc-tag">OTC</text>
              </view>
              <text class="drug-spec">{{ d.genericName }} · {{ d.spec }}</text>
              <text class="drug-reason" v-if="d.reason">{{ d.reason }}</text>
              <text class="drug-usage">用法：{{ d.usage }}</text>
              <text class="drug-warn">禁忌：{{ d.contraindications }}</text>
              <view class="drug-bottom">
                <view class="drug-price-box">
                  <text class="drug-price">¥{{ d.price }}</text>
                  <text class="drug-stock" :class="{ empty: d.stock <= 0 }">{{ d.stock > 0 ? '库存 ' + d.stock : '暂时缺货' }}</text>
                </view>
                <view class="buy-btn" :class="{ disabled: d.stock <= 0 }" @click="goDrug(d)">去下单</view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="msg-row assistant" v-if="sending">
        <view class="bubble-avatar">
          <text class="bubble-avatar-emoji">🩺</text>
        </view>
        <view class="bubble assistant typing">
          <view class="typing-dots"><text></text><text></text><text></text></view>
          <text class="typing-text">正在整理健康建议</text>
        </view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>

    <view class="scroll-down" v-if="showScrollBtn" @click="jumpToBottom">
      <text class="scroll-down-text">回到最新 ↓</text>
    </view>

    <view class="chat-input-bar">
      <view class="input-shell">
        <input class="chat-input" v-model="inputText" placeholder="描述你的健康问题…" confirm-type="send"
          :disabled="sending" @confirm="sendMessage" />
        <view class="send-btn" :class="{ active: canSend, sending }" @click="sendMessage">
          {{ sending ? '发送中' : '发送' }}
        </view>
      </view>
      <text class="input-hint">内容由 AI 生成，仅供参考，如有不适请及时就医</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { onLoad, onReady } from '@dcloudio/uni-app'
import { chatWithAI, getCurrentUser, drugCoverMeta, resolveAvatar, avatarInitial, avatarColor } from '../../utils/api.js'

const WELCOME = '你好，我是「社区健康守护」的 AI 健康顾问。可以问我慢病日常管理、饮食运动、用药注意事项等问题。如有胸痛、呼吸困难、意识不清等急症，请立即拨打 120。'
// 旧版本未配置 Key 时写入本地缓存的失败提示，加载时清理
const OLD_ERROR_RE = /豆包 API Key|无法回复，请确认 robot-server/

const messages = ref([{ role: 'assistant', content: WELCOME }])
const inputText = ref('')
const sending = ref(false)
const scrollToId = ref('')
const showScrollBtn = ref(false)

let bodyHeight = 0

const coverMeta = drugCoverMeta
const currentUser = computed(() => getCurrentUser())
const userAvatar = computed(() => resolveAvatar(currentUser.value?.avatar))
const hasUserAvatar = computed(() => !!userAvatar.value)
const userInitial = computed(() => avatarInitial(currentUser.value?.nickname))
const userColor = computed(() => avatarColor(currentUser.value?.nickname))
const canSend = computed(() => !!inputText.value.trim() && !sending.value)

const quickQuestions = [
  '感冒鼻塞可以吃什么药？',
  '高血压日常要注意什么？',
  '血糖偏高应该怎么吃？',
  '老年人适合什么运动？',
  '忘记吃降压药怎么办？'
]

function scrollToBottom() {
  nextTick(() => {
    scrollToId.value = 'msg-' + (messages.value.length - 1)
    showScrollBtn.value = false
  })
}

function onScroll(e) {
  const d = e.detail || {}
  const remain = (d.scrollHeight || 0) - (d.scrollTop || 0) - bodyHeight
  showScrollBtn.value = remain > 160
}

function jumpToBottom() {
  scrollToBottom()
}

async function request(text) {
  sending.value = true
  scrollToBottom()
  try {
    const history = messages.value
      .filter(m => !m.error)
      .map(m => ({ role: m.role, content: m.content }))
    const reply = await chatWithAI(history)
    messages.value.push({
      role: 'assistant',
      content: reply.reply,
      recommend: Array.isArray(reply.recommend) ? reply.recommend : [],
      emergency: !!reply.emergency
    })
    uni.setStorageSync('healthChatHistory', messages.value.slice(-30))
  } catch (e) {
    const msg = e.message || 'AI 服务暂时不可用'
    messages.value.push({
      role: 'assistant',
      error: true,
      retry: text,
      content: msg.includes('API Key')
        ? '服务端尚未配置豆包 API Key，请在 robot-server/config.js 中填写后重启服务。'
        : '抱歉，健康顾问暂时无法回复，请确认 robot-server 已启动后重试。'
    })
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

async function doSend(text) {
  if (!text || sending.value) return
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  await request(text)
}

function retry(msg) {
  if (sending.value) return
  const idx = messages.value.indexOf(msg)
  if (idx >= 0) messages.value.splice(idx, 1)
  request(msg.retry)
}

function sendMessage() {
  if (!canSend.value) return
  doSend(inputText.value.trim())
}

function sendQuick(q) {
  if (sending.value) return
  doSend(q)
}

function clearHistory() {
  uni.showModal({
    title: '清空对话',
    content: '确定清空与健康顾问的对话记录吗？',
    success: (res) => {
      if (res.confirm) {
        messages.value = [{ role: 'assistant', content: WELCOME }]
        uni.removeStorageSync('healthChatHistory')
        showScrollBtn.value = false
      }
    }
  })
}

function goDrug(d) {
  if (Number(d.stock) <= 0) return uni.showToast({ title: '该药品暂时缺货', icon: 'none' })
  uni.navigateTo({ url: '/pages/drug/detail?id=' + d.id })
}

function goBack() { uni.navigateBack() }

onLoad(() => {
  const history = uni.getStorageSync('healthChatHistory')
  if (Array.isArray(history) && history.length) {
    // 过滤早期未配置 Key 时留下的失败提示，正常对话保留
    const cleaned = history.filter(m => !(m.role === 'assistant' && OLD_ERROR_RE.test(m.content || '')))
    messages.value = cleaned.length ? cleaned : messages.value
    if (cleaned.length !== history.length) uni.setStorageSync('healthChatHistory', cleaned)
  }
  scrollToBottom()
})

onReady(() => {
  uni.createSelectorQuery()
    .select('.chat-body')
    .boundingClientRect(rect => { if (rect) bodyHeight = rect.height })
    .exec()
})
</script>

<style scoped>
.chat-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #F1F8F9, #E9F3F5);
}

/* 顶部：渐变页头 + 头像白描边 */
.chat-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 84rpx 24rpx 22rpx;
  background: linear-gradient(135deg, #0B7C8A, #12A8A0 58%, #2D9CDB);
  box-shadow: 0 8rpx 24rpx rgba(11, 124, 138, 0.18);
}
.back {
  width: 56rpx; height: 56rpx; border-radius: 50%;
  background: rgba(255, 255, 255, 0.2); color: #fff;
  font-size: 40rpx; display: flex; align-items: center; justify-content: center;
  padding-bottom: 6rpx; flex-shrink: 0;
}
.ai-avatar {
  width: 76rpx; height: 76rpx; border-radius: 50%;
  background: #fff; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 0 4rpx rgba(255, 255, 255, 0.35);
  flex-shrink: 0;
}
.ai-avatar-emoji { font-size: 38rpx; }
.header-info { flex: 1; min-width: 0; }
.ai-name { font-size: 32rpx; font-weight: 700; color: #fff; display: block; letter-spacing: 1rpx; }
.status { display: flex; align-items: center; gap: 8rpx; font-size: 20rpx; color: rgba(255, 255, 255, 0.85); margin-top: 6rpx; }
.status-text { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.dot {
  width: 12rpx; height: 12rpx; border-radius: 50%; background: #38ef7d;
  box-shadow: 0 0 0 0 rgba(56, 239, 125, 0.6);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(56, 239, 125, 0.55); }
  70% { box-shadow: 0 0 0 10rpx rgba(56, 239, 125, 0); }
  100% { box-shadow: 0 0 0 0 rgba(56, 239, 125, 0); }
}
.clear { font-size: 24rpx; color: rgba(255, 255, 255, 0.85); padding: 8rpx 4rpx; }

/* 消息区 */
.chat-body { flex: 1 1 0; min-height: 0; padding: 24rpx; box-sizing: border-box; }
.chat-body :deep(.uni-scroll-view) { height: 100%; scrollbar-width: thin; scrollbar-color: rgba(18, 168, 160, 0.3) transparent; }
.chat-body :deep(.uni-scroll-view)::-webkit-scrollbar { width: 6rpx; height: 6rpx; }
.chat-body :deep(.uni-scroll-view)::-webkit-scrollbar-track { background: transparent; }
.chat-body :deep(.uni-scroll-view)::-webkit-scrollbar-thumb {
  background: rgba(18, 168, 160, 0.25);
  border-radius: 6rpx;
}
.chat-body :deep(.uni-scroll-view)::-webkit-scrollbar-thumb:hover { background: rgba(18, 168, 160, 0.45); }

/* 首屏引导 */
.welcome-card {
  background: #fff;
  border-radius: 26rpx;
  padding: 32rpx 28rpx;
  border: 1rpx solid rgba(18, 168, 160, 0.08);
  box-shadow: 0 10rpx 30rpx rgba(11, 124, 138, 0.08);
  margin-bottom: 28rpx;
}
.welcome-icon {
  width: 72rpx; height: 72rpx; border-radius: 22rpx;
  background: linear-gradient(135deg, #12A8A0, #2D9CDB);
  display: flex; align-items: center; justify-content: center;
  font-size: 36rpx; margin-bottom: 18rpx;
}
.welcome-title { font-size: 30rpx; font-weight: 700; color: #0B3B48; display: block; }
.welcome-desc { font-size: 24rpx; color: #7A8B94; line-height: 1.75; margin-top: 14rpx; display: block; }
.quick-label {
  display: block; font-size: 22rpx; color: #A2B2B9;
  margin: 26rpx 0 12rpx; letter-spacing: 1rpx;
}
.quick-list { display: flex; flex-direction: column; gap: 12rpx; }
.quick-item {
  display: flex; align-items: center; justify-content: space-between;
  background: #F2FAFA; border: 1rpx solid rgba(18, 168, 160, 0.14);
  border-radius: 16rpx; padding: 18rpx 22rpx;
  transition: background 0.2s ease, transform 0.2s ease;
}
.quick-item:active { background: #E4F5F4; transform: scale(0.99); }
.quick-text { font-size: 24rpx; color: #127F79; }
.quick-arrow { font-size: 28rpx; color: #7FC9C4; }

/* 气泡 */
.msg-block { }
.msg-row { display: flex; align-items: flex-start; gap: 14rpx; margin-bottom: 26rpx; }
.msg-row.user { justify-content: flex-end; }
.bubble-avatar {
  width: 64rpx; height: 64rpx; border-radius: 50%;
  background: #fff; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(11, 124, 138, 0.1);
  flex-shrink: 0; overflow: hidden;
}
.bubble-avatar-emoji { font-size: 32rpx; }
.bubble-avatar.img { object-fit: cover; }
.bubble-avatar-text { color: #fff; font-size: 28rpx; font-weight: 700; }
.bubble {
  max-width: 74%;
  padding: 20rpx 24rpx;
  border-radius: 22rpx;
  position: relative;
}
.bubble.assistant {
  background: #fff;
  border: 1rpx solid rgba(18, 168, 160, 0.08);
  border-top-left-radius: 6rpx;
  box-shadow: 0 6rpx 18rpx rgba(11, 59, 72, 0.06);
}
.bubble.user {
  background: linear-gradient(135deg, #12A8A0, #2D9CDB);
  border-top-right-radius: 6rpx;
  box-shadow: 0 6rpx 18rpx rgba(45, 156, 219, 0.22);
}
.bubble-text { font-size: 27rpx; line-height: 1.78; color: #24414A; white-space: pre-wrap; word-break: break-word; }
.bubble.user .bubble-text { color: #fff; }

/* 危急/特殊人群提示 */
.bubble.assistant.emergency { background: #FFF6F4; border-color: #F6CFC4; }
.bubble.assistant.emergency .bubble-text { color: #A94A32; }

/* AI 推荐药卡 */
.drug-cards { margin: -8rpx 0 26rpx 78rpx; max-width: 74%; }
.drug-cards-head { display: flex; align-items: center; gap: 10rpx; margin-bottom: 10rpx; }
.drug-cards-title { font-size: 22rpx; font-weight: 700; color: #127F79; }
.drug-cards-tip { font-size: 19rpx; color: #A9B8BF; }
.drug-card {
  display: flex; gap: 14rpx; background: #fff; border-radius: 18rpx; padding: 16rpx;
  border: 1rpx solid rgba(18,168,160,0.12); box-shadow: 0 6rpx 18rpx rgba(11,59,72,0.06);
  margin-bottom: 12rpx;
}
.drug-cover {
  width: 120rpx; height: 120rpx; border-radius: 14rpx; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.drug-cover-icon { font-size: 52rpx; line-height: 1; }
.drug-main { flex: 1; min-width: 0; }
.drug-name-row { display: flex; align-items: center; gap: 8rpx; }
.drug-name { flex: 1; min-width: 0; font-size: 26rpx; font-weight: 700; color: #0B3B48; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.otc-tag { flex-shrink: 0; font-size: 17rpx; color: #27AE60; background: #E9F9F0; border-radius: 7rpx; padding: 2rpx 8rpx; }
.drug-spec { display: block; font-size: 20rpx; color: #8E9AAB; margin-top: 4rpx; }
.drug-reason { display: block; font-size: 20rpx; color: #127F79; margin-top: 6rpx; line-height: 1.5; }
.drug-usage { display: block; font-size: 20rpx; color: #4C6670; margin-top: 6rpx; line-height: 1.5; }
.drug-warn {
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden;
  font-size: 19rpx; color: #A94A32; margin-top: 4rpx; line-height: 1.5;
}
.drug-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 10rpx; }
.drug-price-box { display: flex; align-items: baseline; gap: 10rpx; }
.drug-price { font-size: 28rpx; font-weight: 700; color: #EB5757; }
.drug-stock { font-size: 19rpx; color: #A8B4BE; }
.drug-stock.empty { color: #EB5757; }
.buy-btn {
  font-size: 21rpx; color: #fff; padding: 8rpx 22rpx; border-radius: 999rpx;
  background: linear-gradient(135deg, #12A8A0, #2D9CDB);
}
.buy-btn.disabled { background: #EEF2F4; color: #A8B4BE; }

/* 失败态 */
.bubble.assistant.error {
  background: #FFF8F6;
  border-color: #F7D9CF;
  box-shadow: none;
}
.bubble.error .bubble-text { color: #A94A32; }
.retry {
  margin-top: 14rpx; padding-top: 14rpx;
  border-top: 1rpx dashed rgba(169, 74, 50, 0.25);
}
.retry-text { font-size: 24rpx; color: #C0563A; font-weight: 600; }

/* 等待回复 */
.bubble.typing { display: flex; align-items: center; gap: 14rpx; padding: 22rpx 26rpx; }
.typing-text { font-size: 23rpx; color: #8FA3AA; }
.typing-dots { display: flex; gap: 8rpx; }
.typing-dots text {
  width: 12rpx; height: 12rpx; border-radius: 50%;
  background: #12A8A0; animation: bounce 1.2s infinite;
}
.typing-dots text:nth-child(2) { animation-delay: 0.2s; }
.typing-dots text:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
  30% { transform: translateY(-8rpx); opacity: 1; }
}
.bottom-space { height: 16rpx; }

/* 回到最新 */
.scroll-down {
  position: absolute;
  right: 28rpx;
  bottom: 190rpx;
  padding: 12rpx 24rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.95);
  border: 1rpx solid rgba(18, 168, 160, 0.18);
  box-shadow: 0 8rpx 22rpx rgba(11, 59, 72, 0.12);
}
.scroll-down-text { font-size: 23rpx; color: #127F79; }

/* 底部输入 */
.chat-input-bar {
  padding: 16rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -6rpx 24rpx rgba(11, 59, 72, 0.06);
}
.input-shell {
  display: flex; align-items: center; gap: 14rpx;
  background: #F3F8F9;
  border: 1rpx solid rgba(18, 168, 160, 0.12);
  border-radius: 44rpx;
  padding: 10rpx 12rpx 10rpx 28rpx;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input-shell:focus-within {
  border-color: rgba(18, 168, 160, 0.5);
  box-shadow: 0 0 0 6rpx rgba(18, 168, 160, 0.1);
}
.chat-input { flex: 1; font-size: 27rpx; color: #24414A; height: 56rpx; line-height: 56rpx; }
.send-btn {
  padding: 16rpx 34rpx; border-radius: 40rpx;
  background: #E4EDEF; color: #7B919A;
  font-size: 26rpx; font-weight: 600;
  transition: background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, transform 0.15s ease;
}
.send-btn.active {
  background: linear-gradient(135deg, #12A8A0, #2D9CDB);
  color: #fff;
  box-shadow: 0 6rpx 16rpx rgba(45, 156, 219, 0.28);
}
.send-btn.active:active { transform: scale(0.97); }
.send-btn.sending { background: linear-gradient(135deg, #8FD3CF, #9CCBE8); color: #fff; }
.input-hint {
  display: block; text-align: center;
  font-size: 20rpx; color: #A9B8BF; margin-top: 10rpx;
}

/* PC：加宽留白、限制气泡行宽 */
@media screen and (min-width: 750px) {
  .chat-body { padding: 28px 32px; }
  .bubble { max-width: 520px; }
  .welcome-card { padding: 26px 28px; border-radius: 18px; }
  .quick-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .msg-row { margin-bottom: 20px; }
  .drug-cards { margin: -4px 0 20px 46px; max-width: 520px; }
  .drug-cards-head { gap: 8px; margin-bottom: 8px; }
  .drug-cards-title { font-size: 13px; }
  .drug-cards-tip { font-size: 11px; }
  .drug-card { padding: 12px; border-radius: 12px; gap: 12px; margin-bottom: 10px; }
  .drug-cover { width: 68px; height: 68px; border-radius: 9px; }
  .drug-cover-icon { font-size: 30px; }
  .drug-name { font-size: 15px; }
  .otc-tag { font-size: 10px; padding: 1px 6px; }
  .drug-spec { font-size: 12px; }
  .drug-reason { font-size: 12px; }
  .drug-usage { font-size: 12px; }
  .drug-warn { font-size: 11px; }
  .drug-price { font-size: 17px; }
  .drug-stock { font-size: 11px; }
  .buy-btn { font-size: 12px; padding: 6px 15px; }
  .chat-input-bar { padding: 14px 32px calc(14px + env(safe-area-inset-bottom)); }
  .scroll-down { right: 32px; bottom: 140px; }
}
</style>
