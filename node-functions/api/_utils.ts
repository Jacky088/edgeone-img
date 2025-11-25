/**
 * CNB 工具库 (All-in-One 版本)
 * 集成 Generic Packages 接口以支持物理删除
 */

// 定义制品库的包名和版本
const PACKAGE_NAME = 'imgbed-storage'
const PACKAGE_VERSION = 'v1'

/**
 * 核心：上传文件 (改为使用 Generic Packages PUT 接口)
 * 文档参考：Generic Packages API
 */
async function uploadToCnb({ fileBuffer, fileName }) {
  // 1. 检查环境变量
  const slug = process.env.SLUG_IMG
  const token = process.env.TOKEN_IMG
  
  if (!slug || !token) {
    throw new Error('Missing env: SLUG_IMG or TOKEN_IMG')
  }

  // 2. 构造 Generic Packages URL
  // 格式: https://api.cnb.cool/<user>/<repo>/-/packages/generic/<pkg>/<ver>/<filename>
  const url = `https://api.cnb.cool/${slug}/-/packages/generic/${PACKAGE_NAME}/${PACKAGE_VERSION}/${fileName}`

  // 3. 发送 PUT 请求
  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
    body: fileBuffer,
  })

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`CNB Upload Failed (${resp.status}): ${errText}`)
  }

  // 4. 返回结果 (构造直连路径供后端代理使用)
  // 注意：这里不返回 assets 对象了，因为制品库没有这个字段
  return {
    filename: fileName,
    // 这个 path 用于后续拼接代理链接
    path: `/${PACKAGE_NAME}/${PACKAGE_VERSION}/${fileName}`
  }
}

/**
 * 核心：物理删除文件 (新增)
 */
async function deleteFromCnb(fileName) {
  const slug = process.env.SLUG_IMG
  const url = `https://api.cnb.cool/${slug}/-/packages/generic/${PACKAGE_NAME}/${PACKAGE_VERSION}/${fileName}`

  const resp = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${process.env.TOKEN_IMG}`,
    },
  })

  // 404 也算成功（文件本就不在）
  if (!resp.ok && resp.status !== 404) {
    const errText = await resp.text()
    throw new Error(`CNB Delete Failed (${resp.status}): ${errText}`)
  }

  return true
}

/**
 * 代理处理函数 (保持 Buffer 模式，最稳定)
 */
function createProxyHandler(baseUrl, requestConfig) {
  return async (req, res) => {
    try {
      const urlPath = req.params.path
      if (!urlPath || urlPath.includes('..')) {
        return res.status(400).json({ error: 'Invalid path' })
      }

      // 拼接目标 URL
      const targetUrl = new URL(urlPath, baseUrl).toString()

      const fetchOptions = {
        method: 'GET',
        headers: requestConfig?.headers || {},
      }

      const response = await fetch(targetUrl, fetchOptions)

      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'image/png'
        const arrayBuffer = await response.arrayBuffer()

        res.setHeader('Content-Type', contentType)
        // 设置强缓存
        res.setHeader('Cache-Control', 'public, max-age=31536000')
        res.send(Buffer.from(arrayBuffer))
      } else {
        if (response.status === 404) return res.status(404).send('Not Found')
        res.status(response.status).json({ error: 'Upstream Error' })
      }
    } catch (e) {
      console.error(`Proxy Error: ${e.message}`)
      if (!res.headersSent) res.status(500).json({ error: 'Internal Error' })
    }
  }
}

// 统一导出
export { uploadToCnb, deleteFromCnb, createProxyHandler, PACKAGE_NAME, PACKAGE_VERSION }
