import express from 'express'
import { uploadToCnb, createProxyHandler } from './_utils'
import { reply } from './_reply'
import { store, type ImageRecord } from './_store'
import multer from 'multer'

const upload = multer()
const app = express()

const requestConfig = {
  responseType: 'arraybuffer',
  timeout: 15000, // 增加超时防止大图失败
  headers: {
    Accept: 'image/*, */*',
    'User-Agent': 'SeerImageProxy/1.0 (+https://seerinfo.yuyuqaq.cn)',
  },
}
// 这里的 BASE_URL 是 CNB 的资源基地址
const REMOTE_BASE_URL = 'https://cnb.cool/' + process.env.SLUG_IMG + '/-/imgs/'

app.use(express.json())

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express on Node Functions!' })
})

// 身份验证
app.post('/auth/verify', (req, res) => {
  const { password } = req.body
  const sysPassword = process.env.SITE_PASSWORD
  if (!sysPassword) {
    return res.json(reply(0, '未设置密码，开放访问', { token: 'open-access' }))
  }
  if (password === sysPassword) {
    return res.json(reply(0, '验证通过', { token: 'authorized' }))
  } else {
    return res.status(403).json(reply(403, '口令错误', null))
  }
})

// 管理后台接口
app.get('/admin/list', (req, res) => {
  const list = store.getAll()
  res.json(reply(0, '获取成功', list))
})

app.post('/admin/delete', (req, res) => {
  const { id } = req.body
  if (!id) return res.status(400).json(reply(1, 'ID不能为空', null))
  store.remove(id)
  res.json(reply(0, '删除成功', null))
})

// ============================================================
// 核心修复：代理路由
// 这里的 /image/:path(*) 实际上对应外网的 /api/image/...
// ============================================================
app.get('/image/:path(*)', (req, res) => {
  const handler = createProxyHandler(REMOTE_BASE_URL, requestConfig)
  return handler(req, res)
})

// 上传接口
app.post(
  '/upload/img',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] }
      if (!files || !files.file) {
        return res.status(400).json(reply(1, '未上传文件', ''))
      }

      const mainFile = files.file?.[0]
      const thumbnailFile = files.thumbnail?.[0]

      // 1. 上传主图
      const mainResult = await uploadToCnb({
        fileBuffer: mainFile.buffer,
        fileName: mainFile.originalname,
      })

      // 2. 构建访问链接 (核心修复)
      // 这里的 baseUrl 是你的自定义域名 (例如 https://imgbed.huzz.cn)
      let baseUrl = process.env.BASE_IMG_URL || ''
      // 移除末尾斜杠
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1)
      }

      // 提取文件名 (例如 c6Gkt...)
      const mainImgName = extractImageName(mainResult.url)
      
      // 拼接完整路径：域名 + 函数前缀 + 代理路由 + 文件名
      // 结果示例: https://imgbed.huzz.cn/api/image/c6Gkt...
      const mainUrl = `${baseUrl}/api/image/${mainImgName}`

      let thumbnailUrl = null
      let thumbnailAssets = null

      // 3. 上传缩略图
      if (thumbnailFile) {
        const thumbnailResult = await uploadToCnb({
          fileBuffer: thumbnailFile.buffer,
          fileName: thumbnailFile.originalname,
        })
        const thumbnailImgName = extractImageName(thumbnailResult.url)
        thumbnailUrl = `${baseUrl}/api/image/${thumbnailImgName}`
        thumbnailAssets = thumbnailResult.assets
      }

      // 4. 记录到本地存储
      const record: ImageRecord = {
        id: crypto.randomUUID(),
        name: mainFile.originalname,
        url: mainUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        size: mainFile.size,
        type: mainFile.mimetype,
        createdAt: Date.now(),
      }
      store.add(record)

      res.json(
        reply(0, '上传成功', {
          url: mainUrl,
          thumbnailUrl: thumbnailUrl,
          assets: mainResult.assets,
          thumbnailAssets: thumbnailAssets,
          hasThumbnail: !!thumbnailFile,
        }),
      )
    } catch (err: any) {
      console.error('上传失败:', err.response?.data || err.message)
      res.status(500).json(reply(1, '上传失败', err.message))
    }
  },
)

/**
 * 辅助函数：从 CNB 完整 URL 中提取纯文件名
 * 输入: https://cnb.cool/.../-/imgs/abc.webp
 * 输出: abc.webp
 */
function extractImageName(url: string) {
  if (url.includes('-/imgs/')) {
    return url.split('-/imgs/')[1]
  } else if (url.includes('-/files/')) {
    return url.split('-/files/')[1]
  }
  // 如果没有特定标识，尝试取最后一部分
  const parts = url.split('/')
  return parts[parts.length - 1]
}

export default app
