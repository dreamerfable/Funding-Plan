# 九亦

个人资产配置计划、持仓快照与偏离分析。纯前端，数据保存在浏览器 localStorage。

## 技术栈

- pnpm / Vite / Vue 3 / TypeScript
- Nuxt UI (Vue)
- Tailwind CSS 4
- Chart.js、lucide-vue-next、vue-i18n

## 开发

```bash
pnpm install   # 或 npm install
pnpm dev
```

## 构建与部署

```bash
pnpm build
```

将仓库连接到 [Vercel](https://vercel.com)，框架选 **Vite**，构建命令 `pnpm build`，输出目录 `dist`。`vercel.json` 已配置 SPA 回退。

## 数据

- 自动保存至 `localStorage`（键名 `funding-plan-v1`）
- 设置页可导出 / 导入 JSON 全量备份
