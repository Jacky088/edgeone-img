/**
 * CNB Generic Packages (制品库) 工具类
 */

// 定义包配置
export const PACKAGE_NAME = 'imgbed-assets'
export const PACKAGE_VERSION = 'v1'

/**
 * 上传文件到 CNB 制品库 (Generic Packages)
 * 文档: https://docs.cnb.cool/zh/artifacts/generic_packages.html
 */
async function uploadToCnb({ fileBuffer, fileName }) {
  const slug = process.env.SLUG_IMG
  if (!slug || !process.env.TOKEN_IMG) {
    throw new Error('缺少环境变量 SLUG_IMG 或 TOKEN_IMG')
  }

  // 使用 PUT 接口上传到制品库
  const url = `https://api.cnb.cool/${slug}/-/packages/generic/${PACKAGE_NAME}/${PACKAGE_VERSION}/${fileName}`

  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.TOKEN_IMG}`,
      'Content-Type': 'application/octet-stream',
    },
    body: fileBuffer,
  })

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`CNB Upload Error: ${resp.status} - ${errText}`)
  }

  // 制品库不返回直接的 assets 结构，我们需要手动构造返回
  // 这里的 path 结构要符合 CNB 制品库的下载路径规则
  return {
    path: `/${fileName}`,
    filename: fileName
  }
}

/**
 * [新增] 物理删除文件
 */
async function deleteFromCnb(fileName) {
  const slug = process.env.SLUG_IMG
  const url = `https://api.cnb.cool/${slug}/-/packages/generic/${PACKAGE_NAME}/${PACKAGE_VERSION}/${fileName}`

  const resp = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${process.env.TOKEN_IMG}`,
    },
  })

  // 200-299 视为成功，404 也视为成功(文件已不存在)
  if (!resp.ok && resp.status !== 404) {
    const errText = await resp.text()
    throw new Error(`CNB Delete Error: ${resp.status} - ${errText}`)
  }
  
  return true
}

/**
 * 代理处理函数 (保持你提供的稳定版本逻辑，不做大改)
 */
function createProxyHandler(baseUrl, requestConfig) {
  return async (req, res) => {
    try {
      // 兼容处理：有时候 req.params.path 是数组，有时候是字符串
      const rawPath = req.params.path
      const urlPath = Array.isArray(rawPath) ? rawPath.join('/') : rawPath

      if (!urlPath || urlPath.includes('..')) {
        return res.status(400).json({ error: 'Invalid path' })
      }

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

export { uploadToCnb, deleteFromCnb, createProxyHandler }
