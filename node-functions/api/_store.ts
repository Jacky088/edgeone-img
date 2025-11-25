import fs from 'fs'
import path from 'path'

// 使用 /tmp 目录，确保在 Serverless 环境下有写入权限
// 注意：EdgeOne Pages 重启后数据会重置，但这是最稳定的不报错方案
const DB_PATH = path.resolve('/tmp', 'images.json')

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

// 初始化数据库文件
try {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]))
  }
} catch (e) {
  console.warn('DB init warning:', e)
}

export const store = {
  getAll: (): ImageRecord[] => {
    try {
      if (!fs.existsSync(DB_PATH)) return []
      const data = fs.readFileSync(DB_PATH, 'utf-8')
      return JSON.parse(data || '[]')
    } catch (e) {
      console.error('Store read error:', e)
      return []
    }
  },

  add: (record: ImageRecord) => {
    try {
      const list = store.getAll()
      list.unshift(record)
      if (list.length > 1000) list.pop()
      fs.writeFileSync(DB_PATH, JSON.stringify(list, null, 2))
    } catch (e) {
      console.error('Store add error:', e)
    }
  },

  remove: (id: string) => {
    try {
      let list = store.getAll()
      list = list.filter(item => item.id !== id)
      fs.writeFileSync(DB_PATH, JSON.stringify(list, null, 2))
    } catch (e) {
      console.error('Store remove error:', e)
    }
  }
}
