function createSimulatorScheduler(ctx) {
  async function waitWhilePaused(epoch) {
    while (ctx.isRunning() && ctx.isPaused() && epoch === ctx.getEpoch()) {
      await ctx.sleep(200)
    }
  }

  async function scheduleRegistrations() {
    const epoch = ctx.getEpoch()
    while (ctx.isRunning() && epoch === ctx.getEpoch()) {
      await waitWhilePaused(epoch)
      if (!ctx.isRunning() || epoch !== ctx.getEpoch()) break

      const scale = ctx.getCurrentScale()
      const baseDelay = 1000 / scale.baseRegistrationRate
      const activity = Math.max(0.8, ctx.getActivityMultiplier())
      const throughputBoost = ctx.getRampBoost()
      const delay = (baseDelay / activity) / (Math.max(0.5, scale.actionMultiplier) * throughputBoost)
      await ctx.sleep(Math.max(15, ctx.randomInt(delay * 0.7, delay * 1.15)))
      if (!ctx.isRunning() || epoch !== ctx.getEpoch()) break
      if (ctx.isPaused()) continue

      const users = ctx.getRegisteredUsers()
      if (users.length >= scale.maxRegisteredUsers) {
        await ctx.sleep(5000)
        continue
      }

      const { username, email } = ctx.generateRegistrationIdentity()
      const data = await ctx.apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username,
          email,
          password: ctx.getStockPassword()
        })
      })

      if (data?.success) {
        ctx.getRunGeneratedUsernames().add(data.data.user.username || username)
        const profile = ctx.enrichProfileAsStockUser(ctx.normalizeUserProfile({
          id: data.data.user.id,
          dbUserId: data.data.user.id,
          username: data.data.user.username,
          token: data.data.token,
          refreshToken: data.data.refreshToken || null,
          loginCount: 0,
          articleCount: 0,
          statusCount: 0,
          browses: 0,
          registrationTime: Date.now(),
          userType: 'NEW_USER',
          nextLoginAt: Date.now() + ctx.getNewUserWarmupMs()
        }))
        users.push(profile)
        ctx.rememberUser(profile)
        ctx.ensureSocialCircle(profile)
        ctx.getStats().registrations += 1
      }
    }
  }

  async function scheduleLogins() {
    const epoch = ctx.getEpoch()
    while (ctx.isRunning() && epoch === ctx.getEpoch()) {
      await waitWhilePaused(epoch)
      if (!ctx.isRunning() || epoch !== ctx.getEpoch()) break

      if (!ctx.canAttemptLoginNow()) {
        await ctx.sleep(20)
        continue
      }

      const scale = ctx.getCurrentScale()
      const baseDelay = 1000 / scale.baseLoginRate
      const activity = Math.max(0.8, ctx.getActivityMultiplier())
      const throughputBoost = ctx.getRampBoost()
      const delay = (baseDelay / activity) / (Math.max(0.5, scale.actionMultiplier) * throughputBoost)
      await ctx.sleep(Math.max(8, ctx.randomInt(delay * 0.7, delay * 1.15)))
      if (!ctx.isRunning() || epoch !== ctx.getEpoch()) break
      if (ctx.isPaused()) continue
      if (ctx.getRegisteredUsers().length === 0) continue

      const candidate = ctx.pickLoginCandidate()
      if (!candidate) continue
      if (ctx.getLoginInFlight().has(candidate.id)) continue
      ctx.getLoginInFlight().add(candidate.id)

      try {
        const data = await ctx.apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: candidate.username, password: ctx.getStockPassword() })
        })

        if (data?.success) {
          candidate.token = data.data.token
          candidate.refreshToken = data.data.refreshToken || null
          candidate.dbUserId = Number(data?.data?.user?.id || candidate.dbUserId || 0)
          ctx.rememberUser(candidate)
          ctx.ensureSocialCircle(candidate)
          candidate.loginCount = (candidate.loginCount || 0) + 1
          candidate.userType = ctx.inferUserType(candidate)

          const session = new ctx.Session(candidate, candidate.userType)
          ctx.getActiveSessions().set(candidate.id, session)
          ctx.getStats().logins += 1
          session.run().then(() => ctx.getActiveSessions().delete(candidate.id))
        }
      } finally {
        ctx.getLoginInFlight().delete(candidate.id)
      }
    }
  }

  async function scheduleVisitors() {
    if (ctx.getCurrentScale().visitorRatio <= 0) return

    const epoch = ctx.getEpoch()
    while (ctx.isRunning() && epoch === ctx.getEpoch()) {
      await waitWhilePaused(epoch)
      if (!ctx.isRunning() || epoch !== ctx.getEpoch()) break

      const scale = ctx.getCurrentScale()
      const activity = ctx.getActivityMultiplier()
      const pulse = ctx.getVisitorPulseMultiplier() * ctx.getIntakeValve()
      const activeSessions = Array.from(ctx.getActiveSessions().values())
      const nonVisitorOnline = activeSessions.filter((s) => !s.user.isVisitor).length
      const currentVisitors = activeSessions.filter((s) => s.user.isVisitor).length

      const targetByShare = Math.ceil((nonVisitorOnline * scale.visitorRatio) / Math.max(0.01, 1 - scale.visitorRatio))
      const targetVisitors = Math.max(0, Math.round(targetByShare * pulse))

      if (currentVisitors >= targetVisitors) {
        await ctx.sleep(4000)
        continue
      }

      const deficit = Math.max(1, targetVisitors - currentVisitors)
      const visitorArrivalRate = Math.max(0.2, scale.baseLoginRate * scale.visitorRatio * (deficit / 20))
      const baseDelay = 1000 / visitorArrivalRate
      const delay = (baseDelay / activity) / Math.max(0.5, scale.actionMultiplier)
      await ctx.sleep(Math.max(100, ctx.randomInt(delay * 0.7, delay * 1.3)))

      if (!ctx.isRunning() || epoch !== ctx.getEpoch()) break
      if (ctx.isPaused()) continue

      const session = ctx.createVisitorSession()
      ctx.getActiveSessions().set(session.user.id, session)
      session.run().then(() => ctx.getActiveSessions().delete(session.user.id))
    }
  }

  return {
    waitWhilePaused,
    scheduleRegistrations,
    scheduleLogins,
    scheduleVisitors
  }
}

module.exports = {
  createSimulatorScheduler
}
