<template>
  <nav class="navbar">
    <div class="navbar-container">
      <router-link to="/" class="logo">
        <span class="logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </span>
        <span class="logo-text">MySelf</span>
      </router-link>

      <div class="nav-right">
        <div class="nav-center">
          <ul class="nav-links" :class="{ open: isMenuOpen }">
            <li
              v-for="item in centerNavLinks"
              :key="item.key"
              :class="{ 'mobile-primary-duplicate': item.mobileMenuDuplicate }"
            >
              <router-link :to="item.path" @click="closeMenu" class="nav-item">
                <span class="nav-icon">
                  <NavIcon :name="item.icon" :size="16" />
                </span>
                {{ item.label }}
                <span
                  v-if="item.badge === 'unread' && notificationsStore.unreadCount > 0"
                  class="nav-badge"
                >
                  {{ notificationsStore.unreadCount > 99 ? '99+' : notificationsStore.unreadCount }}
                </span>
              </router-link>
            </li>
            <li v-if="authStore.isAdmin" class="mobile-admin">
              <router-link :to="adminNavLink.path" @click="closeMenu" class="nav-item">
                <span class="nav-icon">
                  <NavIcon :name="adminNavLink.icon" :size="16" />
                </span>
                {{ adminNavLink.label }}
              </router-link>
            </li>
            <li class="mobile-theme">
              <ThemeSwitcher />
            </li>
            <li v-if="authStore.isLoggedIn" class="mobile-user">
              <div class="mobile-user-actions">
                <router-link to="/about" @click="closeMenu" class="mobile-login">
                  <NavIcon name="user" :size="16" />
                  个人资料
                </router-link>
                <button class="mobile-logout" @click="handleLogout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  退出登录
                </button>
              </div>
            </li>
            <li v-else class="mobile-user">
              <router-link to="/login" @click="closeMenu" class="mobile-login">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                登录
              </router-link>
            </li>
          </ul>
          <button
            v-if="composeNavLink"
            type="button"
            class="nav-item nav-trigger nav-compose"
            :class="{ active: showComposeMenu }"
            @click="toggleComposeMenu"
          >
            <span class="nav-icon">
              <NavIcon :name="composeNavLink.icon" :size="16" />
            </span>
            {{ composeNavLink.label }}
          </button>
        </div>

        <div class="nav-actions">
          <router-link v-if="authStore.isAdmin" :to="adminNavLink.path" class="admin-btn">
            <NavIcon :name="adminNavLink.icon" :size="16" />
            {{ adminNavLink.label }}
          </router-link>
          <ThemeSwitcher />

          <div v-if="authStore.isLoggedIn" class="user-menu" @click="toggleUserMenu">
            <div class="user-avatar">
              <img
                v-if="isImageAvatar(authStore.user?.avatar)"
                :src="resolveAssetUrl(authStore.user?.avatar)"
                alt="avatar"
                class="avatar-image"
              />
              <span v-else>{{ userAvatarText }}</span>
            </div>
            <Transition name="dropdown">
              <div v-if="showUserMenu" class="user-dropdown">
                <div class="dropdown-header">
                  <div class="dropdown-avatar">
                    <img
                      v-if="isImageAvatar(authStore.user?.avatar)"
                      :src="resolveAssetUrl(authStore.user?.avatar)"
                      alt="avatar"
                      class="avatar-image"
                    />
                    <span v-else>{{ userAvatarText }}</span>
                  </div>
                  <div class="dropdown-info">
                    <span class="dropdown-name">{{ authStore.user?.username }}</span>
                    <span class="dropdown-email">{{ authStore.user?.email }}</span>
                  </div>
                </div>
                <div class="dropdown-divider"></div>
                <router-link to="/about" class="dropdown-item" @click="closeUserMenu">
                  <NavIcon name="user" :size="16" />
                  个人资料
                </router-link>
                <button class="dropdown-item" @click="handleLogout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  退出登录
                </button>
              </div>
            </Transition>
          </div>

          <router-link v-else to="/login" class="login-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <span>登录</span>
          </router-link>

          <button
            class="menu-toggle"
            :class="{ active: isMenuOpen }"
            @click="toggleMenu"
            :aria-expanded="isMenuOpen"
            aria-label="更多入口"
          >
            <span class="menu-line" :class="{ open: isMenuOpen }"></span>
          </button>
        </div>
      </div>
    </div>
    <Transition name="compose-fade">
      <div v-if="showComposeMenu" class="compose-backdrop" @click="closeComposeMenu"></div>
    </Transition>
    <Transition name="compose-pop">
      <div v-if="showComposeMenu" class="compose-popover">
        <div class="compose-section">
          <span class="compose-label">开始创作</span>
          <button
            v-for="action in mobileComposeActions"
            :key="action.key"
            type="button"
            class="compose-item"
            @click="goCompose(action.path)"
          >
            <span class="compose-item-icon">
              <NavIcon :name="action.icon" :size="16" />
            </span>
            <span>{{ action.label }}</span>
          </button>
        </div>
      </div>
    </Transition>
    <div v-if="isMenuOpen" class="mobile-menu-backdrop" @click="closeMenu"></div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ThemeSwitcher from './ThemeSwitcher.vue'
import NavIcon from './NavIcon.vue'
import { useAuthStore } from '../stores/auth'
import { resolveAssetUrl } from '../api'
import { useNotificationsStore } from '../stores/notifications'
import { topNavLinks, adminNavLink, mobileComposeActions } from '../config/navigation'
import { getAvatarText, isImageAvatar } from '../utils/presentation'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const isMenuOpen = ref(false)
const showUserMenu = ref(false)
const showComposeMenu = ref(false)
const centerNavLinks = computed(() => topNavLinks.filter((item) => item.action !== 'compose'))
const composeNavLink = computed(() => topNavLinks.find((item) => item.action === 'compose'))

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const toggleComposeMenu = () => {
  showComposeMenu.value = !showComposeMenu.value
  closeUserMenu()
}

const closeComposeMenu = () => {
  showComposeMenu.value = false
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const closeUserMenu = () => {
  showUserMenu.value = false
}

const userAvatarText = computed(() => getAvatarText(authStore.user?.avatar, authStore.user?.username))

const handleLogout = () => {
  authStore.logout()
  closeUserMenu()
  closeComposeMenu()
  closeMenu()
  router.push('/')
}

const goCompose = (path) => {
  closeComposeMenu()
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  if (path.startsWith('/#')) {
    router.push(path)
    return
  }
  router.push(path)
}

const handleClickOutside = (e) => {
  if (!e.target.closest('.user-menu')) {
    showUserMenu.value = false
  }
  if (!e.target.closest('.compose-popover') && !e.target.closest('.nav-trigger')) {
    showComposeMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  authStore.initAuth()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.body.classList.remove('menu-open')
  document.body.style.overflow = ''
})

watch(isMenuOpen, (open) => {
  document.body.classList.toggle('menu-open', open)
  document.body.style.overflow = open ? 'hidden' : ''
})

watch(
  () => route.fullPath,
  () => {
    closeMenu()
    closeUserMenu()
    closeComposeMenu()
  }
)
</script>
<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--color-nav-bg);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--color-border-light);
  transition: background-color var(--transition-normal);
  transform: translateZ(0);
}

.navbar-container {
  max-width: var(--layout-max-width);
  margin: 0 auto;
  padding: 0 var(--layout-gutter);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  position: relative;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.022em;
  transition: opacity var(--motion-fast) var(--motion-smooth), transform var(--motion-fast) var(--motion-spring);
}

.logo:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-accent);
  border-radius: 7px;
  color: white;
  transition: background-color var(--transition-normal);
}

.logo-icon svg {
  width: 16px;
  height: 16px;
}

.nav-right {
  display: flex;
  align-items: center;
}

.nav-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 22px;
  padding-left: 8px;
}

.admin-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.admin-btn:hover {
  color: var(--color-text-primary);
  border-color: var(--color-border);
  background: var(--color-surface-elevated);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-compose {
  flex-shrink: 0;
}

.nav-links > li {
  list-style: none;
  flex-shrink: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 400;
  border-radius: 980px;
  transition:
    color var(--motion-base) var(--motion-smooth),
    background-color var(--motion-base) var(--motion-smooth),
    box-shadow var(--motion-base) var(--motion-smooth),
    transform var(--motion-fast) var(--motion-spring);
  position: relative;
  white-space: nowrap;
  box-shadow: inset 0 0 0 1px transparent;
}

.nav-badge {
  position: absolute;
  top: 3px;
  right: 6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}

.nav-item:hover {
  color: var(--color-text-primary);
  background: var(--color-nav-item-hover-bg);
  transform: translateY(-1px);
}

.nav-item.router-link-active {
  color: var(--color-text-primary);
  background: var(--color-nav-item-active-bg);
  box-shadow: inset 0 0 0 1px var(--color-nav-item-active-border);
}

.nav-item.router-link-active .nav-icon {
  color: var(--color-nav-item-active-icon);
  opacity: 1;
}

.nav-trigger.active {
  color: var(--color-text-primary);
  background: var(--color-nav-item-hover-bg);
}

.nav-icon {
  display: flex;
  align-items: center;
  opacity: 0.7;
}

.login-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-accent);
  color: white;
  border-radius: 980px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.login-btn:hover {
  background: var(--color-accent);
  transform: none;
}

.user-menu {
  position: relative;
}

.user-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform var(--motion-fast) var(--motion-spring), box-shadow var(--motion-base) var(--motion-smooth);
  overflow: hidden;
}

.user-avatar:hover {
  transform: translateY(-1px);
  box-shadow: var(--ux-shadow-soft);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 240px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  z-index: 100;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.dropdown-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  border-radius: 50%;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.dropdown-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dropdown-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.dropdown-email {
  font-size: 12px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border-light);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--motion-base) var(--motion-spring);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

.compose-backdrop {
  position: fixed;
  inset: 0;
  z-index: 998;
  background: transparent;
}

.compose-popover {
  position: fixed;
  top: calc(var(--app-nav-height) + 10px + var(--safe-top));
  left: 50%;
  transform: translateX(-50%);
  width: min(340px, calc(100vw - 24px));
  padding: 12px;
  border: 1px solid var(--color-border-light);
  border-radius: 18px;
  background: color-mix(in srgb, var(--color-surface) 96%, transparent);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  box-shadow: 0 16px 36px rgba(8, 15, 34, 0.18);
  z-index: 999;
}

.compose-section {
  display: grid;
  gap: 8px;
}

.compose-label {
  padding: 2px 4px 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.compose-item {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-surface-elevated) 90%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 88%, transparent);
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 500;
}

.compose-item:hover {
  background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated));
  border-color: color-mix(in srgb, var(--color-accent) 20%, var(--color-border-light));
}

.compose-item-icon {
  width: 18px;
  display: inline-flex;
  justify-content: center;
  color: var(--color-accent);
}

.compose-divider {
  height: 1px;
  margin: 10px 0;
  background: var(--color-border-light);
}

.compose-fade-enter-active,
.compose-fade-leave-active,
.compose-pop-enter-active,
.compose-pop-leave-active {
  transition: all var(--motion-base) var(--motion-spring);
}

.compose-fade-enter-from,
.compose-fade-leave-to,
.compose-pop-enter-from,
.compose-pop-leave-to {
  opacity: 0;
}

.compose-pop-enter-from,
.compose-pop-leave-to {
  transform: translate(-50%, -8px) scale(0.98);
}

.menu-toggle {
  display: none;
  width: 38px;
  height: 28px;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  box-shadow: none;
  opacity: 0.8;
  transition: opacity var(--motion-fast) var(--motion-smooth), transform var(--motion-fast) var(--motion-spring);
}

.menu-toggle:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}

.menu-toggle.active {
  opacity: 1;
}

.menu-line {
  position: relative;
  width: 13px;
  height: 1.8px;
  background: color-mix(in srgb, var(--color-text-secondary) 78%, var(--color-text-tertiary));
  border-radius: 1px;
  transition: all var(--transition-normal);
}

.menu-line::before,
.menu-line::after {
  content: '';
  position: absolute;
  left: 0;
  width: 13px;
  height: 1.8px;
  background: color-mix(in srgb, var(--color-text-secondary) 78%, var(--color-text-tertiary));
  border-radius: 1px;
  transition: all var(--transition-normal);
}

.menu-line::before {
  top: -4px;
}

.menu-line::after {
  top: 4px;
}

.menu-line.open {
  background: transparent;
}

.menu-line.open::before {
  top: 0;
  transform: rotate(45deg);
}

.menu-line.open::after {
  top: 0;
  transform: rotate(-45deg);
}

.mobile-theme,
.mobile-user,
.mobile-admin {
  display: none;
}

@media (max-width: 768px) {
  .compose-popover,
  .compose-backdrop {
    display: none;
  }

  .mobile-primary-duplicate {
    display: none;
  }

  .navbar-container {
    padding: 0 var(--layout-gutter-mobile);
    height: 44px;
  }

  .nav-right {
    margin-left: auto;
    position: static;
  }

  .nav-actions .theme-switcher,
  .nav-actions .admin-btn,
  .nav-actions .login-btn,
  .nav-actions .user-menu,
  .nav-compose {
    display: none;
  }

  .nav-center {
    position: static;
    transform: none;
    display: block;
  }

  .menu-toggle {
    display: flex;
  }

  .nav-links {
    position: fixed;
    top: var(--app-sticky-top);
    left: max(10px, var(--safe-left));
    right: max(10px, var(--safe-right));
    max-height: calc(100dvh - var(--app-nav-height) - var(--safe-top) - var(--safe-bottom) - 12px);
    min-height: min(340px, calc(100dvh - var(--app-nav-height) - var(--safe-top) - var(--safe-bottom) - 36px));
    overflow-y: auto;
    flex-direction: column;
    gap: 0;
    padding: 14px;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--color-surface) 96%, transparent),
        color-mix(in srgb, var(--color-surface-elevated) 96%, transparent)
      );
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border: 1px solid color-mix(in srgb, var(--color-border) 72%, var(--color-border-light));
    border-radius: 18px;
    box-shadow: 0 14px 34px rgba(8, 15, 34, 0.2);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-8px) scale(0.99);
    transition: all var(--transition-normal);
    z-index: 1001;
  }

  .nav-links > li {
    width: 100%;
  }

  .nav-links > li + li {
    margin-top: 8px;
  }

  .nav-links.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
  }

  .nav-item {
    width: 100%;
    min-height: 48px;
    padding: 11px 14px;
    border-radius: 12px;
    justify-content: flex-start;
    height: auto;
    font-weight: 500;
    color: var(--color-text-primary);
    border: 1px solid color-mix(in srgb, var(--color-border-light) 85%, var(--color-border));
    background: color-mix(in srgb, var(--color-surface-elevated) 88%, transparent);
    gap: 10px;
  }

  .nav-badge {
    top: 10px;
    right: 10px;
  }

  .nav-item .nav-icon {
    width: 20px;
    display: inline-flex;
    justify-content: center;
    opacity: 0.9;
    color: var(--color-text-secondary);
  }

  .nav-item:hover {
    background: var(--color-nav-item-hover-bg);
    border-color: color-mix(in srgb, var(--color-nav-item-active-border) 66%, var(--color-border-light));
  }

  .nav-item.router-link-active {
    color: var(--color-text-primary);
    background: var(--color-nav-item-active-bg);
    border-color: var(--color-nav-item-active-border);
  }

  .nav-item.router-link-active .nav-icon {
    color: var(--color-nav-item-active-icon);
    opacity: 1;
  }

  .mobile-theme,
  .mobile-user,
  .mobile-admin {
    display: flex;
    padding: 2px 0 0;
    width: 100%;
  }

  .mobile-theme {
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px dashed color-mix(in srgb, var(--color-border) 72%, var(--color-border-light));
  }

  .mobile-theme :deep(.theme-toggle) {
    width: 100%;
    min-height: 46px;
    padding: 11px 14px;
    border-radius: 12px;
    justify-content: flex-start;
    gap: 8px;
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 500;
    border: 1px solid color-mix(in srgb, var(--color-border-light) 85%, var(--color-border));
    background: color-mix(in srgb, var(--color-surface-elevated) 88%, transparent);
  }

  .mobile-theme :deep(.theme-switcher) {
    width: 100%;
  }

  .mobile-theme :deep(.theme-toggle)::after {
    content: '切换主题';
    color: var(--color-text-primary);
  }

  .mobile-logout,
  .mobile-login {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 46px;
    padding: 10px 14px;
    background: var(--color-accent-subtle);
    border: none;
    border-radius: 12px;
    color: var(--color-accent);
    font-size: 14px;
    cursor: pointer;
    text-decoration: none;
    border: 1px solid color-mix(in srgb, var(--color-accent) 22%, var(--color-border-light));
  }

  .mobile-user-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .mobile-menu-backdrop {
    position: fixed;
    inset: var(--app-sticky-top) 0 0;
    background: rgba(0, 0, 0, 0.32);
    z-index: 1000;
  }
}
</style>

