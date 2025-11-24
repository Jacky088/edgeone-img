<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { LockKeyhole } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import ThemeToggle from '@/components/ThemeToggle.vue'

const password = ref('')
const loading = ref(false)
const router = useRouter()

const handleLogin = async () => {
  if (!password.value) return

  loading.value = true
  try {
    const { data } = await axios.post('/api/auth/verify', {
      password: password.value,
    })

    if (data.code === 0) {
      sessionStorage.setItem('site_access_token', 'authorized')
      toast.success('验证通过')
      const redirect = (router.currentRoute.value.query.redirect as string) || '/'
      router.replace(redirect)
    } else {
      // 这里处理状态码为 200 但业务逻辑错误的情况
      toast.error(data.msg || '口令错误，请重新输入')
    }
  } catch (error: any) {
    // 核心修正：捕获 403 状态码（后端口令校验失败会返回 403）
    if (error.response && error.response.status === 403) {
      toast.error('口令错误，请重新输入')
    } else {
      toast.error('验证请求失败，请检查网络')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950 transition-colors duration-300">
    
    <div class="absolute right-6 top-6">
      <ThemeToggle />
    </div>

    <div
      class="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900"
    >
      <div
        class="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
      >
        <LockKeyhole class="h-6 w-6" />
      </div>

      <h1 class="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">访问受限</h1>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">请输入访问口令以继续使用图床服务</p>

      <div class="space-y-4">
        <input
          v-model="password"
          type="password"
          placeholder="请输入口令..."
          class="w-full rounded-md border border-gray-200 bg-transparent h-10 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-800 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 dark:placeholder-gray-500"
          @keyup.enter="handleLogin"
        />

        <Button class="w-full" @click="handleLogin" :disabled="loading">
          {{ loading ? '验证中...' : '解锁访问' }}
        </Button>
      </div>
    </div>
  </div>
</template>
