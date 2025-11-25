import fs from 'fs'
import path from 'path'

const DB_PATH = path.resolve(__dirname, 'images.json')

export interface ImageRecord {
  id: string
  name: string
  url: string
  thumbnailUrl?: string
  size: number
  type: string
  createdAt: number
}

// 初始化数据库文件
if (!fs.existsSync(DB_PATH)) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify([]))
  } catch (e) {
    console.warn('Could not create local DB file (Might be Read-Only environment):', e)
  }
}

export const store = {
  getAll: (): ImageRecord[] => {
    try {
      if (!fs.existsSync(DB_PATH)) return []
      const data = fs.readFileSync(DB_PATH, 'utf-8')
      return JSON.parse(data || '[]')
    } catch (e) {
      return []
    }
  },

  add: (record: ImageRecord) => {
    try {
      const list = store.getAll()
      list.unshift(record) // 新图片排前面
      // 限制最大记录数，防止文件过大（例如保留最近1000条）
      if (list.length > 1000) list.pop()
      fs.writeFileSync(DB_PATH, JSON.stringify(list, null, 2))
    } catch (e) {
      console.error('Failed to save image record:', e)
    }
  },

  remove: (id: string) => {
    try {
      let list = store.getAll()
      list = list.filter(item => item.id !== id)
      fs.writeFileSync(DB_PATH, JSON.stringify(list, null, 2))
    } catch (e) {
      console.error('Failed to remove image record:', e)
    }
  }
}
