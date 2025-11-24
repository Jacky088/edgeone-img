<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useTheme } from '@/composables/useTheme'

const { theme } = useTheme()
</script>

<template>
  <RouterView />
  
  <Toaster 
    position="top-center" 
    :theme="theme" 
    richColors 
    closeButton
    class="!z-[99999]"
    :toastOptions="{
      class: 'my-toast-card flex flex-col items-center justify-center text-center !bg-white dark:!bg-gray-800 !bg-opacity-100 !opacity-100 !rounded-2xl !border !border-gray-100 dark:!border-gray-700 !shadow-2xl !py-6 !px-10 !text-base !font-medium !min-w-[320px] !min-h-[120px] gap-3',
      duration: 2000
    }"
  />
</template>

<style>
:root {
  --toaster-width: auto !important;
}

/* 强制全屏居中定位 */
ol[data-sonner-toaster] {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100vh !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  pointer-events: none !important;
  z-index: 99999 !important;
  background: transparent !important;
}

li[data-sonner-toast] {
  pointer-events: auto !important;
  margin: 0 !important;
  transform: none !important;
}

/* 针对图标大小的微调 */
.my-toast-card svg {
  width: 28px !important;
  height: 28px !important;
  margin-bottom: 4px; /* 图标和文字间距 */
}

/* 移除之前的强制背景色覆盖
  现在依靠 richColors 自动处理图标颜色，
  依靠 class 处理文字颜色
*/
</style>
