const fs = require('fs')
const path = require('path')

// 读取本地 .env（未入库），零依赖实现；已存在的进程环境变量优先级更高
function loadDotEnv() {
  const file = path.join(__dirname, '.env')
  if (!fs.existsSync(file)) return
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

loadDotEnv()

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  // 豆包（火山方舟）API Key：环境变量优先，其次 robot-server/.env，仓库内不保存真实 Key
  DOUBAO_API_KEY: process.env.DOUBAO_API_KEY || '',
  DOUBAO_API_URL: process.env.DOUBAO_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/responses',
  DOUBAO_MODEL: process.env.DOUBAO_MODEL || 'doubao-seed-evolving',
  SYSTEM_PROMPT: '你是「社区健康守护」小程序的 AI 健康顾问，主要解答高血压、糖尿病等慢病日常管理、合理饮食、科学运动、用药注意事项和健康科普方面的问题。回答要通俗易懂，适合中老年居民阅读，每次回复控制在200字以内；涉及诊断、处方调整或急症时，必须提示用户及时就医或拨打120，不得给出具体处方剂量。'
}
