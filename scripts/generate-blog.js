/**
 * generate-blog.js
 * 从 GitHub Issues API 拉取数据，生成 articles.json
 * 每篇 Issue = 一篇博客文章
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const repo = process.env.GITHUB_REPO || 'owner/blog';
const token = process.env.GITHUB_TOKEN;

const owner = repo.split('/')[0];
const name = repo.split('/')[1];

async function fetchIssues() {
  const url = `/repos/${owner}/${name}/issues?state=all&sort=created&direction=desc&per_page=100`;
  const headers = { Accept: 'application/vnd.github.v3+json' };
  if (token) headers['Authorization'] = `token ${token}`;

  return new Promise((resolve, reject) => {
    https.get(url, { host: 'api.github.com', headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        // 处理分页链接
        const linkHeader = res.headers.link;
        resolve({ data, linkHeader });
      });
    }).on('error', reject);
  });
}

function parseLinkHeader(linkHeader) {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="last"/);
  return match ? new URL(match[1]).pathname : null;
}

async function fetchAllIssues() {
  const first = await fetchIssues();
  let all = JSON.parse(first.data).filter(
    (i) => i.pull_request === undefined // 排除 PR
  );

  // 拉取最后一页拿到总数
  const lastPath = parseLinkHeader(first.linkHeader);
  if (lastPath) {
    const last = await fetchIssues(lastPath);
    all = JSON.parse(last.data).filter((i) => i.pull_request === undefined);
  }

  return all;
}

function extractBody(body) {
  if (!body) return '';
  // 截取前 2000 字作为摘要
  return body.length > 2000 ? body.slice(0, 2000) + '...' : body;
}

function issuesToArticles(issues) {
  return issues.map((issue) => ({
    id: issue.number,
    title: issue.title,
    slug: issue.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-'),
    body: issue.body || '',
    excerpt: extractBody(issue.body),
    labels: (issue.labels || []).map((l) => l.name),
    author: issue.user?.login || 'unknown',
    avatar: issue.user?.avatar_url || '',
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    url: issue.html_url,
  }));
}

function writeArticles(articles) {
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/articles.json', JSON.stringify(articles, null, 2));
  console.log(`Generated ${articles.length} articles.`);
}

(async () => {
  try {
    console.log(`Fetching issues from ${repo}...`);
    const issues = await fetchAllIssues();
    const articles = issuesToArticles(issues);
    writeArticles(articles);
  } catch (err) {
    console.error('Failed to generate articles:', err.message);
    // 如果获取失败，保留已有数据或生成空文件
    if (!fs.existsSync('data/articles.json')) {
      writeArticles([]);
    }
  }
})();
