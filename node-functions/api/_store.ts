import { PACKAGE_NAME, PACKAGE_VERSION } from './_utils'

// 定义远程数据库文件名
const DB_FILENAME = 'database.json'

// 内存缓存 (Serverless 实例存活期间可用，减少请求次数)
let memoryCache: ImageRecord[] | null = null

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

// 内部辅助：从 CNB 下载数据库
async function fetchDB(): Promise<ImageRecord[]> {
  const slug = process.env.SLUG_IMG
  // 构造制品库文件直链
  const url = `https://api.cnb.cool/${slug}/-/packages/generic/${PACKAGE_NAME}/${PACKAGE_VERSION}/${DB_FILENAME}`
  
  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.TOKEN_IMG}`,
        // 禁用缓存，确保拿到最新数据
        'Cache-Control': 'no-cache' 
      }
    })

    if (resp.status === 404) {
      return [] // 文件不存在，返回空数组
    }

    if (!resp.ok) {
      console.warn('Fetch DB failed:', resp.status)
      return []
    }

    const data = await resp.json()
    return Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Fetch DB error:', e)
    return []
  }
}

// 内部辅助：上传数据库到 CNB
async function saveDB(data: ImageRecord[]) {
  const slug = process.env.SLUG_IMG
  const url = `https://api.cnb.cool/${slug}/-/packages/generic/${PACKAGE_NAME}/${PACKAGE_VERSION}/${DB_FILENAME}`
  
  try {
    const jsonString = JSON.stringify(data, null, 2)
    
    // 使用 PUT 覆盖上传
    await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.TOKEN_IMG}`,
        'Content-Type': 'application/json',
      },
      body: jsonString,
    })
  } catch (e) {
    console.error('Save DB error:', e)
  }
}

export const store = {
  // 获取数据（优先读缓存，无缓存读远程）
  // 注意：这里变成了 async 方法，default.ts 调用处需要适配
  getAll: async (): Promise<ImageRecord[]> => {
    if (memoryCache) return memoryCache
    
    const data = await fetchDB()
    memoryCache = data
    return data
  },

  // 添加数据
  add: async (record: ImageRecord) => {
    // 1. 确保拿到最新数据
    let list = await store.getAll()
    
    // 2. 更新列表
    list.unshift(record)
    if (list.length > 2000) list.pop() // 限制条数
    
    // 3. 更新缓存
    memoryCache = list
    
    // 4. 持久化到云端 (不等待，异步执行防止阻塞响应)
    // 注意：在高并发下可能会有覆盖风险，但个人图床通常没问题
    saveDB(list)
  },

  // 删除数据
  remove: async (id: string) => {
    let list = await store.getAll()
    const newList = list.filter(item => item.id !== id)
    
    memoryCache = newList
    saveDB(newList)
  }
}
