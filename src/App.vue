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
      class: 'my-toast-card !bg-white dark:!bg-gray-800 !bg-opacity-100 !opacity-100 !rounded-2xl !border-0 !shadow-2xl !py-5 !px-8 !text-base !font-medium !min-w-[300px] !justify-center',
      duration: 2000
    }"
  />
</template>

<style>
/* 🎯 强制屏幕正中央定位补丁 
   覆盖 vue-sonner 默认的顶部/底部布局逻辑
*/
:root {
  --toaster-width: auto !important;
}

/* 1. 强制容器占满全屏，并使用 Flex 居中 */
ol[data-sonner-toaster] {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important; /* 关键：上下左右撑满 */
  width: 100% !important;
  height: 100vh !important;
  display: flex !important;
  flex-direction: column !important;
  /* 关键：水平垂直双居中 */
  align-items: center !important; 
  justify-content: center !important; 
  pointer-events: none !important;
  z-index: 99999 !important;
  background: transparent !important;
}

/* 2. 恢复弹窗本身的点击事件，并微调间距 */
li[data-sonner-toast] {
  pointer-events: auto !important;
  margin: 0 !important; /* 移除默认的外边距 */
  transform: none !important; /* 防止动画导致的位移偏差 */
}

/* 3. 针对移动端的优化 */
@media (max-width: 640px) {
  ol[data-sonner-toaster] {
    padding: 1rem;
  }
  li[data-sonner-toast] {
    width: 100% !important;
    max-width: 320px !important;
  }
}

/* 4. 强制覆盖 richColors 的默认半透明背景，确保完全不透明 */
.my-toast-card[data-type="success"] {
  background-color: #10b981 !important; /* 纯实色绿 */
  color: white !important;
  border: none !important;
}
.my-toast-card[data-type="error"] {
  background-color: #ef4444 !important; /* 纯实色红 */
  color: white !important;
  border: none !important;
}
.my-toast-card[data-type="success"] svg,
.my-toast-card[data-type="error"] svg {
  color: white !important; /* 图标白色 */
  width: 1.5rem !important;
  height: 1.5rem !important;
}
</style>
