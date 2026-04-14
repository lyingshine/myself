export const isImageAvatar = (avatar) =>
  typeof avatar === 'string' && /^(https?:\/\/|\/uploads\/|data:image\/)/i.test(avatar)

export const getAvatarText = (avatar, username = 'U') => {
  if (isImageAvatar(avatar)) return String(username || 'U').charAt(0).toUpperCase()
  const trimmed = typeof avatar === 'string' ? avatar.trim() : ''
  if (trimmed) return trimmed.charAt(0).toUpperCase()
  return String(username || 'U').charAt(0).toUpperCase()
}

export const formatDateZh = (dateStr, { withTime = false, fallback = '--' } = {}) => {
  if (!dateStr) return fallback
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return fallback

  if (withTime) {
    return date.toLocaleString('zh-CN', { hour12: false })
  }

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatRelativeZh = (
  dateStr,
  { fallback = '--', maxRelativeDays = 7, absoluteWithTime = false } = {}
) => {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return fallback

  const now = Date.now()
  const diff = now - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < maxRelativeDays * day) return `${Math.floor(diff / day)} 天前`

  return formatDateZh(dateStr, { withTime: absoluteWithTime, fallback })
}
