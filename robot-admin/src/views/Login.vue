<template>
  <div class="login-page">
    <div class="login-left">
      <img src="/image/1.jpg" class="cover" />
      <div class="cover-mask">
        <img src="/image/logo.jpg" class="cover-logo" />
        <h1>社区健康守护</h1>
        <p>管理后台 · 数据驱动健康管理</p>
      </div>
    </div>
    <div class="login-right">
      <div class="form-box">
        <h2>欢迎登录</h2>
        <p class="sub">Community Health Admin System</p>
        <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
          <el-form-item prop="username">
            <el-input v-model="form.username" prefix-icon="User" placeholder="管理员账号" size="large" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" prefix-icon="Lock" type="password" placeholder="密码" size="large" show-password />
          </el-form-item>
          <el-button type="primary" size="large" :loading="loading" native-type="submit" class="login-btn">登 录</el-button>
        </el-form>
        <p class="hint">默认账号 admin / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAdmins } from '../utils/api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const form = reactive({ username: 'admin', password: '123456' })
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  await formRef.value.validate()
  loading.value = true
  try {
    const admins = await getAdmins()
    const admin = admins.find(a => a.username === form.username && a.password === form.password)
    if (admin) {
      sessionStorage.setItem('adminLogin', 'true')
      sessionStorage.setItem('adminInfo', JSON.stringify(admin))
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else ElMessage.error('账号或密码错误')
  } catch { ElMessage.error('登录失败，请确认服务端已启动') }
  finally { loading.value = false }
}
</script>

<style scoped>
.login-page { min-height: 100vh; display: flex; }
.login-left { flex: 1; position: relative; overflow: hidden; }
.cover { width: 100%; height: 100%; object-fit: cover; }
.cover-mask {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(8,42,58,0.88), rgba(18,168,160,0.62));
  display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff;
}
.cover-logo { width: 80px; height: 80px; border-radius: 20px; margin-bottom: 24px; border: 3px solid rgba(255,255,255,0.5); }
.cover-mask h1 { font-size: 36px; margin-bottom: 12px; }
.cover-mask p { font-size: 16px; opacity: 0.85; }
.login-right { width: 480px; display: flex; align-items: center; justify-content: center; background: #fff; }
.form-box { width: 360px; }
.form-box h2 { font-size: 28px; color: #0B3B48; margin-bottom: 8px; }
.sub { color: #999; font-size: 14px; margin-bottom: 36px; }
.login-btn { width: 100%; background: linear-gradient(135deg, #12A8A0, #1D7EC9); border: none; height: 48px; font-size: 16px; }
.hint { text-align: center; color: #999; font-size: 13px; margin-top: 20px; }
</style>
