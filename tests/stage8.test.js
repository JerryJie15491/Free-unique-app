// 阶段8（新增需求）：滚轮选择器 / 心情动画 / 手动保存按钮
const { makeApp, close, t, ok, eq } = require('./helper');

console.log('== 滚轮选择器（Apple 闹钟式） ==');
let dom = makeApp();
let d = dom.window.document;
const app = () => dom.window.__app;

// 打开今日计划弹窗（时间滚轮按钮在弹窗内）
d.querySelector('[data-page="tasks"]').click();
d.querySelector('#page-tasks .cal .day.today').click();

t('点击时间按钮弹出滚轮，含 24 小时 + 60 分钟两列', () => {
  d.querySelector('[data-key="m-start"]').click();
  const ov = d.querySelector('#wheel-ov');
  ok(ov, '滚轮弹层未出现');
  const cols = ov.querySelectorAll('.wheel-col');
  eq(cols.length, 2);
  eq(cols[0].querySelectorAll('.wheel-item').length, 24);
  eq(cols[1].querySelectorAll('.wheel-item').length, 60);
});
t('滚动选中后点确定，时间写回按钮', () => {
  const cols = d.querySelectorAll('#wheel-ov .wheel-col');
  cols[0].scrollTop = 14 * 36; // 14 时
  cols[1].scrollTop = 30 * 36; // 30 分
  d.querySelector('#wh-ok').click();
  eq(d.querySelector('[data-key="m-start"]').dataset.value, '14:30');
  ok(!d.querySelector('#wheel-ov'), '确定后弹层应关闭');
});
t('取消不修改值', () => {
  d.querySelector('[data-key="m-start"]').click();
  d.querySelectorAll('#wheel-ov .wheel-col')[0].scrollTop = 5 * 36;
  d.querySelector('#wh-cancel').click();
  eq(d.querySelector('[data-key="m-start"]').dataset.value, '14:30');
});
t('结束时间空值时自动从开始时间起滑（联动）', () => {
  const endBtn = d.querySelector('[data-key="m-end"]');
  eq(endBtn.dataset.value, '', '前置：结束时间为空');
  eq(endBtn.dataset.linkFrom, 'm-start');
  endBtn.click();
  const cols = d.querySelectorAll('#wheel-ov .wheel-col');
  // 初始选中应停在开始时间 14:30 的位置
  eq(cols[0].querySelector('.wheel-item.cur').textContent, '14');
  eq(cols[1].querySelector('.wheel-item.cur').textContent, '30');
  d.querySelector('#wh-cancel').click();
});
d.querySelector('[data-action="close-modal"]').click();

t('时长滚轮：值域从 0 开始，不存在负数', () => {
  d.querySelector('[data-page="fitness"]').click();
  d.querySelector('[data-key="fit-dur"]').click();
  const ov = d.querySelector('#wheel-ov');
  ok(ov);
  const items = [...ov.querySelectorAll('.wheel-item')].map(x=>x.textContent);
  ok(items.every(x=> !x.includes('-')), '出现负数选项');
  ok(items[0].startsWith('0'), '最小值应为 0');
  d.querySelector('#wh-cancel').click();
});
t('时长滚轮选择 1 小时 20 分 = 80 分钟', () => {
  d.querySelector('[data-key="fit-dur"]').click();
  const cols = d.querySelectorAll('#wheel-ov .wheel-col');
  cols[0].scrollTop = 1 * 36; // 1 小时
  cols[1].scrollTop = 2 * 36; // 20 分
  d.querySelector('#wh-ok').click();
  eq(d.querySelector('[data-key="fit-dur"]').dataset.value, '80');
  ok(d.querySelector('[data-key="fit-dur"]').textContent.includes('1 小时 20 分'));
});
t('健身目标时长滚轮修改直接保存', () => {
  d.querySelector('[data-key="fit-goal"]').click();
  const cols = d.querySelectorAll('#wheel-ov .wheel-col');
  cols[0].scrollTop = 2 * 36; // 2 小时
  cols[1].scrollTop = 0;
  d.querySelector('#wh-ok').click();
  eq(app().fitDay(app().todayKey()).goalMin, 120);
});
close(dom);

console.log('== 心情动画 ==');
dom = makeApp(); d = dom.window.document;
t('点击心情触发弹跳动画 class（动画落在渲染后的新按钮上）', () => {
  d.querySelector('[data-action="quick-mood"][data-level="5"]').click();
  ok(d.querySelector('[data-action="quick-mood"][data-level="5"]').classList.contains('pop'), '缺少 pop 动画 class');
});
t('点击心情产生粒子元素', () => {
  ok(d.querySelectorAll('.particle').length > 0, '没有粒子');
});
t('动画后数据仍正确保存', () => {
  eq(dom.window.__app.DB.moods[dom.window.__app.todayKey()].level, 5);
});
close(dom);

console.log('== 滚轮选中条不遮挡文字 ==');
t('选中条为细线样式且层级低于文字列', () => {
  const fs = require('fs');
  const html = fs.readFileSync(require('path').join(__dirname, '..', '我的生活.html'), 'utf8');
  ok(html.includes('border-top:1.5px solid var(--brand)'), '缺少上边框线');
  ok(html.includes('border-bottom:1.5px solid var(--brand)'), '缺少下边框线');
  const m = html.match(/\.wheel-col \{[^}]*z-index:1/);
  ok(m, '滚轮列应置于选中条上层');
});

console.log('== 手动保存按钮 ==');
dom = makeApp(); d = dom.window.document;
t('点击保存按钮出现"已保存"提示', () => {
  d.querySelector('#global-save').click();
  const tip = d.querySelector('#save-tip');
  ok(tip.textContent.includes('已保存'), tip.textContent);
  ok(tip.classList.contains('show'));
});
t('保存按钮写入 localStorage', () => {
  d.querySelector('[data-action="quick-mood"][data-level="4"]').click();
  d.querySelector('#global-save').click();
  ok(dom.window.localStorage.getItem('myLifeData').includes('"level":4'));
});
close(dom);
console.log('阶段 8 测试结束');
