/**
 * build-static.js
 * 将 HTML/CSS/JS + data/articles.json 编译到 dist/
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// 读取文章数据
const dataPath = path.join(__dirname, '..', 'data', 'articles.json');
let articles = [];
if (fs.existsSync(dataPath)) {
  articles = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

// 确保 marked 返回安全 HTML
marked.setOptions({
  breaks: true,
  gfm: true,
});

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMarkdown(md) {
  if (!md) return '<p>暂无内容</p>';
  return marked.parse(md);
}

function readTemplate(name) {
  return fs.readFileSync(path.join(__dirname, '..', 'templates', name), 'utf8');
}

function writeDist(filename, content) {
  const distPath = path.join(__dirname, '..', 'dist', filename);
  fs.mkdirSync(path.dirname(distPath), { recursive: true });
  fs.writeFileSync(distPath, content, 'utf8');
}

// ── 主页 ────────────────────────────────────────────────
function buildHome() {
  let template = readTemplate('index.html');

  // 按日期分组
  const grouped = {};
  articles.forEach((a) => {
    const date = new Date(a.createdAt).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(a);
  });

  // 生成文章卡片列表 HTML
  let cardsHtml = '';
  Object.keys(grouped).forEach((date) => {
    grouped[date].forEach((article) => {
      cardsHtml += `
        <article class="article-card" onclick="location.href='/articles/${article.slug}.html'">
          <div class="card-header">
            <img class="avatar" src="${article.avatar}" alt="${article.author}" />
            <div class="card-meta">
              <span class="author">${escapeHtml(article.author)}</span>
              <span class="date">${date}</span>
            </div>
          </div>
          <h2 class="card-title">${escapeHtml(article.title)}</h2>
          <p class="card-excerpt">${escapeHtml(article.excerpt)}</p>
          <div class="card-footer">
            ${article.labels.map((l) => `<span class="label">${escapeHtml(l)}</span>`).join('')}
            <span class="read-more">阅读 →</span>
          </div>
        </article>`;
    });
  });

  template = template.replace('<!-- ARTICLES -->', cardsHtml);
  writeDist('index.html', template);
  console.log('Built index.html');
}

// ── 文章详情页 ───────────────────────────────────────────
function buildArticle(article) {
  let template = readTemplate('article.html');
  const html = renderMarkdown(article.body);

  template = template.replace('<!-- ARTICLE_TITLE -->', escapeHtml(article.title));
  template = template.replace('<!-- ARTICLE_BODY -->', html);
  template = template.replace('<!-- ARTICLE_AVATAR -->', article.avatar);
  template = template.replace('<!-- ARTICLE_AUTHOR -->', escapeHtml(article.author));
  template = template.replace('<!-- ARTICLE_DATE -->', new Date(article.createdAt).toLocaleString('zh-CN'));
  template = template.replace('<!-- ARTICLE_LABELS -->',
    article.labels.map((l) => `<span class="label">${escapeHtml(l)}</span>`).join('')
  );
  template = template.replace(
    '<!-- ARTICLE_ISSUE_LINK -->',
    `<a href="${article.url}" target="_blank">查看原 Issue →</a>`
  );

  const filename = `articles/${article.slug}.html`;
  writeDist(filename, template);
  console.log(`Built ${filename}`);
}

// ── 入口 ────────────────────────────────────────────────
fs.mkdirSync(path.join(__dirname, '..', 'dist'), { recursive: true });

buildHome();
articles.forEach(buildArticle);
console.log(`Done. Total articles: ${articles.length}`);
