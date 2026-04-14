function createSimulatorCleanup(ctx) {
  async function cleanupRunGeneratedData() {
    const usernames = Array.from(ctx.getRunGeneratedUsernames()).filter((name) => typeof name === 'string' && name.trim())
    if (!usernames.length) return

    const chunkSize = 500
    let deleted = 0
    for (let i = 0; i < usernames.length; i += chunkSize) {
      const chunk = usernames.slice(i, i + chunkSize)
      const placeholders = chunk.map(() => '?').join(', ')
      const [result] = await ctx.dbWrite(`DELETE FROM users WHERE username IN (${placeholders})`, chunk)
      deleted += Number(result?.affectedRows || 0)
    }

    ctx.clearRunGeneratedUsernames()
    console.log(`[Sim] 已清理本轮模拟数据用户：${deleted} 个`)
  }

  return {
    cleanupRunGeneratedData
  }
}

module.exports = {
  createSimulatorCleanup
}
