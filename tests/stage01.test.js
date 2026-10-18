// 阶段 0+1：骨架 / 导航 / 今日计划（日历+弹窗） / 时间段
const { makeApp, close, t, ok, eq } = require('./helper');

// 滚轮时间按钮在测试中直接设定值（真实浏览器中由滚轮选择器写入 dataset.value）
function setTimeBtn(d, key, val) {
  const btn = d.querySelector('[data-key="' + key + '"]');
  btn.dataset.value = val;
  btn.textContent = val || '开始时间';
  if (val) btn.classList.remove('empty');
}

console.log('== 阶段0: 骨架与导航 ==');
let dom = makeApp();
let d = dom.window.document;

t('导航包含 9 个模块', () => eq(d.querySelectorAll('.nav-item').length, 9));
t('导航顺序：时间段在学习目标之前', () => {
  const pages = [...d.querySelectorAll('.nav-item')].map(n => n.dataset.page);
  ok(pages.indexOf('timeline') < pages.indexOf('goals'), '顺序: ' + pages.join(','));
  ok(pages.indexOf('timeline') > pages.indexOf('tasks'), '时间段应在今日计划之后');
});
t('默认显示首页', () => ok(d.querySelector('#page-home').classList.contains('active')));
t('9 个页面都能切换显示', () => {
  ['home','tasks','timeline','goals','fitness','diet','fun','mood','settings'].forEach(p=>{
    d.querySelector('[data-page="'+p+'"]').click();
    ok(d.querySelector('#page-'+p).classList.contains('active'), p+' 未激活');
  });
});
t('全局手动保存按钮存在', () => ok(d.querySelector('#global-save')));
close(dom);

console.log('== 阶段1: 今日计划（日历 + 弹窗） ==');
dom = makeApp(); d = dom.window.document;
const app = () => dom.window.__app;
d.querySelector('[data-page="tasks"]').click();

t('今日计划页为日历形式', () => {
  ok(d.querySelector('#page-tasks .cal'), '缺少日历');
  ok(d.querySelector('#page-tasks .cal .day.today'), '缺少今天格子');
});

t('点击今天弹出计划弹窗', () => {
  d.querySelector('#page-tasks .cal .day.today').click();
  ok(d.querySelector('#modal-ov'), '弹窗未出现');
  ok(d.querySelector('#modal-ov').textContent.includes('计划安排'));
  ok(d.querySelector('[data-action="m-add-task"]'), '弹窗缺少添加按钮');
});

t('弹窗中添加任务（标题+滚轮时间+能量）', () => {
  d.querySelector('#m-title').value = '学习英语';
  setTimeBtn(d, 'm-start', '09:00');
  setTimeBtn(d, 'm-end', '09:30');
  d.querySelector('[data-action="m-energy"][data-e="mid"]').click();
  d.querySelector('[data-action="m-add-task"]').click();
  const tasks = app().DB.tasks[app().todayKey()];
  eq(tasks.length, 1);
  eq(tasks[0].title, '学习英语');
  eq(tasks[0].start, '09:00');
  eq(tasks[0].energy, 'mid');
  ok(d.querySelector('#modal-ov').textContent.includes('学习英语'), '弹窗列表应显示新任务');
});

t('弹窗中勾选完成', () => {
  d.querySelector('#modal-ov [data-change="toggle-task"]').click();
  eq(app().DB.tasks[app().todayKey()][0].done, true);
  ok(d.querySelector('#modal-ov .task-item.done'), '弹窗中应显示完成划线');
});

t('localStorage 已持久化', () => {
  ok(dom.window.localStorage.getItem('myLifeData').includes('学习英语'));
});

t('编辑任务弹出编辑窗口（预填内容）', () => {
  d.querySelector('#modal-ov [data-action="m-edit-task"]').click();
  ok(d.querySelector('#modal-ov').textContent.includes('编辑任务'));
  eq(d.querySelector('#me-title').value, '学习英语');
  eq(d.querySelector('[data-key="me-start"]').dataset.value, '09:00');
  d.querySelector('#me-title').value = '学习英语语法';
  d.querySelector('[data-action="m-save-edit"]').click();
  eq(app().DB.tasks[app().todayKey()][0].title, '学习英语语法');
  eq(app().DB.tasks[app().todayKey()].length, 1, '编辑不应新增');
  ok(d.querySelector('#modal-ov').textContent.includes('学习英语语法'), '应返回当天弹窗');
});

t('删除任务（二次确认通过）', () => {
  d.querySelector('#modal-ov [data-action="del-task"]').click();
  eq(app().DB.tasks[app().todayKey()].length, 0);
});

t('关闭弹窗', () => {
  d.querySelector('[data-action="close-modal"]').click();
  ok(!d.querySelector('#modal-ov'));
});
const seed = dom.window.localStorage.getItem('myLifeData');
close(dom);

console.log('== 阶段1: 刷新持久化（模拟重启） ==');
dom = makeApp(seed); d = dom.window.document;
t('重新加载后数据结构完好', () => ok(app().DB && typeof app().DB.tasks === 'object'));
close(dom);

console.log('== 阶段1: 时间段时间轴 ==');
dom = makeApp(); d = dom.window.document;
d.querySelector('[data-page="tasks"]').click();
d.querySelector('#page-tasks .cal .day.today').click();
d.querySelector('#m-title').value = '晨跑';
setTimeBtn(d, 'm-start', '08:00');
setTimeBtn(d, 'm-end', '08:45');
d.querySelector('[data-action="m-add-task"]').click();
d.querySelector('[data-action="close-modal"]').click();
d.querySelector('[data-page="timeline"]').click();

t('时间轴有 24 个小时格', () => eq(d.querySelectorAll('.tl-hour').length, 24));
t('任务色块出现在 08:00 对应位置', () => {
  const b = d.querySelector('.tl-block');
  ok(b, '没有色块');
  ok(b.textContent.includes('晨跑'));
  eq(b.style.top, (480/60*48)+'px');
});
t('"现在"指示线存在且位置合理', () => {
  const now = d.querySelector('.tl-now');
  ok(now);
  const nowMin = new Date().getHours()*60 + new Date().getMinutes();
  eq(now.style.top, (nowMin/60*48)+'px');
});
t('点击色块标记完成', () => {
  d.querySelector('.tl-block').click();
  eq(app().DB.tasks[app().todayKey()][0].done, true);
  ok(d.querySelector('.tl-block.done'));
});
t('点击空白时段打开弹窗并预填时间', () => {
  d.querySelectorAll('.tl-hour')[14].click();
  ok(d.querySelector('#page-tasks').classList.contains('active'));
  ok(d.querySelector('#modal-ov'), '应弹出计划弹窗');
  eq(d.querySelector('[data-key="m-start"]').dataset.value, '14:00');
  eq(d.querySelector('[data-key="m-end"]').dataset.value, '15:00');
  d.querySelector('[data-action="close-modal"]').click();
});
t('无时间任务归入全天区', () => {
  d.querySelector('[data-page="tasks"]').click();
  d.querySelector('#page-tasks .cal .day.today').click();
  d.querySelector('#m-title').value = '全天备忘任务';
  d.querySelector('[data-action="m-add-task"]').click();
  d.querySelector('[data-action="close-modal"]').click();
  d.querySelector('[data-page="timeline"]').click();
  ok(d.querySelector('.tl-allday') && d.querySelector('.tl-allday').textContent.includes('全天备忘任务'));
});
close(dom);

console.log('阶段 0+1 测试结束');
