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
      toast.error(data.msg || '口令错误，请重新输入')
    }
  } catch (error: any) {
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
  <div class="aurora-bg relative flex min-h-screen items-center justify-center px-4 transition-colors duration-300">
    
    <div class="absolute right-6 top-6">
      <ThemeToggle />
    </div>

    <div
      class="glass-card w-full max-w-sm rounded-3xl p-10 text-center"
    >
      <div
        class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-900/30 dark:text-blue-400"
      >
        <LockKeyhole class="h-8 w-8" />
      </div>

      <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">访问受限</h1>
      <p class="mb-8 text-sm text-gray-500 dark:text-gray-400">请输入访问口令以继续使用图床服务</p>

      <div class="space-y-5">
        <input
          v-model="password"
          type="password"
          placeholder="请输入口令..."
          class="w-full h-12 rounded-xl border border-gray-200 bg-white/50 px-4 text-base outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:focus:bg-gray-800 dark:placeholder-gray-500"
          @keyup.enter="handleLogin"
        />

        <Button 
          class="w-full h-12 rounded-xl text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all 
                 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500
                 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
          @click="handleLogin" 
          :disabled="loading"
        >
          {{ loading ? '验证中...' : '解锁访问' }}
        </Button>
      </div>
    </div>
  </div>
</template>
