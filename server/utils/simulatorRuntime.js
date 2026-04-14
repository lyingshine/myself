function createSimulatorRuntime(ctx) {
  function summarizeComposition() {
    const sessions = Array.from(ctx.getActiveSessions().values())
    const total = sessions.length || 1
    const activeVeterans = sessions.filter((s) => s.type === 'ACTIVE_VETERAN').length
    const silentVeterans = sessions.filter((s) => s.type === 'SILENT_VETERAN').length
    const newUsers = sessions.filter((s) => s.type === 'NEW_USER').length
    const visitors = sessions.filter((s) => s.type === 'VISITOR').length

    return {
      activeVeterans,
      silentVeterans,
      newUsers,
      visitors,
      activePct: ((activeVeterans / total) * 100).toFixed(1),
      silentPct: ((silentVeterans / total) * 100).toFixed(1),
      newPct: ((newUsers / total) * 100).toFixed(1),
      visitorPct: ((visitors / total) * 100).toFixed(1)
    }
  }

  async function reconnectSessions() {
    const lastData = ctx.readSessionFile()
    if (!lastData.active.length) return

    console.log(`[Sim] 正在恢复上次在线会话：${lastData.active.length} 个`)

    const reconnectPromises = lastData.active.map(async (saved) => {
      try {
        if (saved.username === 'visitor') return

        const profile = ctx.getRegisteredUsers().find((u) => u.username === saved.username)
        if (!profile || ctx.getActiveSessions().has(profile.id)) return

        const data = await ctx.apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: profile.username, password: ctx.getStockPassword() })
        })

        if (data?.success) {
          profile.token = data.data.token
          profile.refreshToken = data.data.refreshToken || null
          profile.dbUserId = Number(data?.data?.user?.id || profile.dbUserId || 0)
          ctx.rememberUser(profile)
          ctx.ensureSocialCircle(profile)
          profile.loginCount = (profile.loginCount || 0) + 1
          profile.userType = saved.type || ctx.inferUserType(profile)

          const session = new ctx.Session(profile, profile.userType)
          ctx.getActiveSessions().set(profile.id, session)
          ctx.getStats().logins += 1
          session.run().then(() => ctx.getActiveSessions().delete(profile.id))
        }
      } catch (_err) {
        // ignore reconnect errors
      }
    })

    await Promise.allSettled(reconnectPromises)
    console.log(`[Sim] 已恢复在线用户：${ctx.getActiveSessions().size} 个`)
  }

  async function startSimulator() {
    if (ctx.isRunning() && ctx.isPaused()) {
      resumeSimulator()
      return
    }
    if (ctx.isRunning()) return

    ctx.setIsRunning(true)
    ctx.setIsPaused(false)
    ctx.setPausedAt(0)
    ctx.incrementEpoch()
    ctx.resetStats()
    ctx.resetForStart()

    const currentScale = ctx.getCurrentScale()
    console.log(`[Sim] 启动压测模拟器，当前预设：${currentScale.label}`)
    console.log(
      `[Sim] 配置：注册用户池 ${currentScale.maxRegisteredUsers.toLocaleString()} | 峰值在线目标 ${currentScale.peakOnlineUsers.toLocaleString()} | 估算峰值请求 ${ctx.estimateTargetRpm(currentScale).toLocaleString()} rpm | 最大并发请求 ${currentScale.concurrentRequests}`
    )
    console.log(`[Sim] 说明：${currentScale.description}`)
    console.log(`[Sim] 游客占比 ${(currentScale.visitorRatio * 100).toFixed(1)}% | 写入倍率 ${currentScale.writeMultiplier.toFixed(2)}x`)
    console.log('[Sim] 已禁用恢复机制：本次从空状态启动')

    const seed = await ctx.getSeedStatus()
    if (!seed.ready) {
      ctx.setIsRunning(false)
      throw new Error(
        `请先生成初始数据：当前模拟用户 ${seed.users}，文章 ${seed.articles}，动态 ${seed.statuses}，要求文章/动态至少 ${seed.targetContent}`
      )
    }

    await ctx.loadSimUsersFromDb()

    for (let i = 0; i < ctx.getLoginWorkers(); i += 1) {
      ctx.scheduleLogins()
    }
    ctx.scheduleVisitors()

    const statsInterval = setInterval(() => {
      const stats = ctx.getStats()
      const elapsed = (Date.now() - stats.startTime) / 1000
      const apm = ((stats.articles / elapsed) * 60).toFixed(0)
      const spm = ((stats.statuses / elapsed) * 60).toFixed(0)
      const bpm = ((stats.browses / elapsed) * 60).toFixed(0)
      const errRate = stats.totalRequests > 0 ? ((stats.failedRequests / stats.totalRequests) * 100).toFixed(1) : 0
      const c = summarizeComposition()
      const scale = ctx.getCurrentScale()

      console.log(
        `[Sim] 注册用户 ${ctx.getRegisteredUsers().length.toLocaleString()} | 在线 ${ctx.getActiveSessions().size.toLocaleString()} (` +
          `活跃老用户 ${c.activeVeterans} (${c.activePct}%) / 沉默老用户 ${c.silentVeterans} (${c.silentPct}%) / 新用户 ${c.newUsers} (${c.newPct}%) / 游客 ${c.visitors} (${c.visitorPct}%)) ` +
          `| 发文 ${apm} 篇/分钟 | 动态 ${spm} 条/分钟 | 浏览 ${bpm} 次/分钟 | 错误率 ${errRate}% | 请求队列 ${ctx.getActiveRequests()}/${ctx.getMaxConcurrent()}`
      )
      console.log(
        `[Sim] 当前预设：${scale.label} | 峰值在线目标：${scale.peakOnlineUsers.toLocaleString()} | 注册用户池：${scale.maxRegisteredUsers.toLocaleString()}`
      )
    }, 30000)
    ctx.getIntervalHandles().add(statsInterval)

    const sessionFlushInterval = setInterval(() => {
      ctx.writeSessionFile().catch(() => {})
    }, 10000)
    ctx.getIntervalHandles().add(sessionFlushInterval)

    const userFlushInterval = setInterval(() => {
      ctx.writeUsersFile().catch(() => {})
    }, 10000)
    ctx.getIntervalHandles().add(userFlushInterval)
  }

  async function stopSimulator(options = {}) {
    const { cleanupGeneratedData = false } = options
    ctx.setIsRunning(false)
    ctx.setIsPaused(false)
    ctx.setPausedAt(0)
    ctx.incrementEpoch()

    for (const session of ctx.getActiveSessions().values()) session.isAlive = false
    ctx.getActiveSessions().clear()
    ctx.setCompletedSessions([])
    ctx.clearLoginInFlight()
    ctx.setActiveRequests(0)

    for (const handle of ctx.getIntervalHandles()) clearInterval(handle)
    ctx.getIntervalHandles().clear()

    await ctx.writeSessionFile().catch(() => {})
    if (cleanupGeneratedData) {
      await ctx.cleanupRunGeneratedData().catch((err) => {
        console.error('[Sim] 清理本轮模拟数据失败:', err?.message || err)
      })
    }
    console.log('[Sim] 模拟器已停止')
  }

  function pauseSimulator() {
    if (!ctx.isRunning() || ctx.isPaused()) return
    ctx.setIsPaused(true)
    ctx.setPausedAt(Date.now())
    console.log('[Sim] 模拟器已暂停')
  }

  function resumeSimulator() {
    if (!ctx.isRunning() || !ctx.isPaused()) return
    const pausedDuration = Math.max(0, Date.now() - ctx.getPausedAt())
    ctx.setIsPaused(false)
    ctx.setPausedAt(0)

    for (const session of ctx.getActiveSessions().values()) {
      session.startTime += pausedDuration
    }
    for (const user of ctx.getRegisteredUsers()) {
      if (user && user.nextLoginAt) {
        user.nextLoginAt += pausedDuration
      }
    }
    ctx.getStats().startTime += pausedDuration
    console.log('[Sim] 模拟器已继续运行')
  }

  function getActiveSessionsSnapshot() {
    if (!ctx.isRunning()) return []
    const data = ctx.readSessionFile()
    return data.active
  }

  function getCompletedSessionsSnapshot() {
    if (!ctx.isRunning()) return []
    const data = ctx.readSessionFile()
    return data.completed
  }

  function getRuntimeStats() {
    const stats = ctx.getStats()
    const scale = ctx.getCurrentScale()
    const elapsed = Math.max(1, (Date.now() - stats.startTime) / 1000)

    return {
      state: ctx.isRunning() ? (ctx.isPaused() ? 'paused' : 'running') : 'stopped',
      running: ctx.isRunning(),
      paused: ctx.isPaused(),
      scale: scale.label,
      presetId: scale.id,
      description: scale.description,
      peakOnlineTarget: scale.peakOnlineUsers,
      maxRegisteredUsers: scale.maxRegisteredUsers,
      targetPeakRpm: ctx.estimateTargetRpm(scale),
      controls: {
        baseRegistrationRate: scale.baseRegistrationRate,
        baseLoginRate: scale.baseLoginRate,
        concurrentRequests: scale.concurrentRequests,
        actionMultiplier: scale.actionMultiplier,
        actionIntervalMultiplier: scale.actionIntervalMultiplier,
        sessionDurationMultiplier: scale.sessionDurationMultiplier,
        cooldownMultiplier: scale.cooldownMultiplier,
        visitorRatio: scale.visitorRatio,
        writeMultiplier: scale.writeMultiplier
      },
      queue: {
        active: ctx.getActiveRequests(),
        limit: ctx.getMaxConcurrent()
      },
      valve: {
        intake: ctx.getIntakeValve().value,
        p95LatencyMs: ctx.getIntakeValve().lastPressure.p95LatencyMs,
        errorRate: ctx.getIntakeValve().lastPressure.errorRate,
        queueUsage: ctx.getIntakeValve().lastPressure.queueUsage,
        target: ctx.getIntakeValve().lastPressure.target,
        loginIntake: ctx.getLoginValveState().value,
        loginP95LatencyMs: ctx.getLoginValveState().lastP95,
        loginErrorRate: ctx.getLoginValveState().lastErrorRate,
        loginInFlight: ctx.getLoginInFlight().size,
        loginCap: Math.max(1, Math.floor(ctx.getLoginWorkers() * ctx.getLoginValve()))
      },
      totals: {
        registrations: stats.registrations,
        logins: stats.logins,
        articles: stats.articles,
        statuses: stats.statuses,
        browses: stats.browses,
        likes: stats.likes,
        requests: stats.totalRequests,
        failedRequests: stats.failedRequests
      },
      ratesPerMinute: {
        articles: (stats.articles / elapsed) * 60,
        statuses: (stats.statuses / elapsed) * 60,
        browses: (stats.browses / elapsed) * 60
      },
      errorRate: stats.totalRequests > 0 ? stats.failedRequests / stats.totalRequests : 0
    }
  }

  return {
    reconnectSessions,
    startSimulator,
    stopSimulator,
    pauseSimulator,
    resumeSimulator,
    getActiveSessionsSnapshot,
    getCompletedSessionsSnapshot,
    getRuntimeStats
  }
}

module.exports = {
  createSimulatorRuntime
}
