<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { Sun, Moon } from 'lucide-vue-next'

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <button
    @click="toggleTheme"
    class="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-gray-600 transition-all hover:border-gray-200 hover:bg-white hover:text-blue-600 hover:shadow-sm active:scale-95 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-blue-400"
    :title="theme === 'light' ? '切换到夜间模式' : '切换到日间模式'"
  >
    <Sun v-if="theme === 'dark'" class="h-5 w-5" />
    <Moon v-else class="h-5 w-5" />
    <span class="sr-only">切换主题</span>
  </button>
</template>
