function createSimulatorControl(ctx) {
  function getAvailablePresets() {
    return Object.values(ctx.getLoadPresets()).map((preset) => ({
      id: preset.id,
      label: preset.label,
      description: preset.description,
      maxRegisteredUsers: preset.maxRegisteredUsers,
      peakOnlineTarget: preset.peakOnlineUsers,
      targetPeakRpm: ctx.estimateTargetRpm(preset)
    }))
  }

  async function applyPreset(presetId) {
    const preset = ctx.getLoadPresets()[presetId]
    if (!preset) {
      throw new Error(`Unknown load preset: ${presetId}`)
    }

    const wasRunning = ctx.isRunning()
    if (wasRunning) await ctx.stopSimulator({ cleanupGeneratedData: false })

    ctx.setCurrentScale(ctx.sanitizeConfig(ctx.resolvePreset(presetId)))

    if (wasRunning) await ctx.startSimulator()
    return ctx.getRuntimeStats()
  }

  async function updateConfig(partialConfig = {}) {
    const wasRunning = ctx.isRunning()
    if (wasRunning) await ctx.stopSimulator({ cleanupGeneratedData: false })

    ctx.setCurrentScale(ctx.sanitizeConfig({
      ...ctx.getCurrentScale(),
      ...partialConfig,
      id: 'custom',
      label: '自定义压测',
      description: '当前正在使用自定义调速参数。'
    }))

    if (wasRunning) await ctx.startSimulator()
    return ctx.getRuntimeStats()
  }

  return {
    getAvailablePresets,
    applyPreset,
    updateConfig
  }
}

module.exports = {
  createSimulatorControl
}
