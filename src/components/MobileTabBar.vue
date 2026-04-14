<template>
  <div class="mobile-tabbar-wrap">
    <Transition name="sheet-fade">
      <div v-if="isComposeOpen" class="compose-backdrop" @click="closeCompose"></div>
    </Transition>

    <Transition name="sheet-up">
      <div v-if="isComposeOpen" class="compose-sheet">
        <button
          v-for="action in mobileComposeActions"
          :key="action.key"
          class="compose-item"
          type="button"
          @click="goCreate(action)"
        >
          <span class="compose-icon">
            <NavIcon :name="action.icon" :size="18" />
          </span>
          {{ action.label }}
        </button>
      </div>
    </Transition>

    <nav class="mobile-tabbar">
      <button
        v-for="tab in leftTabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: isTabActive(tab) }"
        type="button"
        @click="onTabClick(tab)"
      >
        <NavIcon :name="tab.icon" :size="18" />
        <span>{{ tab.label }}</span>
        <span v-if="tab.badge === 'unread' && notificationsStore.unreadCount > 0" class="tab-badge">
          {{ notificationsStore.unreadCount > 99 ? '99+' : notificationsStore.unreadCount }}
        </span>
      </button>

      <button class="tab-item tab-compose" :class="{ active: isComposeOpen }" type="button" @click="toggleCompose">
        <span class="plus-icon" aria-hidden="true"></span>
      </button>

      <button
        v-for="tab in rightTabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: isTabActive(tab) }"
        type="button"
        @click="onTabClick(tab)"
      >
        <NavIcon :name="tab.icon" :size="18" />
        <span>{{ tab.label }}</span>
        <span v-if="tab.badge === 'unread' && notificationsStore.unreadCount > 0" class="tab-badge">
          {{ notificationsStore.unreadCount > 99 ? '99+' : notificationsStore.unreadCount }}
        </span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import NavIcon from './NavIcon.vue'
import { isPathActive, mobileTabLinks, mobileComposeActions } from '../config/navigation'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const isComposeOpen = ref(false)
const leftTabs = computed(() => mobileTabLinks.slice(0, 2))
const rightTabs = computed(() => mobileTabLinks.slice(2))

const closeCompose = () => {
  isComposeOpen.value = false
}

const toggleCompose = () => {
  isComposeOpen.value = !isComposeOpen.value
}

const resolveTabPath = (tab) => {
  if (tab.key === 'mine') {
    return authStore.isLoggedIn ? '/about' : '/login'
  }
  return tab.path
}

const isTabActive = (tab) => {
  if (tab.key === 'compose') return isComposeOpen.value
  const target = resolveTabPath(tab)
  return isPathActive(route.path, target)
}

const goTo = (path) => {
  closeCompose()
  if (route.path !== path) router.push(path)
}

const onTabClick = (tab) => {
  if (tab.key === 'compose') {
    toggleCompose()
    return
  }
  goTo(resolveTabPath(tab))
}

const goCreate = (action) => {
  closeCompose()
  if (action.requiresAuth && !authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  router.push(action.path)
}

watch(
  () => route.fullPath,
  () => closeCompose()
)

watch(isComposeOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.mobile-tabbar-wrap {
  display: none;
}

@media (max-width: 768px) {
  .mobile-tabbar-wrap {
    display: block;
  }

  .mobile-tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: var(--app-tabbar-total-height);
    padding: 1px max(8px, var(--safe-right)) calc(1px + var(--app-tabbar-safe-bottom)) max(8px, var(--safe-left));
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: center;
    gap: clamp(0px, 0.7vw, 2px);
    border-top: 0.25px solid color-mix(in srgb, var(--color-border) 32%, var(--color-border-light));
    background: color-mix(in srgb, var(--color-surface) 96%, transparent);
    backdrop-filter: blur(10px) saturate(140%);
    -webkit-backdrop-filter: blur(10px) saturate(140%);
    box-shadow: 0 -6px 18px rgba(7, 13, 28, 0.12);
    z-index: 1200;
  }

  .tab-item {
    height: calc(var(--app-tabbar-core-height) - 8px);
    border: none;
    border-radius: clamp(10px, 3vw, 14px);
    background: transparent;
    color: var(--color-text-tertiary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    font-size: 11px;
    font-weight: 600;
    position: relative;
    transition:
      color var(--motion-base) var(--motion-smooth),
      transform var(--motion-fast) var(--motion-spring),
      opacity var(--motion-fast) var(--motion-smooth);
  }

  .tab-badge {
    position: absolute;
    top: 2px;
    right: 5px;
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

  .tab-item :deep(svg) {
    width: 17px;
    height: 17px;
  }

  .tab-item.active {
    color: var(--color-accent);
    background: transparent;
  }

  .tab-item:active {
    transform: translateY(1px) scale(0.98);
  }

  .tab-compose {
    position: relative;
    overflow: hidden;
    background: var(--color-surface-elevated);
    color: var(--color-accent);
    transform: none;
    border-radius: 12px;
    height: calc(var(--app-tabbar-core-height) - 18px);
    width: calc(var(--app-tabbar-core-height) - 18px);
    margin: 0 auto;
    align-self: center;
    border: none;
    box-shadow: 0 6px 14px rgba(7, 13, 28, 0.14);
    transition: transform var(--motion-fast) var(--motion-spring), box-shadow var(--motion-base) var(--motion-smooth), background-color var(--motion-base) var(--motion-smooth);
  }

  .tab-compose.active {
    transform: translateY(0) scale(0.97);
    background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated));
    box-shadow: 0 4px 10px rgba(7, 13, 28, 0.12);
  }

  .plus-icon {
    width: 21px;
    height: 21px;
    position: relative;
    display: block;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.14));
  }

  .plus-icon::before,
  .plus-icon::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    background: currentColor;
    border-radius: 999px;
    transform: translate(-50%, -50%);
  }

  .plus-icon::before {
    width: 12px;
    height: 2.2px;
  }

  .plus-icon::after {
    width: 2.2px;
    height: 12px;
  }

  .compose-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.28);
    z-index: 1198;
  }

  .compose-sheet {
    position: fixed;
    left: max(12px, var(--safe-left));
    right: max(12px, var(--safe-right));
    bottom: calc(var(--app-tabbar-core-height) + 14px + var(--app-tabbar-safe-bottom));
    display: grid;
    gap: 10px;
    padding: 12px;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--color-border) 76%, var(--color-border-light));
    background: color-mix(in srgb, var(--color-surface) 96%, transparent);
    box-shadow: 0 14px 32px rgba(9, 16, 33, 0.22);
    z-index: 1199;
  }

  .compose-item {
    min-height: 46px;
    border: 1px solid color-mix(in srgb, var(--color-border-light) 84%, var(--color-border));
    border-radius: 12px;
    background: color-mix(in srgb, var(--color-surface-elevated) 88%, transparent);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
  }

  .compose-icon {
    width: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent);
  }

  .sheet-fade-enter-active,
  .sheet-fade-leave-active,
  .sheet-up-enter-active,
  .sheet-up-leave-active {
    transition: all var(--motion-base) var(--motion-spring);
  }

  .sheet-fade-enter-from,
  .sheet-fade-leave-to {
    opacity: 0;
  }

  .sheet-up-enter-from,
  .sheet-up-leave-to {
    opacity: 0;
    transform: translateY(12px) scale(0.99);
  }

  @media (max-width: 360px) {
    .tab-item {
      font-size: 10px;
    }
  }
}
</style>
