<template>
  <el-container class="layout">
    <el-aside :width="collapsed ? '68px' : '240px'" class="aside">
      <div class="logo">
        <img src="/image/logo.jpg" class="logo-img" />
        <span v-show="!collapsed" class="logo-text">社区健康守护</span>
      </div>
      <el-menu :default-active="route.path" :collapse="collapsed" router class="side-menu"
        background-color="transparent" text-color="rgba(255,255,255,0.75)" active-text-color="#fff">
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
          <el-icon><component :is="m.icon" /></el-icon>
          <template #title>{{ m.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="main-wrap">
      <el-header class="header">
        <div class="header-left">
          <el-icon class="toggle" @click="collapsed = !collapsed"><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>管理后台</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="changeAvatar">
            <div class="avatar-wrap">
              <el-avatar :size="40" :src="adminAvatar" />
              <span class="admin-name">{{ adminInfo.nickname || '管理员' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>选择头像</el-dropdown-item>
                <el-dropdown-item v-for="a in AVATAR_OPTIONS" :key="a.value" :command="a.value">
                  <div class="avatar-option">
                    <el-avatar :size="28" :src="a.value" />
                    <span>{{ a.label }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in"><component :is="Component" /></transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { AVATAR_OPTIONS, updateAdmin } from '../utils/api'

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)
const adminInfo = ref({})

function loadAdmin() {
  try { adminInfo.value = JSON.parse(sessionStorage.getItem('adminInfo') || '{}') } catch { adminInfo.value = {} }
}
loadAdmin()

const adminAvatar = computed(() => adminInfo.value.avatar || '/image/logo.jpg')

const menus = [
  { path: '/dashboard', title: '健康数据看板', icon: 'Odometer' },
  { path: '/users', title: '居民健康档案', icon: 'User' },
  { path: '/knowledge', title: '健康科普管理', icon: 'Reading' },
  { path: '/banners', title: '健康宣教横幅', icon: 'Picture' },
  { path: '/notices', title: '健康提醒公告', icon: 'Bell' },
  { path: '/checkins', title: '健康打卡记录', icon: 'Calendar' },
  { path: '/drugs', title: '药品管理', icon: 'FirstAidKit' },
  { path: '/drug-orders', title: '药品订单', icon: 'ShoppingCart' },
  { path: '/charts', title: '健康数据统计', icon: 'DataAnalysis' }
]

const currentTitle = computed(() => menus.find(m => m.path === route.path)?.title || '')

async function changeAvatar(cmd) {
  if (cmd === 'logout') {
    ElMessageBox.confirm('确定退出登录？', '提示', { type: 'warning' }).then(() => {
      sessionStorage.clear(); router.push('/login')
    }).catch(() => {})
    return
  }
  if (!adminInfo.value.id) return
  try {
    const updated = await updateAdmin(adminInfo.value.id, { ...adminInfo.value, avatar: cmd })
    adminInfo.value = updated
    sessionStorage.setItem('adminInfo', JSON.stringify(updated))
    ElMessage.success('头像已更新')
  } catch { ElMessage.error('头像更新失败') }
}
</script>

<style scoped>
.layout { min-height: 100vh; }
.aside {
  background: linear-gradient(180deg, #0B3B48 0%, #072630 100%);
  transition: width 0.3s;
  overflow: hidden;
}
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding: 0 16px;
}
.logo-img { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; }
.logo-text { color: #fff; font-size: 15px; font-weight: 600; white-space: nowrap; }
.side-menu { border-right: none; padding: 12px 8px; }
.side-menu :deep(.el-menu-item) {
  border-radius: 10px;
  margin-bottom: 4px;
  height: 48px;
}
.side-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #12A8A0, #1D7EC9) !important;
  color: #fff !important;
}
.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  padding: 0 24px;
  height: 64px;
}
.header-left { display: flex; align-items: center; gap: 16px; }
.toggle { font-size: 20px; cursor: pointer; color: #666; }
.header-right { display: flex; align-items: center; }
.avatar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 24px;
  transition: background 0.2s;
}
.avatar-wrap:hover { background: #F5F7FA; }
.admin-name { font-size: 14px; color: #333; font-weight: 500; }
.avatar-option { display: flex; align-items: center; gap: 10px; }
.main-wrap { min-width: 0; }
.main { padding: 24px; background: #F1F7FA; min-height: calc(100vh - 64px); min-width: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media screen and (max-width: 900px) {
  .header { padding: 0 16px; }
  .main { padding: 16px; }
  .admin-name { display: none; }
}
</style>
