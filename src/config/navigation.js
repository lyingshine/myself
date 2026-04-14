export const topNavLinks = [
  { key: 'home', label: '首页', path: '/', icon: 'home', mobileMenuDuplicate: true },
  { key: 'discovery', label: '发现', path: '/discovery', icon: 'compass', mobileMenuDuplicate: true },
  { key: 'create', label: '创作', icon: 'edit', action: 'compose', mobileMenuDuplicate: true },
  { key: 'messages', label: '消息', path: '/messages', icon: 'chat', mobileMenuDuplicate: true, badge: 'unread' },
  { key: 'planner', label: '工具', path: '/planner', icon: 'calendar', mobileMenuDuplicate: false }
]

export const adminNavLink = { key: 'admin', label: '后台', path: '/admin', icon: 'grid' }

export const mobileTabLinks = [
  { key: 'home', label: '首页', path: '/', icon: 'home' },
  { key: 'discovery', label: '发现', path: '/discovery', icon: 'compass' },
  { key: 'messages', label: '消息', path: '/messages', icon: 'chat', badge: 'unread' },
  { key: 'mine', label: '我的', icon: 'user' }
]

export const mobileComposeActions = [
  { key: 'moments', label: '发动态', icon: 'chat', path: '/moments', requiresAuth: true },
  { key: 'article', label: '写文章', icon: 'edit', path: '/write', requiresAuth: true }
]

export const isPathActive = (currentPath, targetPath) => {
  if (targetPath === '/') return currentPath === '/'
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}
