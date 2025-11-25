import fs from 'fs'
import path from 'path'

// 数据库文件路径：在 EdgeOne Serverless 环境中，通常 /tmp 是可写的
// 我们尝试在当前目录或 /tmp 目录下创建
const DB_FILE = 'images.json'
const DB_PATH = path.resolve(__dirname, DB_FILE)

// 定义数据结构
export interface ImageRecord {
  id: string
  name: string
  url: string
  urlOriginal?: string
  thumbnailUrl?: string
  thumbnailOriginalUrl?: string
  size: number
  type: string
  createdAt: number
}

// 初始化逻辑
function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify([]))
    } catch (e) {
      // 如果当前目录不可写（常见于Serverless），尝试使用 /tmp
      // 注意：Serverless 的 /tmp 是临时的，实例重启数据会丢失。
      // 但这是无数据库环境下的妥协方案。如果需要持久化，建议对接外部数据库（如 Redis/MySQL）。
      console.warn('Local DB write failed, using memory/tmp might be needed:', e)
    }
  }
}

export const store = {
  getAll: (): ImageRecord[] => {
    try {
      if (!fs.existsSync(DB_PATH)) return []
      const data = fs.readFileSync(DB_PATH, 'utf-8')
      return JSON.parse(data || '[]')
    } catch (e) {
      console.error('Read DB failed:', e)
      return []
    }
  },

  add: (record: ImageRecord) => {
    try {
      const list = store.getAll()
      list.unshift(record)
      // 限制最大条数防止文件过大
      if (list.length > 2000) list.pop()
      fs.writeFileSync(DB_PATH, JSON.stringify(list, null, 2))
    } catch (e) {
      console.error('Write DB failed:', e)
    }
  },

  remove: (id: string) => {
    try {
      let list = store.getAll()
      list = list.filter(item => item.id !== id)
      fs.writeFileSync(DB_PATH, JSON.stringify(list, null, 2))
    } catch (e) {
      console.error('Delete DB failed:', e)
    }
  }
}

// 初始化
initDB()
