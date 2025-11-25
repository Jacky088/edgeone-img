import express from 'express'
// 直接从 _utils 引入所有功能，不新增文件，确保稳定
import { uploadToCnb, deleteFromCnb, createProxyHandler, PACKAGE_NAME, PACKAGE_VERSION } from './_utils'
import { reply } from './_reply'
import { store } from './_store' // 保持引用你那个能跑的 _store
import multer from 'multer'
import path from 'path'

// 使用 require 引入 crypto，避免 import 兼容性问题
const crypto = require('crypto')

const upload = multer()
const app = express()

// 构造制品库的 Base URL
// 结果类似: https://api.cnb.cool/user/repo/-/packages/generic/imgbed-storage/v1/
const REMOTE_BASE_URL = `https://api.cnb.cool/${process.env.SLUG_IMG}/-/packages/generic/${PACKAGE_NAME}/${PACKAGE_VERSION}/`

const requestConfig = {
  timeout: 15000,
  headers: {
    'Authorization': `Bearer ${process.env.TOKEN_IMG}`,
    'User-Agent': 'ImgBed-Proxy/2.0',
  },
}

app.use(express.json())

// 1. 身份验证接口 (放在最前，确保任何时候都能访问)
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
    res.status(500).json(reply(500, 'Auth System Error', null))
  }
})

// 2. 获取列表
app.get('/admin/list', (req, res) => {
  // 同步读取，稳定
  const list = store.getAll()
  res.json(reply(0, 'ok', list))
})

// 3. [核心] 物理删除接口
app.post('/admin/delete', async (req, res) => {
  const { id } = req.body
  if (!id) return res.status(400).json(reply(1, 'No ID', null))

  try {
    const list = store.getAll()
    const target = list.find(item => item.id === id)

    if (!target) {
      store.remove(id) // 清理死数据
      return res.json(reply(0, 'Record removed', null))
    }

    // 物理删除主图 (文件名 = ID + 后缀)
    const ext = path.extname(target.name) || '.png'
    const cloudFileName = `${target.id}${ext}`
    
    await deleteFromCnb(cloudFileName).catch(e => console.warn('Remote delete warn:', e.message))

    // 物理删除缩略图
    if (target.thumbnailUrl) {
       const thumbFileName = `${target.id}_thumb.webp`
       await deleteFromCnb(thumbFileName).catch(() => {})
    }

    // 删除数据库记录
    store.remove(id)
    res.json(reply(0, 'Delete Success', null))
  } catch (e) {
    console.error('Delete Error:', e)
    res.status(500).json(reply(1, 'Delete Failed', null))
  }
})

// 4. 图片代理路由 (匹配 /api/image/xxxx)
app.get('/image/:path(*)', (req, res) => {
  // 直接把请求转给 _utils 里的 handler
  return createProxyHandler(REMOTE_BASE_URL, requestConfig)(req, res)
})

// 5. 上传接口
app.post('/upload/img', upload.fields([{ name: 'file' }, { name: 'thumbnail' }]), async (req, res) => {
  try {
    const files = req.files
    if (!files || !files.file || files.file.length === 0) {
      return res.status(400).json(reply(1, 'No File', ''))
    }

    const mainFile = files.file[0]
    const thumbFile = files.thumbnail ? files.thumbnail[0] : null
    
    // 生成 UUID 作为文件名，这是物理删除的关键
    const fileId = crypto.randomUUID()
    const fileExt = path.extname(mainFile.originalname) || '.png'
    const cloudMainName = `${fileId}${fileExt}`

    // 上传主图
    await uploadToCnb({
      fileBuffer: mainFile.buffer,
      fileName: cloudMainName,
    })

    // 拼接链接
    let baseUrl = process.env.BASE_IMG_URL || ''
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)
    
    // 代理链接: /api/image/uuid.jpg
    const mainUrl = `${baseUrl}/api/image/${cloudMainName}`
    // 直连链接: 这里的 REMOTE_BASE_URL 已经是制品库地址了
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

    // 写入本地数据库
    const record = {
      id: fileId,
      name: mainFile.originalname,
      url: mainUrl,
      urlOriginal: mainUrlOriginal,
      thumbnailUrl: thumbnailUrl,
      thumbnailOriginalUrl: thumbnailOriginalUrl,
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

  } catch (err) {
    console.error('Upload Error:', err)
    res.status(500).json(reply(1, 'Upload Failed: ' + err.message, null))
  }
})

export default app
