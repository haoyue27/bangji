# 班级抽奖与分组系统 — 部署说明

本项目是一个纯前端静态网站（Vite + React + TypeScript），所有数据保存在浏览器本地（localStorage），**无需后端服务器**，可部署到任意静态托管平台。

---

## 一、项目简介

功能包括：

- **班级分组**：导入学生名单，按组数/每组人数随机分组，支持拖拽调整、导出结果
- **名字抽取**：可选参与名单、允许/禁止重复、排除已抽中、修改抽取结果、历史记录
- **奖品抽取**：奖品池 + 3 个奖品容器，支持一键抽取、重置、导出
- **游戏抽取**：你画我猜、谁是卧底、听歌识曲、emoji 成语；支持导入 Word 题库，自动配对，抽取时可隐藏答案

---

## 二、环境要求

| 工具 | 版本要求 |
|------|----------|
| Node.js | 18 或以上（推荐 20 LTS） |
| npm | 9 或以上（随 Node 安装） |
| 浏览器 | Chrome / Edge / Firefox 最新版 |

检查版本：

```bash
node -v
npm -v
```

---

## 三、本地运行（开发模式）

```bash
# 1. 进入项目目录
cd classroom-lottery

# 2. 安装依赖（首次或依赖变化时）
npm install

# 3. 启动开发服务器
npm run dev
```

启动后终端会显示地址，通常是：

```
http://localhost:5173/
```

在浏览器打开即可使用。修改代码会自动热更新。

---

## 四、构建生产版本

```bash
npm run build
```

构建完成后会在项目根目录生成 `dist/` 文件夹，包含所有静态资源（HTML/CSS/JS/图片）。这就是可部署的最终产物。

本地预览构建结果（可选）：

```bash
npm run preview
```

---

## 五、部署方式

### 方式 A：Netlify（推荐，最简单）

1. 登录 [Netlify](https://app.netlify.com/)
2. 点击 **Add new site → Deploy manually**
3. 将 `dist/` 文件夹拖拽上传
4. 完成，获得一个 `https://xxx.netlify.app` 地址

或连接 Git 仓库（自动构建）：

- Build command: `npm run build`
- Publish directory: `dist`
- 项目已包含 `netlify.toml`，无需额外配置

### 方式 B：Vercel

1. 登录 [Vercel](https://vercel.com/)
2. **Import Project** 选择 Git 仓库或上传
3. 项目已包含 `vercel.json`，自动识别构建命令与输出目录
4. 部署完成后获得 `https://xxx.vercel.app`

### 方式 C：GitHub Pages

1. 将项目推送到 GitHub 仓库
2. 在仓库 Settings → Pages 中选择 **GitHub Actions** 或 **Deploy from a branch**
3. 若用 Actions，创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

4. 推送后自动部署，访问 `https://<用户名>.github.io/<仓库名>/`

> 注意：GitHub Pages 子路径部署需要在 `vite.config.ts` 中设置 `base: '/仓库名/'`。

### 方式 D：自有服务器 / Nginx

1. 执行 `npm run build`
2. 将 `dist/` 内所有文件上传到服务器 Web 根目录（如 `/var/www/html/`）
3. Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

4. 重启 Nginx：`sudo systemctl reload nginx`

### 方式 E：任意静态托管（阿里云 OSS、腾讯云 COS、七牛云等）

1. 执行 `npm run build`
2. 上传 `dist/` 内容到对象存储的静态网站托管目录
3. 开启「静态网站托管」并设置首页为 `index.html`，404 页面也指向 `index.html`

---

## 六、数据与隐私说明

- 所有学生名单、分组结果、抽取历史、题库均保存在**用户浏览器的 localStorage** 中
- 不会上传到任何服务器，也不会跨设备同步
- 清除浏览器缓存/数据会导致本地数据丢失，建议重要结果及时「复制」导出

---

## 七、常见问题

**Q1：部署后页面空白？**
- 检查构建是否成功（`dist/index.html` 是否存在）
- 检查服务器是否正确返回 `index.html`（SPA 路由回退）
- GitHub Pages 子路径部署需设置 `base`

**Q2：导入 Word 题库失败？**
- 仅支持 `.docx` 格式（不支持 `.doc`）
- 文件需为标准 Word 文档，纯文本/表格均可
- 导入后可在「词库/题库」区域手动清理无效行

**Q3：手机上显示异常？**
- 项目已适配移动端（竖屏单列布局）
- 建议使用现代浏览器，避免旧版 IE

**Q4：如何更新已部署的网站？**
- 重新 `npm run build`，上传新的 `dist/` 覆盖旧文件即可
- 用户浏览器可能缓存旧版本，可强制刷新（Ctrl+F5）

---

## 八、项目结构

```
classroom-lottery/
├── dist/                 # 构建产物（部署这个目录）
├── public/               # 静态资源
├── src/
│   ├── components/       # 功能组件
│   ├── data/             # 默认题库
│   ├── App.tsx           # 主界面
│   ├── store.tsx         # 全局状态
│   └── index.css         # 样式
├── index.html
├── netlify.toml          # Netlify 配置
├── vercel.json           # Vercel 配置
├── package.json
└── README.md
```

---

## 九、快速命令汇总

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建结果 |
| `npm run lint` | 代码检查 |

---

如需进一步定制（主题颜色、新增题库类型、修改抽取逻辑），请修改 `src/` 下对应文件后重新构建部署。
