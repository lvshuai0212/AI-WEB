// API 基础地址
// H5 开发直连 json-server（避免 vite 代理 500）；微信小程序真机请改为本机局域网 IP
// #ifdef H5
const BASE_URL = 'http://127.0.0.1:3000'
// #endif
// #ifndef H5
const BASE_URL = 'http://127.0.0.1:3000'
// #endif

export { BASE_URL }

export function request(options) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          const err = new Error(`请求失败(${res.statusCode})`)
          err.statusCode = res.statusCode
          err.response = res
          reject(err)
        }
      },
      fail: (err) => {
        const netErr = new Error('网络请求失败，请确认 robot-server 已启动')
        netErr.isNetworkError = true
        netErr.original = err
        reject(netErr)
      }
    })
  })
}

export function getUsers() {
  return request({ url: '/users' })
}

export function getUserById(id) {
  return request({ url: '/users/' + id })
}

export function createUser(data) {
  return request({ url: '/users', method: 'POST', data })
}

export function updateUser(id, data) {
  return request({ url: '/users/' + id, method: 'PUT', data })
}

export function getKnowledge() {
  return request({ url: '/knowledge' })
}

export function getKnowledgeById(id) {
  return request({ url: '/knowledge/' + id })
}

export function getCheckins() {
  return request({ url: '/checkins' })
}

export function createCheckin(data) {
  return request({ url: '/checkins', method: 'POST', data })
}

export function getBanners() {
  return request({ url: '/banners' }).then(list =>
    (list || []).filter(b => b.status !== 'inactive').sort((a, b) => (a.sort || 0) - (b.sort || 0))
  )
}

export function getNotices() {
  return request({ url: '/notices' }).then(list =>
    (list || []).filter(n => n.status === 'published').sort((a, b) => b.publishDate.localeCompare(a.publishDate))
  )
}

export function loginUser(phone, password) {
  return getUsers().then(users => {
    if (!Array.isArray(users)) {
      throw new Error('服务端数据异常，请检查 robot-server 是否正常运行')
    }
    const user = users.find(u => String(u.phone) === String(phone) && u.password === password)
    if (user) {
      uni.setStorageSync('userInfo', user)
      uni.setStorageSync('isLogin', true)
      return user
    }
    const err = new Error('手机号或密码错误')
    err.isAuthError = true
    throw err
  })
}

export function registerUser(data) {
  return getUsers().then(users => {
    if (users.find(u => u.phone === data.phone)) {
      throw new Error('该手机号已建档')
    }
    const newUser = {
      phone: data.phone,
      password: data.password,
      nickname: data.nickname || '新居民',
      gender: data.gender || '女',
      age: data.age || 60,
      className: data.className || '康乐社区',
      chronicTags: data.chronicTags || '无',
      totalPoints: 0,
      continuousDays: 0,
      totalCheckins: 0,
      registerTime: new Date().toISOString(),
      avatar: ''
    }
    return createUser(newUser)
  })
}

export function logout() {
  uni.removeStorageSync('userInfo')
  uni.removeStorageSync('isLogin')
}

export function getCurrentUser() {
  return uni.getStorageSync('userInfo') || null
}

// 无头像时按姓名生成文字头像：首字 + 由姓名决定的稳定底色
export function avatarInitial(name) {
  const n = String(name || '').trim()
  return n ? n.slice(0, 1) : '?'
}

export function avatarColor(name) {
  const palette = ['#12A8A0', '#2D9CDB', '#F2994A', '#9B51E0', '#EB5757', '#27AE60', '#0B7C8A', '#C0824A']
  const n = String(name || '')
  let sum = 0
  for (let i = 0; i < n.length; i++) sum += n.charCodeAt(i)
  return palette[sum % palette.length]
}

// 后端头像为 /image/xxx.jpg，H5 静态资源在 /static/image 下
export function resolveAvatar(avatar) {
  const a = String(avatar || '').trim()
  if (!a) return ''
  return a.startsWith('/image/') ? '/static/image/' + a.slice('/image/'.length) : a
}

export { resolveAvatar as assetUrl }

// 积分商城：商品列表 / 兑换记录 / 兑换
export function getGoods() {
  return request({ url: '/goods' })
}

export function getExchangeRecords() {
  return request({ url: '/exchanges' })
}

export function exchangeGoods(userId, goodsId) {
  return request({ url: '/exchange', method: 'POST', data: { userId, goodsId } })
}

// 药库：药品列表 / 详情 / 下单 / 我的药品订单
export function getDrugs() {
  return request({ url: '/drugs' })
}

export function getDrugById(id) {
  return request({ url: '/drugs/' + id })
}

export function createDrugOrder(userId, items) {
  return request({ url: '/drug-orders', method: 'POST', data: { userId, items } })
}

export function getDrugOrders() {
  return request({ url: '/drugOrders' })
}

/** 药品分类封面：用分类图标 + 分类色，避免实拍图与药品不符 */
const DRUG_COVER_MAP = {
  '感冒用药': { icon: '🤧', bg: '#EAF3FF', color: '#3D6FD4' },
  '解热镇痛': { icon: '🌡️', bg: '#FFF1E6', color: '#D97706' },
  '胃肠用药': { icon: '🥣', bg: '#FFF7E6', color: '#B7791F' },
  '抗过敏': { icon: '🌿', bg: '#E9F9F0', color: '#219653' },
  '外用': { icon: '🩹', bg: '#FDECEC', color: '#C0392B' },
  '维生素': { icon: '🍊', bg: '#FFF6DA', color: '#B9770E' },
  '止咳化痰': { icon: '🫖', bg: '#F0F4FF', color: '#5B6ABF' },
  '抗感染': { icon: '💊', bg: '#FDECEC', color: '#C0392B' },
  '慢病处方': { icon: '❤️', bg: '#FFEDF1', color: '#C2185B' }
}

export function drugCoverMeta(category) {
  return DRUG_COVER_MAP[category] || { icon: '💊', bg: '#EFF9F8', color: '#127F79' }
}

export function isLoggedIn() {
  return !!uni.getStorageSync('isLogin')
}

export function checkLogin() {
  if (!isLoggedIn()) {
    uni.navigateTo({ url: '/pages/login/login' })
    return false
  }
  return true
}

export function getUserCheckins(userId) {
  return getCheckins().then(list => list.filter(c => c.userId === userId))
}

export function getClassRanking(className) {
  return getUsers().then(users => {
    return users
      .filter(u => u.className === className)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((u, index) => ({ ...u, rank: index + 1 }))
  })
}

/** 豆包 AI 健康问答（经后端代理），返回 { reply, recommend, emergency } */
export function chatWithAI(messages) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + '/chat',
      method: 'POST',
      data: { messages },
      header: { 'Content-Type': 'application/json' },
      timeout: 90000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data?.reply) {
          resolve(res.data)
        } else {
          const err = new Error(res.data?.error || `AI 请求失败(${res.statusCode})`)
          reject(err)
        }
      },
      fail: (err) => reject(new Error('网络请求失败，请确认 robot-server 已启动'))
    })
  })
}

/**
 * 完成一次健康打卡
 * metrics: { systolic, diastolic, bloodSugar, weight, steps }
 */
export function doCheckin(userId, knowledgeId, metrics = {}) {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()
  const recordTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return Promise.all([getUserById(userId), getCheckins(), getKnowledgeById(knowledgeId)])
    .then(([user, checkins, knowledge]) => {
      const todayCheckin = checkins.find(
        c => c.userId === userId && c.knowledgeId === knowledgeId && c.checkDate === today
      )
      if (todayCheckin) {
        throw new Error('今日已完成该健康任务')
      }

      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const yesterdayCheckin = checkins.find(c => c.userId === userId && c.checkDate === yesterday)
      const continuousDays = yesterdayCheckin ? (user.continuousDays || 0) + 1 : 1

      let points = 10
      if (continuousDays >= 3) {
        points += 5
      }

      const checkinData = {
        userId,
        knowledgeId,
        checkDate: today,
        recordTime,
        systolic: Number(metrics.systolic) || null,
        diastolic: Number(metrics.diastolic) || null,
        bloodSugar: Number(metrics.bloodSugar) || null,
        weight: Number(metrics.weight) || null,
        steps: Number(metrics.steps) || 0,
        points,
        status: 'completed',
        note: metrics.note || ''
      }

      return createCheckin(checkinData).then(() => {
        return updateUser(userId, {
          ...user,
          totalPoints: (user.totalPoints || 0) + points,
          continuousDays,
          totalCheckins: (user.totalCheckins || 0) + 1
        }).then(updatedUser => {
          uni.setStorageSync('userInfo', updatedUser)
          return { points, continuousDays, knowledge }
        })
      })
    })
}
