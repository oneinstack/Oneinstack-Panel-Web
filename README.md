# Oneinstack-Panel-Web

## 项目目录结构
- `build`：构建相关的文件或目录。
- `node_modules`：项目依赖的 Node.js 模块。
- `src`：源代码目录。
- `tsconfig.json`：TypeScript 配置文件。
- `verson`：可能与版本相关的文件或目录。
- `public`：公共资源目录。
- `package.json`：项目的依赖和脚本配置。
- `vite.config.ts`：Vite 配置文件。
- `dist`：构建后的输出目录。
- `index.html`：项目的入口 HTML 文件。
## 项目依赖
- Node.js 22：与 `.node-version`、`.nvmrc` 和 CI 保持一致，请勿使用 Node.js 16 构建。
- Vite：用于快速开发、构建和预览 Vue.js 应用程序的工具。
## 项目介绍
这是一个基于 Vue.js 和 Vite 的前端项目。
## 安装与验证

```sh
nvm install
nvm use
npm ci
npm test
npm run typecheck
npm run build
```

未使用 nvm 时，请先使用其他版本管理器切换到 Node.js 22。

终端依赖保持同一兼容系列：`xterm@5.3.0`、`xterm-addon-fit@0.8.0`、
`xterm-addon-canvas@0.5.0`。不要只替换为 `@xterm/addon-canvas`：该包属于
`@xterm/xterm` 系列，迁移时需要同时检查所有终端组件、插件与样式引用。
配套关系见 [xterm.js 5.3.0 发布说明](https://github.com/xtermjs/xterm.js/releases/tag/5.3.0)。
## 运行命令
npm run dev
## 技术框架
- 前端使用了 Vite 构建工具。
- 编程语言主要为 TypeScript。
