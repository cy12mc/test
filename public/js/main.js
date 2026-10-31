/**
 * main.js
 * 功能：
 *  1. 在首页根据 labels 颜色映射渲染彩色标签
 *  2. 在文章页自动更新 article-count
 *  3. 加载 GitHub 原生的 <relative-time> 组件（如需实时刷新）
 */

(function () {
  // ── 标签颜色映射 ───────────────────────────────────────
  const labelColors = {
    // 默认按名称哈希着色，以下为预设高优先级
    'bug':       { bg: '#ffcece', fg: '#cf222e', border: '#ffcece' },
    'feature':   { bg: '#ddf4ff', fg: '#0550ae', border: '#aedfff' },
    'question':  { bg: '#fff8c5', fg: '#9a6700', border: '#ffd42a' },
    'tutorial':  { bg: '#dafbe1', fg: '#1a7f37', border: '#56d364' },
    'release':   { bg: '#f5dffc', fg: '#8250df', border: '#dbafff' },
    'daily':     { bg: '#ffdfb2', fg: '#9a4900', border: '#ffdfb2' },
    '思考':      { bg: '#f5dffc', fg: '#8250df', border: '#dbafff' },
    '教程':      { bg: '#dafbe1', fg: '#1a7f37', border: '#56d364' },
    '分享':      { bg: '#ddf4ff', fg: '#0550ae', border: '#aedfff' },
  };

  function getLabelStyle(name) {
    const key = name.toLowerCase();
    return labelColors[key] || hashColor(name);
  }

  // 根据字符串哈希生成柔和色
  function hashColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    const s = 60 + (Math.abs(hash >> 8) % 20);
    const l = 85 + (Math.abs(hash >> 16) % 10);
    return {
      bg: `hsl(${h}, ${s}%, ${l}%)`,
      fg: `hsl(${h}, ${s}%, ${Math.max(l - 35, 25)}%)`,
      border: `hsl(${h}, ${s}%, ${l}%)`,
    };
  }

  // ── 为所有 label span 注入颜色 ────────────────────────
  document.querySelectorAll('.label').forEach(function (el) {
    const name = el.textContent.trim();
    if (!name) return;
    const c = getLabelStyle(name);
    el.style.background = c.bg;
    el.style.color = c.fg;
    el.style.borderColor = c.border;
    el.classList.add('label-' + name); // 备用 class
  });

  // ── 首页：更新文章计数 ────────────────────────────────
  const countEl = document.getElementById('article-count');
  const tabEl = document.getElementById('tab-counter');
  if (countEl) {
    // 从页面内 article-card 数量计算，避免重复请求
    const cards = document.querySelectorAll('.article-card').length;
    countEl.textContent = cards;
    if (tabEl) tabEl.textContent = cards;
  }

  // ── 加载 GitHub relative-time 组件（可选）────────────
  // 如果页面中有 <relative-time> 标签，加载原生组件使其显示 "3小时前" 等格式
  if (document.querySelector('relative-time')) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/github-time/3.3.0/relative-time.min.js';
    script.async = true;
    document.head.appendChild(script);
  }
})();
