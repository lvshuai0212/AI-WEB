module.exports = {
  // 请在此处填写你自己的豆包（火山方舟）API Key，或使用环境变量 DOUBAO_API_KEY 注入
  DOUBAO_API_KEY: process.env.DOUBAO_API_KEY || '',
  DOUBAO_API_URL: process.env.DOUBAO_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/responses',
  DOUBAO_MODEL: process.env.DOUBAO_MODEL || 'doubao-seed-evolving',
  SYSTEM_PROMPT: '你是「社区健康守护」小程序的 AI 健康顾问，主要解答高血压、糖尿病等慢病日常管理、合理饮食、科学运动、用药注意事项和健康科普方面的问题。回答要通俗易懂，适合中老年居民阅读，每次回复控制在200字以内；涉及诊断、处方调整或急症时，必须提示用户及时就医或拨打120，不得给出具体处方剂量。'
}
