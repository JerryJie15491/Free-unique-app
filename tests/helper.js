// 测试公共工具：用 jsdom 真实加载 App
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', '我的生活.html'), 'utf8');

let failures = 0;
function t(name, fn) {
  try { fn(); console.log('  PASS  ' + name); }
  catch (e) { failures++; console.log('  FAIL  ' + name + '  ->  ' + e.message); }
}
function ok(v, msg) { if (!v) throw new Error(msg || 'expected truthy, got ' + JSON.stringify(v)); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg ? msg + ': ' : '') + 'expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); }
process.on('exit', () => { if (failures) process.exitCode = 1; });

function makeApp(seedJSON) {
  const vc = new VirtualConsole(); // 静默 CSS 解析噪音
  const dom = new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      window.confirm = () => true;
      window.alert = () => {};
      if (seedJSON) window.localStorage.setItem('myLifeData', seedJSON);
    }
  });
  return dom;
}
function close(dom) { dom.window.close(); }
function fireChange(el) {
  el.dispatchEvent(new el.ownerDocument.defaultView.Event('change', { bubbles: true }));
}
function todayKey() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

module.exports = { makeApp, close, fireChange, todayKey, t, ok, eq };
