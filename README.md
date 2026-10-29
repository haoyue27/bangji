# 班级抽奖与分组系统

React + Vite + TypeScript 静态网站，支持：
- 班级同学分组（随机分组，可拖拽调整）
- 名字抽取（可修改结果、撤销、排除已抽）
- 奖品抽取（三个奖品容器，分别抽奖）

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

产物在 `dist/`，可部署到 Vercel / Netlify / GitHub Pages / 任意静态主机。

## 部署

- Vercel: 导入仓库，构建命令 `npm run build`，输出目录 `dist`
- Netlify: 已提供 `netlify.toml`
- GitHub Pages: 构建后将 `dist` 内容发布

数据保存在浏览器 localStorage，无后端。
