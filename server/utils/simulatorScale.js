const DEFAULT_PRESET_ID = (process.env.LOAD_PRESET || 'medium').toLowerCase()

const LOAD_PRESETS = {
  low: {
    id: 'low',
    label: '低压',
    description: '适合本地联调，整体节奏保守。',
    maxRegisteredUsers: 10000,
    peakOnlineUsers: 1200,
    baseRegistrationRate: 0.2,
    baseLoginRate: 5,
    concurrentRequests: 120,
    actionMultiplier: 1.2,
    visitorRatio: 0.08,
    sessionDurationMultiplier: 0.9,
    cooldownMultiplier: 1.1,
    actionIntervalMultiplier: 1,
    writeMultiplier: 0.7,
    cohortMix: { ACTIVE_VETERAN: 0.16, SILENT_VETERAN: 0.76, NEW_USER: 0.08 },
    loginBias: { ACTIVE_VETERAN: 2.2, SILENT_VETERAN: 1.0, NEW_USER: 0.9 }
  },
  medium: {
    id: 'medium',
    label: '中压',
    description: '默认压测档，读流量和写流量比较均衡。',
    maxRegisteredUsers: 100000,
    peakOnlineUsers: 12000,
    baseRegistrationRate: 2,
    baseLoginRate: 20,
    concurrentRequests: 900,
    actionMultiplier: 4,
    visitorRatio: 0.12,
    sessionDurationMultiplier: 1,
    cooldownMultiplier: 1,
    actionIntervalMultiplier: 1,
    writeMultiplier: 1,
    cohortMix: { ACTIVE_VETERAN: 0.18, SILENT_VETERAN: 0.72, NEW_USER: 0.1 },
    loginBias: { ACTIVE_VETERAN: 2.4, SILENT_VETERAN: 1.0, NEW_USER: 0.85 }
  },
  high: {
    id: 'high',
    label: '高压',
    description: '明显拉高在线、动作速度和排队压力。',
    maxRegisteredUsers: 1000000,
    peakOnlineUsers: 45000,
    baseRegistrationRate: 6,
    baseLoginRate: 65,
    concurrentRequests: 3200,
    actionMultiplier: 10,
    visitorRatio: 0.18,
    sessionDurationMultiplier: 1.2,
    cooldownMultiplier: 0.75,
    actionIntervalMultiplier: 0.72,
    writeMultiplier: 1.35,
    cohortMix: { ACTIVE_VETERAN: 0.22, SILENT_VETERAN: 0.66, NEW_USER: 0.12 },
    loginBias: { ACTIVE_VETERAN: 2.7, SILENT_VETERAN: 1.0, NEW_USER: 1.05 }
  },
  extreme: {
    id: 'extreme',
    label: '极限',
    description: '尽量把登录、请求和写入速度都压上去。',
    maxRegisteredUsers: 10000000,
    peakOnlineUsers: 120000,
    baseRegistrationRate: 12,
    baseLoginRate: 160,
    concurrentRequests: 9000,
    actionMultiplier: 18,
    visitorRatio: 0.22,
    sessionDurationMultiplier: 1.35,
    cooldownMultiplier: 0.55,
    actionIntervalMultiplier: 0.5,
    writeMultiplier: 1.8,
    cohortMix: { ACTIVE_VETERAN: 0.26, SILENT_VETERAN: 0.6, NEW_USER: 0.14 },
    loginBias: { ACTIVE_VETERAN: 3.0, SILENT_VETERAN: 1.0, NEW_USER: 1.2 }
  }
}

function clonePreset(preset) {
  return JSON.parse(JSON.stringify(preset))
}

function resolvePreset(presetId = DEFAULT_PRESET_ID) {
  if (presetId && LOAD_PRESETS[presetId]) return clonePreset(LOAD_PRESETS[presetId])
  return clonePreset(LOAD_PRESETS.medium)
}

function estimateTargetRpm(config = {}) {
  const onlineFactor = Math.max(1, Number(config.peakOnlineUsers || 0) / 40)
  const speedFactor = Math.max(1, Number(config.actionMultiplier || 1) * (2 - Math.min(1.5, Number(config.actionIntervalMultiplier || 1))))
  const queueFactor = Math.max(1, Number(config.concurrentRequests || 0) / 10)
  return Math.round(Math.min(queueFactor * 60, onlineFactor * speedFactor * 16))
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num))
}

function sanitizeScaleConfig(input = {}, currentScale = {}) {
  const next = {
    ...currentScale,
    ...input
  }

  next.maxRegisteredUsers = Math.max(1000, Math.round(Number(next.maxRegisteredUsers || currentScale.maxRegisteredUsers || 100000)))
  next.peakOnlineUsers = Math.max(10, Math.round(Number(next.peakOnlineUsers || currentScale.peakOnlineUsers || 12000)))
  next.baseRegistrationRate = Math.max(0.05, Number(next.baseRegistrationRate || currentScale.baseRegistrationRate || 2))
  next.baseLoginRate = Math.max(0.5, Number(next.baseLoginRate || currentScale.baseLoginRate || 20))
  next.concurrentRequests = Math.max(10, Math.round(Number(next.concurrentRequests || currentScale.concurrentRequests || 900)))
  next.actionMultiplier = Math.max(0.5, Number(next.actionMultiplier || currentScale.actionMultiplier || 4))
  next.visitorRatio = clamp(Number(next.visitorRatio ?? currentScale.visitorRatio ?? 0.12), 0, 0.9)
  next.sessionDurationMultiplier = Math.max(0.3, Number(next.sessionDurationMultiplier || currentScale.sessionDurationMultiplier || 1))
  next.cooldownMultiplier = Math.max(0.2, Number(next.cooldownMultiplier || currentScale.cooldownMultiplier || 1))
  next.actionIntervalMultiplier = Math.max(0.2, Number(next.actionIntervalMultiplier || currentScale.actionIntervalMultiplier || 1))
  next.writeMultiplier = Math.max(0.1, Number(next.writeMultiplier || currentScale.writeMultiplier || 1))
  next.id = next.id || 'custom'
  next.label = next.label || '自定义压测'
  next.description = next.description || '当前正在使用自定义调速参数。'
  next.estimatedPeakRpm = estimateTargetRpm(next)
  return next
}

module.exports = {
  LOAD_PRESETS,
  resolvePreset,
  estimateTargetRpm,
  sanitizeScaleConfig
}
