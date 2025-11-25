import express from 'express'
import { uploadToCnb, deleteFromCnb, createProxyHandler, PACKAGE_NAME, PACKAGE_VERSION } from './_utils'
import { reply } from './_reply'
import { store, type ImageRecord } from './_store'
import multer from 'multer'
import path from 'path'
import crypto from 'crypto'

const upload = multer()
const app = express()

// 构造 CNB 制品库的直连下载 Base URL
// 格式: https://api.cnb.cool/<slug>/-/packages/generic/<pkg>/<ver>/
const REMOTE_BASE_URL = `https://api.cnb.cool/${process.env.SLUG_IMG}/-/packages/generic/${PACKAGE_NAME}/${PACKAGE_VERSION}/`

const requestConfig = {
  timeout: 10000,
  headers: {
    // 如果是私有仓库，需要 Token；公开仓库可留空
    'Authorization': `Bearer ${process.env.TOKEN_IMG}`,
    'User-Agent': 'ImgBed-EdgeOne/1.0',
  },
}

app.use(express.json())

// 1. 身份验证接口 (最优先，确保可用)
app.post('/auth/verify', (req, res) => {
  try {
    const { password } = req.body
    const sysPassword = process.env.SITE_PASSWORD
    
    if (!sysPassword) {
      return res.json(reply(0, 'Open Access', { token: 'open' }))
    }
    if (password === sysPassword) {
      return res.json(reply(0, 'Success', { token: 'auth' }))
    }
    return res.status(403).json(reply(403, 'Password Error', null))
  } catch (e) {
    res.status(500).json(reply(500, 'Auth Error', null))
  }
})

// 2. 管理列表接口
app.get('/admin/list', (req, res) => {
  // 同步读取，极其稳定
  const list = store.getAll()
  res.json(reply(0, 'ok', list))
})

// 3. 物理删除接口
app.post('/admin/delete', async (req, res) => {
  const { id } = req.body
  if (!id) return res.status(400).json(reply(1, 'No ID', null))

  const list = store.getAll()
  const target = list.find(item => item.id === id)

  if (!target) {
    // 如果找不到记录，尝试直接删除 ID（防御性编程）
    store.remove(id) 
    return res.json(reply(0, 'Record removed (File not found)', null))
  }

  try {
    // 物理删除主图
    // 我们的云端文件名规则是: UUID + 后缀
    const ext = path.extname(target.name) || '.png'
    const cloudFileName = `${target.id}${ext}`
    
    await deleteFromCnb(cloudFileName).catch(e => console.warn('Main delete warn:', e.message))

    // 物理删除缩略图
    if (target.thumbnailUrl) {
       const thumbFileName = `${target.id}_thumb.webp`
       await deleteFromCnb(thumbFileName).catch(e => console.warn('Thumb delete warn:', e.message))
    }

    // 删除数据库记录
    store.remove(id)
    res.json(reply(0, 'Delete Success', null))
  } catch (e: any) {
    console.error('Delete Error:', e)
    res.status(500).json(reply(1, 'Delete Failed: ' + e.message, null))
  }
})

// 4. 图片代理路由
// 匹配 /image/xxxxxx.jpg
app.get('/image/:path(*)', (req, res) => {
  // 直接复用 utils 里的处理函数
  return createProxyHandler(REMOTE_BASE_URL, requestConfig)(req, res)
})

// 5. 上传接口
app.post('/upload/img', upload.fields([{ name: 'file' }, { name: 'thumbnail' }]), async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    if (!files?.file?.[0]) return res.status(400).json(reply(1, 'No File', ''))

    const mainFile = files.file[0]
    const thumbFile = files.thumbnail?.[0]
    
    // 生成唯一 ID 作为文件名
    const fileId = crypto.randomUUID()
    const fileExt = path.extname(mainFile.originalname) || '.png'
    const cloudMainName = `${fileId}${fileExt}`

    // 上传主图
    await uploadToCnb({
      fileBuffer: mainFile.buffer,
      fileName: cloudMainName,
    })

    // 拼接 Base URL (去除末尾斜杠)
    let baseUrl = process.env.BASE_IMG_URL || ''
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)
    
    // 代理链接
    const mainUrl = `${baseUrl}/api/image/${cloudMainName}`
    // 直连链接
    const mainUrlOriginal = `${REMOTE_BASE_URL}${cloudMainName}`

    let thumbnailUrl = null
    let thumbnailOriginalUrl = null

    // 上传缩略图
    if (thumbFile) {
      const cloudThumbName = `${fileId}_thumb.webp`
      await uploadToCnb({
        fileBuffer: thumbFile.buffer,
        fileName: cloudThumbName,
      })
      thumbnailUrl = `${baseUrl}/api/image/${cloudThumbName}`
      thumbnailOriginalUrl = `${REMOTE_BASE_URL}${cloudThumbName}`
    }

    // 存入本地库
    const record: ImageRecord = {
      id: fileId,
      name: mainFile.originalname,
      url: mainUrl,
      urlOriginal: mainUrlOriginal,
      thumbnailUrl: thumbnailUrl || undefined,
      thumbnailOriginalUrl: thumbnailOriginalUrl || undefined,
      size: mainFile.size,
      type: mainFile.mimetype,
      createdAt: Date.now(),
    }
    store.add(record)

    res.json(reply(0, 'Upload Success', {
      url: mainUrl,
      thumbnailUrl: thumbnailUrl,
      urlOriginal: mainUrlOriginal,
      thumbnailOriginalUrl: thumbnailOriginalUrl
    }))

  } catch (err: any) {
    console.error('Upload Error:', err)
    res.status(500).json(reply(1, err.message || 'Upload Failed', null))
  }
})

export default app
