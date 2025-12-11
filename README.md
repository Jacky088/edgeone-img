# Edgeone‑Imgbed

**Edgeone‑Imgbed**
是一个轻量级、无服务器的图片托管服务，支持图片上传、自动压缩与缩略图生成。\
该项目基于 **腾讯云 EdgeOne Pages Functions** 与 **CNB 对象存储服务**
构建，实现零成本部署与全球 CDN 加速。

------------------------------------------------------------------------

## 🚀 功能特性

-   📤 支持拖拽或点击上传图片\
-   🗜️ 自动压缩图片以节省存储空间\
-   🖼️ 自动生成缩略图\
-   🔗 一键获取图片直链（通过 EdgeOne 代理）\
-   ⚡ 前端使用 Vue 3 + Vite 高效构建\
-   🔒 可选设置访问密码保护上传界面

------------------------------------------------------------------------

## 🧰 技术栈

- **前端**: Vue 3 + TypeScript + Vite + TailwindCSS
- **后端**: EdgeOne Pages Node Functions + Express.js
- **上传**: Multer + CNB 对象存储服务

------------------------------------------------------------------------

## 📦 快速开始

### 📥 安装依赖

``` bash
pnpm install
```

### 🧑‍💻 本地开发

``` bash
pnpm dev
```

访问后打开浏览器：http://localhost:5173

------------------------------------------------------------------------

### 一键部署

[![使用国内版EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fhobk%2Feo-short%2F)（国内版）

[![使用国际版EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fhobk%2Feo-short%2F)（国际版）


### 🔧 环境变量配置

在 EdgeOne 控制台中为项目添加以下变量：

    BASE_IMG_URL=你的图床域名（需以 / 结尾，例如 https://img.example.com/）
    SLUG_IMG=CNB 对象存储仓库名（格式：用户名/仓库名）
    TOKEN_IMG=CNB 仓库访问令牌
    SITE_PASSWORD=访问密码（可选）

------------------------------------------------------------------------

## 🔑 获取 CNB TOKEN

1.  登录  [CNB官网](https://cnb.cool/)，在右上角点击头像进入个人设置\
2.  选择 **访问令牌**\
3.  找到你的图床仓库（需先创建且设置为公开）\
4.  授权范围选择最大读写权限\
5.  生成并复制 Token，用于环境变量 `TOKEN_IMG` 配置

------------------------------------------------------------------------

## 🤝 致谢

感谢项目 [**WhY15w 的 hw‑img‑host**](https://github.com/WhY15w/hw-img-host) 提供灵感与基础实现。

------------------------------------------------------------------------


## 📄 License

本项目遵循 MIT License。

---

如果这个插件对你有帮助，欢迎在 GitHub 上点一个 ⭐ 支持作者！
