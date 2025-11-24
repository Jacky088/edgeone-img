import { ref, watchEffect } from 'vue'

// 默认从本地存储获取，如果没有则默认为 'light'（日间模式）
const theme = ref<'light' | 'dark'>(
  (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
)

export function useTheme() {
  // 监听 theme 变化，自动应用到 html 标签并保存到 localStorage
  watchEffect(() => {
    const root = window.document.documentElement
    // 移除旧的 class
    root.classList.remove('light', 'dark')
    // 添加新的 class
    root.classList.add(theme.value)
    // 保存设置
    localStorage.setItem('theme', theme.value)
  })

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return { theme, toggleTheme }
}
