/**
 * 新增模块：CNB 制品库接口封装
 * 用于实现支持物理删除的高级图床功能
 */

// 定义制品库的包名和版本
export const PACKAGE_NAME = 'imgbed-archive'
export const PACKAGE_VERSION = 'v1'

/**
 * 上传文件到制品库 (支持覆盖和删除)
 * @param fileBuffer 文件内容
 * @param fileName 文件名
 */
export async function uploadToGenericPackage(fileBuffer: Buffer, fileName: string) {
  const slug = process.env.SLUG_IMG
  const token = process.env.TOKEN_IMG

  if (!slug || !token) {
    throw new Error('缺少环境变量 SLUG_IMG 或 TOKEN_IMG')
  }

  // 构造 Generic Packages 的 PUT 地址
  const url = `https://api.cnb.cool/${slug}/-/packages/generic/${PACKAGE_NAME}/${PACKAGE_VERSION}/${fileName}`

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
    throw new Error(`CNB Upload Failed: ${resp.status} - ${errText}`)
  }

  return {
    filename: fileName,
    // 构造一个符合 Generic Package 规范的下载路径
    // 注意：这个路径主要用于后端代理拼接
    path: `/${PACKAGE_NAME}/${PACKAGE_VERSION}/${fileName}`
  }
}

/**
 * 物理删除文件
 * @param fileName 文件名
 */
export async function deleteFromGenericPackage(fileName: string) {
  const slug = process.env.SLUG_IMG
  const token = process.env.TOKEN_IMG
  
  const url = `https://api.cnb.cool/${slug}/-/packages/generic/${PACKAGE_NAME}/${PACKAGE_VERSION}/${fileName}`

  const resp = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  // 404 也视为删除成功（文件本来就不在）
  if (!resp.ok && resp.status !== 404) {
    throw new Error(`CNB Delete Failed: ${resp.status}`)
  }

  return true
}

/**
 * 构造制品库的直链 Base URL
 */
export function getGenericPackageBaseUrl() {
  return `https://api.cnb.cool/${process.env.SLUG_IMG}/-/packages/generic/${PACKAGE_NAME}/${PACKAGE_VERSION}/`
}
