# Edgeone-imgbed

一个简单的无服务器图片托管服务，支持图片上传、自动压缩和缩略图生成.

基于腾讯云 EdgeOne Pages Functions 和 CNB 仓库免费对象存储服务构建.


## 功能特性

- 📤 拖拽或点击上传图片
- 🗜️ 自动压缩图片，优化存储空间
- 🖼️ 自动生成缩略图
- 🔗 一键获取图片链接 (EdgeOne 代理)
- ⚡ 基于 Vue 3 + Vite 快速构建

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite + TailwindCSS
- **后端**: EdgeOne Pages Node Functions + Express.js
- **上传**: Multer + CNB 对象存储服务

## 快速开始

### 一键部署

[![使用国内版EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fhobk%2Feo-short%2F)（国内版）

[![使用国际版EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fhobk%2Feo-short%2F)（国际版）

## 环境配置

在EdgeOne控制台，配置以下环境变量：

```env
BASE_IMG_URL=你的图床域名，结尾带斜杠，例如：https://img.example.com/
SLUG_IMG=CNB图床仓库名，例如：组织名/仓库名
TOKEN_IMG=CNB图床仓库Token令牌
SITE_PASSWORD=设置口令验证
```

## 获取 TOKEN

1. 登录 [CNB官网](https://cnb.cool/) 右上角头像点击 个人设置。

2. 选择“访问令牌”，找到你的图床仓库（需要先创建一个空仓库，必须设为公开）。

3. 授权范围全部选读写最大。

4. 点击“生成Token”按钮，复制生成的Token。


## 感谢

[WhY15w的hw-img-host](https://github.com/WhY15w/hw-img-host)
