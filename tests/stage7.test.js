// 阶段7：总验收 — 对照 PRD 第 10 章 A1–A15 中可自动化部分
const fs = require('fs');
const path = require('path');
const { makeApp, close, t, ok, eq } = require('./helper');

const html = fs.readFileSync(path.join(__dirname, '..', '我的生活.html'), 'utf8');

console.log('== A1: 断网可用 — 无外部资源请求 ==');
t('HTML 中无任何 http/https 外部资源引用', () => {
  const refs = html.match(/(?:src|href)\s*=\s*"https?:\/\/[^"]+"/g);
  ok(!refs, '发现外部引用: ' + (refs || []).join(','));
});
t('无 CDN / 字体 / 脚本外链', () => {
  ok(!/cdn\.|googleapis|unpkg|jsdelivr/.test(html));
});

console.log('== A11: 文件绑定能力（不支持的浏览器优雅降级） ==');
const dom = makeApp();
const d = dom.window.document;
const app = () => dom.window.__app;
t('jsdom（无 File System Access API）下隐藏绑定按钮并提示手动备份', () => {
  d.querySelector('[data-page="settings"]').click();
  ok(!d.querySelector('[data-action="bind-file"]'), '不应出现绑定按钮');
  ok(d.querySelector('#bind-status').textContent.includes('导出'));
});
t('支持时绑定按钮出现（模拟 showSaveFilePicker 存在）', () => {
  dom.window.showSaveFilePicker = () => Promise.resolve(null);
  app().showPage('settings');
  ok(d.querySelector('[data-action="bind-file"]'));
});
close(dom);

console.log('== A5/A12/A13: 联动与二次确认复核 ==');
const dom2 = makeApp();
const d2 = dom2.window.document;
// 清空数据需两次确认：第一次确认后数据应仍在（confirm 第一次 true 第二次 false）
d2.querySelector('[data-action="quick-mood"][data-level="3"]').click();
d2.querySelector('[data-action="set-weather"][data-w="snowy"]').click();
const homeTxt = d2.querySelector('#page-home .rec-card').textContent;
t('心情一般+雪天 → 推荐含室内/热乎', () => {
  ok(homeTxt.includes('室内'));
});
let confirmCount = 0;
dom2.window.confirm = () => { confirmCount++; return confirmCount === 1; }; // 第二次拒绝
d2.querySelector('[data-page="settings"]').click();
d2.querySelector('[data-action="clear-all"]').click();
t('第二次确认被拒绝时数据保留', () => {
  ok(Object.keys(dom2.window.__app.DB.moods).length === 1, '数据不应被清空');
});
close(dom2);
console.log('阶段 7 测试结束');
