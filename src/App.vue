<script setup lang="ts">
import { RouterView } from 'vue-router'
// 1. 引入 Toaster 组件
import { Toaster } from 'vue-sonner'
import { useTheme } from '@/composables/useTheme'

// 2. 获取 theme，让弹窗也跟随日间/夜间模式变化
const { theme } = useTheme()
</script>

<template>
  <RouterView />
  
  <Toaster position="top-center" :theme="theme" />
</template>
