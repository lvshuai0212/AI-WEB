const express = require('express')
const jsonServer = require('json-server')
const path = require('path')
const config = require('./config')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '2mb' }))

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

function buildDoubaoInput(messages) {
  return messages
    .filter(m => m.role !== 'system')
    .map(msg => ({
      type: 'message',
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      status: 'completed',
      content: msg.role === 'assistant'
        ? [{ type: 'output_text', text: msg.content }]
        : [{ type: 'input_text', text: msg.content }]
    }))
}

function getSystemInstructions(messages) {
  const sys = messages.find(m => m.role === 'system')
  return sys ? sys.content : config.SYSTEM_PROMPT
}

async function callDoubaoChat(messages) {
  const chatUrl = config.DOUBAO_API_URL.replace('/responses', '/chat/completions')
  const chatMessages = [
    // 未显式传入 system 时，注入健康医疗场景提示词
    ...(messages.some(m => m.role === 'system') ? [] : [{ role: 'system', content: config.SYSTEM_PROMPT }]),
    ...messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
      content: m.content
    }))
  ]

  let response = await fetch(chatUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.DOUBAO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.DOUBAO_MODEL,
      messages: chatMessages
    })
  })

  let data = await response.json()
  if (response.ok) {
    const text = data.choices?.[0]?.message?.content
    if (text) return { reply: text, raw: data }
  }

  // fallback: responses API
  response = await fetch(config.DOUBAO_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.DOUBAO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.DOUBAO_MODEL,
      instructions: getSystemInstructions(messages),
      input: buildDoubaoInput(messages)
    })
  })

  data = await response.json()
  if (!response.ok) {
    throw new Error(data.error?.message || data.message || '豆包 API 调用失败')
  }

  const reply = extractReply(data)
  if (!reply) throw new Error('未能解析 AI 回复')
  return { reply, raw: data }
}

function extractReply(data) {
  if (!data) return ''
  if (typeof data.output_text === 'string') return data.output_text
  if (Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item.type === 'message' && Array.isArray(item.content)) {
        const texts = item.content
          .filter(c => c.type === 'output_text' || c.type === 'text')
          .map(c => c.text || c.output_text || '')
          .filter(Boolean)
        if (texts.length) return texts.join('\n')
      }
      if (item.type === 'output_text' && item.text) return item.text
    }
  }
  if (data.choices && data.choices[0]) {
    const c = data.choices[0].message || data.choices[0]
    if (c.content) return typeof c.content === 'string' ? c.content : JSON.stringify(c.content)
  }
  if (data.result && typeof data.result === 'string') return data.result
  return ''
}

// ===== 药库：AI 推荐范围与安全拦截 =====
// 需要立即就医的危险信号
const EMERGENCY_RE = /胸痛|胸闷(剧烈|持续|难忍)|呼吸困难|喘不上气|窒息|意识模糊|意识不清|昏迷|抽搐|高热不退|高烧不退|持续高烧|大出血|吐血|便血|剧烈腹痛|晕倒|晕厥|偏瘫|言语不清|口角歪斜/
// 特殊人群：不直接荐药，引导就医
const SPECIAL_RE = /孕|怀孕|哺乳|婴儿|新生儿|宝宝|小孩|孩子|患儿|幼儿|婴幼儿|小朋友|儿童/

const DRUG_DISCLAIMER = '以上内容仅供参考，不能替代医生面诊；如症状持续或加重请及时就医。'

// 只把「已上架 + OTC + 有库存」的药品作为可推荐范围，并按症状关键词筛出候选
function pickCandidateDrugs(drugs, text) {
  const list = (drugs || []).filter(d => d.status === 'on' && d.otc && Number(d.stock) > 0)
  const t = String(text || '')
  const scored = list.map(d => {
    let score = 0
    ;(d.symptoms || []).forEach(s => { if (s && t.includes(s)) score += 3 })
    if (d.name && t.includes(d.name)) score += 5
    if (d.genericName && t.includes(d.genericName)) score += 5
    if (d.category && t.includes(d.category)) score += 2
    return { d, score }
  }).sort((a, b) => b.score - a.score)

  const hit = scored.filter(x => x.score > 0).slice(0, 6).map(x => x.d)
  if (hit.length) return hit
  // 无关键词命中：给一组最常见的感冒/解热/胃肠 OTC 作参考，是否推荐仍由模型判断
  return list.filter(d => ['解热镇痛', '感冒用药', '胃肠用药'].includes(d.category)).slice(0, 6)
}

function buildDrugContext(candidates) {
  return candidates.map(d =>
    `- id=${d.id}｜${d.name}（${d.genericName}）｜${d.category}｜症状关键词：${(d.symptoms || []).join('、')}` +
    `｜规格：${d.spec}｜价格：¥${d.price}｜用法：${d.usage}｜禁忌：${d.contraindications}｜适用人群：${d.audience}｜库存：${d.stock}`
  ).join('\n')
}

function buildDrugRules(candidates, referOnly) {
  if (referOnly) {
    return `\n【安全限制】用户描述涉及危急症状或孕产妇/儿童等特殊人群。禁止推荐任何药品、不要出现具体药名，必须明确建议立即就医或拨打 120，特殊人群还应提示咨询医师。最后单独一行输出：<DRUGS>[]</DRUGS>`
  }
  return `\n【药品推荐规则】
1. 只能从下面的「可选药品」中推荐，且只能是 OTC 非处方药；绝不可推荐处方药，也不得编造药品。
2. 不诊断疾病、不给处方剂量；先用通俗语言说明可能原因和护理建议（不超过200字）。
3. 症状不明确、超出可选范围或无需用药时，不要推荐药品。
4. 正文结束后单独一行输出结构化推荐：<DRUGS>[{"id":药品id,"reason":"一句话推荐理由"}]</DRUGS>；若没有推荐则输出 <DRUGS>[]</DRUGS>。

可选药品（均为已上架、有库存的 OTC）：
${buildDrugContext(candidates) || '（暂无可用药品）'}`
}

function parseDrugTag(reply) {
  const raw = String(reply || '')
  const m = raw.match(/<DRUGS>([\s\S]*?)<\/DRUGS>/i)
  if (!m) return { text: raw.trim(), recs: null }
  let recs = []
  try {
    const arr = JSON.parse(m[1].trim())
    if (Array.isArray(arr)) recs = arr
  } catch { recs = null }
  return { text: raw.replace(m[0], '').trim(), recs }
}

function toDrugCards(recs, candidates) {
  const allowed = new Map(candidates.map(d => [String(d.id), d]))
  const seen = new Set()
  const cards = []
  for (const r of recs || []) {
    const d = allowed.get(String(r && r.id))
    if (!d || seen.has(String(d.id))) continue
    seen.add(String(d.id))
    cards.push({
      id: d.id, name: d.name, genericName: d.genericName, spec: d.spec, price: d.price,
      usage: d.usage, contraindications: d.contraindications, audience: d.audience,
      stock: d.stock, cover: d.cover, category: d.category,
      reason: (r && r.reason) || ''
    })
  }
  return cards
}

app.post('/chat', async (req, res) => {
  try {
    if (!config.DOUBAO_API_KEY) {
      return res.status(503).json({ error: '服务端未配置豆包 API Key，请在 robot-server/config.js 中填写 DOUBAO_API_KEY' })
    }
    const { messages } = req.body
    if (!messages || !Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: 'messages 不能为空' })
    }

    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUser || !lastUser.content) {
      return res.status(400).json({ error: '缺少用户消息' })
    }

    const text = String(lastUser.content)
    const state = router.db.getState()
    const emergency = EMERGENCY_RE.test(text)
    const special = SPECIAL_RE.test(text)
    const referOnly = emergency || special
    const candidates = referOnly ? [] : pickCandidateDrugs(state.drugs || [], text)

    const sysExtra = buildDrugRules(candidates, referOnly)
    const sysIndex = messages.findIndex(m => m.role === 'system')
    const finalMessages = messages.map(m => ({ role: m.role, content: m.content }))
    if (sysIndex >= 0) {
      finalMessages[sysIndex].content = `${finalMessages[sysIndex].content}\n${sysExtra}`
    } else {
      finalMessages.unshift({ role: 'system', content: `${config.SYSTEM_PROMPT}\n${sysExtra}` })
    }

    const { reply, raw } = await callDoubaoChat(finalMessages)
    const parsed = parseDrugTag(reply)

    let cards = referOnly ? [] : toDrugCards(parsed.recs, candidates)
    // 模型未按格式输出时兜底：正文点名的候选药才出卡
    if (!referOnly && parsed.recs === null && candidates.length) {
      const mentioned = candidates.filter(d => parsed.text.includes(d.name))
      cards = toDrugCards(mentioned.map(d => ({ id: d.id, reason: '根据你的症状，可作为参考' })), candidates)
    }

    let body = parsed.text
    if (referOnly) {
      const warn = emergency
        ? '⚠️ 你描述的情况可能属于需要紧急处理的情况，请立即前往医院或拨打 120，本次不提供用药推荐。'
        : '⚠️ 孕产妇、婴幼儿及儿童用药需由医生评估，本次不提供用药推荐，请尽快就医或咨询医师。'
      body = `${warn}\n\n${body}`
    }
    if (!body.includes('仅供参考')) body = `${body}\n\n${DRUG_DISCLAIMER}`

    res.json({ reply: body, recommend: cards, emergency, special, raw })
  } catch (err) {
    console.error('Chat proxy error:', err)
    res.status(500).json({ error: err.message || '服务器内部错误' })
  }
})

app.get('/chat/health', (req, res) => {
  res.json({ ok: true, model: config.DOUBAO_MODEL, configured: !!config.DOUBAO_API_KEY })
})

const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults({
  static: path.join(__dirname, 'image'),
  noCors: true
})

// 积分兑换：校验积分与库存后扣减，并写入兑换记录（落盘 db.json）
// 直接操作 json-server 的 lowdb 实例，保证接口读到的数据与落盘数据一致
app.post('/exchange', (req, res) => {
  const { userId, goodsId } = req.body || {}
  const db = router.db
  const state = db.getState()
  const user = (state.users || []).find(u => String(u.id) === String(userId))
  const goods = (state.goods || []).find(g => String(g.id) === String(goodsId))
  if (!user || !goods) return res.status(404).json({ ok: false, message: '用户或商品不存在' })
  if (Number(goods.stock) <= 0) return res.status(400).json({ ok: false, message: '该礼品已兑完' })
  const points = Number(user.totalPoints) || 0
  if (points < Number(goods.points)) {
    return res.status(400).json({ ok: false, message: `积分不足，还差 ${Number(goods.points) - points} 分` })
  }
  user.totalPoints = points - Number(goods.points)
  goods.stock = Number(goods.stock) - 1
  goods.redeemed = (Number(goods.redeemed) || 0) + 1
  const record = {
    id: Date.now(),
    userId: user.id,
    userName: user.nickname,
    goodsId: goods.id,
    goodsName: goods.name,
    points: Number(goods.points),
    cover: goods.cover,
    status: '兑换成功',
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  }
  state.exchanges = state.exchanges || []
  state.exchanges.unshift(record)
  db.write()
  res.json({ ok: true, data: record, totalPoints: user.totalPoints })
})

// 药品下单：校验库存/上架/OTC → 扣库存 → 生成订单（落盘 db.json）
app.post('/drug-orders', (req, res) => {
  const { userId, items } = req.body || {}
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ ok: false, message: '请选择要购买的药品' })
  }
  const db = router.db
  const state = db.getState()
  const user = (state.users || []).find(u => String(u.id) === String(userId))
  if (!user) return res.status(404).json({ ok: false, message: '用户不存在' })

  // 同一药品多行合并数量
  const merged = new Map()
  for (const it of items) {
    const qty = Math.max(1, parseInt(it && it.qty, 10) || 1)
    merged.set(String(it && it.drugId), (merged.get(String(it && it.drugId)) || 0) + qty)
  }

  const lines = []
  for (const [drugId, qty] of merged) {
    const drug = (state.drugs || []).find(d => String(d.id) === drugId)
    if (!drug) return res.status(404).json({ ok: false, message: '药品不存在' })
    if (drug.status !== 'on') return res.status(400).json({ ok: false, message: `「${drug.name}」已下架` })
    if (!drug.otc) return res.status(400).json({ ok: false, message: `「${drug.name}」为处方药，请凭医生处方到院购买` })
    if (Number(drug.stock) < qty) {
      return res.status(400).json({ ok: false, message: `「${drug.name}」库存不足，仅剩 ${Math.max(0, Number(drug.stock))} 件` })
    }
    lines.push({ drug, qty })
  }

  lines.forEach(({ drug, qty }) => { drug.stock = Number(drug.stock) - qty })
  const totalAmount = Math.round(lines.reduce((sum, { drug, qty }) => sum + Number(drug.price) * qty, 0) * 100) / 100
  const order = {
    id: Date.now(),
    orderNo: 'DD' + String(Date.now()).slice(-10),
    userId: user.id,
    userName: user.nickname,
    items: lines.map(({ drug, qty }) => ({
      drugId: drug.id, name: drug.name, spec: drug.spec, price: Number(drug.price), qty, cover: drug.cover, category: drug.category
    })),
    totalAmount,
    status: '待发货',
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  }
  state.drugOrders = state.drugOrders || []
  state.drugOrders.unshift(order)
  db.write()
  res.json({ ok: true, data: order })
})

app.use(middlewares)
app.use(router)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Health Server running at http://0.0.0.0:${PORT}`)
  console.log(`  REST API  +  AI Chat POST /chat`)
  console.log(`  AI Key 已配置: ${config.DOUBAO_API_KEY ? '是' : '否（请填写 config.js）'}\n`)
})
