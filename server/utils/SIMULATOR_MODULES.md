# Simulator Modules

`server/utils/simulator.js` 已拆分为多模块协作，职责如下：

- `simulator.js`
  - 组装上下文（state、依赖、回调）并对外导出统一 API。
  - 维持现有导出函数不变：`startSimulator/pauseSimulator/resumeSimulator/stopSimulator/...`

- `simulatorScale.js`
  - 维护压测预设（`low/medium/high/extreme`）。
  - 提供配置规范化与目标 rpm 估算。

- `simulatorScheduler.js`
  - 负责运行期调度循环：
  - `waitWhilePaused`
  - `scheduleRegistrations`
  - `scheduleLogins`
  - `scheduleVisitors`

- `simulatorRuntime.js`
  - 负责运行编排与生命周期：
  - `startSimulator/stopSimulator/pauseSimulator/resumeSimulator`
  - `reconnectSessions`
  - `getRuntimeStats` 与会话快照读取封装

- `simulatorControl.js`
  - 负责控制面配置变更：
  - `getAvailablePresets`
  - `applyPreset`
  - `updateConfig`

- `simulatorStorage.js`
  - 负责本地快照持久化：
  - `sim_sessions.json`
  - `sim_users.json`

- `simulatorCleanup.js`
  - 负责本轮生成用户的数据库清理逻辑（按批次删除）。

## 调用关系（简化）

1. `server/routes/admin.js` 调 `simulator.js` 导出 API。  
2. `simulator.js` 将状态和依赖注入 runtime/scheduler/control/cleanup。  
3. runtime 在启动时调用 scheduler；control 在切换预设时调用 runtime 的 start/stop。  

## 约束

- 任何模块变更都应保持 `simulator.js` 导出签名不变（避免影响 admin 路由）。
- 需要访问共享状态时优先通过注入上下文，不直接跨模块读取全局变量。
