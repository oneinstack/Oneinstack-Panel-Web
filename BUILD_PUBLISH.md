# Web 自动构建与 Publish 分支

`main` 每次收到推送后，`Publish Web Assets` 工作流会执行锁定依赖安装、类型检查、
单元测试和生产构建，然后使用一次性提交强制更新 `Publish` 分支。

`Publish` 分支是构建产物分支，不接受人工修改，包含：

- `app.zip` 与 `app.zip.sha256`：Panel Release 实际嵌入的前端压缩包和摘要。
- `dist/` 与 `dist.sha256`：可检查的展开静态资源及逐文件摘要。
- `SOURCE_SHA`、`WEB_VERSION`、`build-info.json`：源码提交和构建来源。

该模式参考 AList Web 将源码构建结果发布到独立 dist 分支/仓库的方式，同时增加
了 Panel 跨私有仓库构建所需的来源与完整性校验。

仓库 Actions 必须允许 `GITHUB_TOKEN` 写入 Contents。若 `Publish` 设置了分支保护，
需要允许此工作流进行强制更新；工作流只监听 `main`，因此更新 `Publish` 不会递归触发。

首次启用顺序：先把本工作流推送到 Web `main` 并等待 `Publish` 分支生成成功，再推送
Panel `main` 触发自动标签和 Release。也可在 Actions 页面手动执行一次
`Publish Web Assets` 完成初始化。
