import express from 'express'
import { uploadToCnb, deleteFromCnb, createProxyHandler, PACKAGE_NAME, PACKAGE_VERSION } from './_utils'
import { reply } from './_reply'
import { store, type ImageRecord } from './_store'
import multer from 'multer'
import path from 'path'
// [修复] 去掉 node: 前缀，提升兼容性
import crypto from 'crypto' 

const upload = multer()
const app = express()

const REMOTE_BASE_URL = `https://api.cnb.cool/${process.env.SLUG_IMG}/-/packages/generic/${PACKAGE_NAME}/${PACKAGE_VERSION}/`

const requestConfig = {
  timeout: 15000,
  headers: {
    'Authorization': `Bearer ${process.env.TOKEN_IMG}`,
    'User-Agent': 'ImgBed-Proxy/2.0',
  },
}

app.use(express.json())

// 日志
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`)
  next()
})

// 身份验证接口 (不需要 store，最优先处理)
app.post('/auth/verify', (req, res) => {
  try {
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
  } catch (e: any) {
    console.error('Auth error:', e)
    res.status(500).json(reply(500, '服务内部错误', null))
  }
})

// 管理接口
app.get('/admin/list', async (req, res) => {
  try {
    const list = await store.getAll()
    res.json(reply(0, '获取成功', list))
  } catch (e: any) {
    console.error('List error:', e)
    res.status(500).json(reply(500, '获取列表失败', null))
  }
})

app.post('/admin/delete', async (req, res) => {
  const { id } = req.body
  if (!id) return res.status(400).json(reply(1, 'ID不能为空', null))

  try {
    const list = await store.getAll()
    const target = list.find(item => item.id === id)

    if (!target) return res.status(404).json(reply(1, '记录不存在', null))

    const ext = path.extname(target.name) || '.png'
    const cloudFileName = `${target.id}${ext}`
    await deleteFromCnb(cloudFileName).catch(e => console.warn('Main file delete warn:', e))

    if (target.thumbnailUrl) {
       const thumbFileName = `${target.id}_thumb.webp`
       await deleteFromCnb(thumbFileName).catch(e => console.warn('Thumb delete warn:', e))
    }

    await store.remove(id)
    res.json(reply(0, '物理删除成功', null))
  } catch (e: any) {
    console.error('Delete error:', e)
    res.status(500).json(reply(1, '删除失败: ' + e.message, null))
  }
})

// 代理路由
app.get('/image/:path(*)', (req, res) => {
  const handler = createProxyHandler(REMOTE_BASE_URL, requestConfig)
  return handler(req, res)
})

// 上传接口
app.post('/upload/img', upload.fields([{ name: 'file' }, { name: 'thumbnail' }]), async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    if (!files?.file?.[0]) return res.status(400).json(reply(1, '无文件', ''))

    const mainFile = files.file[0]
    const thumbFile = files.thumbnail?.[0]
    
    const fileId = crypto.randomUUID()
    const fileExt = path.extname(mainFile.originalname) || '.png'
    const cloudMainName = `${fileId}${fileExt}`

    await uploadToCnb({
      fileBuffer: mainFile.buffer,
      fileName: cloudMainName,
    })

    let baseUrl = process.env.BASE_IMG_URL || ''
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)
    
    const mainUrl = `${baseUrl}/api/image/${cloudMainName}`
    const mainUrlOriginal = `${REMOTE_BASE_URL}${cloudMainName}`

    let thumbnailUrl = null
    let thumbnailOriginalUrl = null

    if (thumbFile) {
      const cloudThumbName = `${fileId}_thumb.webp`
      await uploadToCnb({
        fileBuffer: thumbFile.buffer,
        fileName: cloudThumbName,
      })
      thumbnailUrl = `${baseUrl}/api/image/${cloudThumbName}`
      thumbnailOriginalUrl = `${REMOTE_BASE_URL}${cloudThumbName}`
    }

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
    
    // 必须等待保存完成
    await store.add(record)

    res.json(reply(0, '上传成功', {
      url: mainUrl,
      thumbnailUrl: thumbnailUrl,
      urlOriginal: mainUrlOriginal,
      thumbnailOriginalUrl: thumbnailOriginalUrl
    }))

  } catch (err: any) {
    console.error(err)
    res.status(500).json(reply(1, err.message, null))
  }
})

export default app
