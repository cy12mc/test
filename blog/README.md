# blog

GitHub 风格博客，通过 Issues 驱动内容创作，Action 自动部署。

## 本地开发

```bash
npm install
node scripts/generate-blog.js    # 从 GitHub Issues 生成文章
npm run dev                       # 本地预览
```

## 原理

- 每篇 Issue = 一篇博客文章
- Issue 标签分类，title 为标题
- Issue body 支持 Markdown
- GitHub Actions 自动监听 Issue 事件并重新生成页面
