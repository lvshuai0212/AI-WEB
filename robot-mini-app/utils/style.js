/** 健康提醒类型 -> wxss 安全 class（微信小程序不支持中文 class 名） */
export function noticeTypeClass(type) {
  const map = {
    '服药提醒': 'type-med',
    '复诊提醒': 'type-visit',
    '体检通知': 'type-exam'
  }
  return map[type] || 'type-default'
}
