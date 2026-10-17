// 阶段5：首页总览拼装；阶段6：数据与设置（统计/备份/恢复/清空）
const { makeApp, close, todayKey, t, ok, eq } = require('./helper');
function keyOf(dt) {
  const p = n => String(n).padStart(2, '0');
  return dt.getFullYear() + '-' + p(dt.getMonth() + 1) + '-' + p(dt.getDate());
}

// 构造预置数据：一个覆盖"现在"的任务、一个已完成任务、心情、天气
function seedData() {
  const k = todayKey();
  const now = new Date();
  const p = n => String(n).padStart(2, '0');
  const start = p(now.getHours()) + ':' + p(Math.max(0, now.getMinutes() - 10));
  const endH = (now.getHours() + 1) % 24;
  const end = p(endH) + ':' + p(now.getMinutes());
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yk = keyOf(yesterday);
  return JSON.stringify({
    version: 1,
    tasks: { [k]: [
      { id: 'a1', title: '进行中任务', start, end, done: false, memo: '' },
      { id: 'a2', title: '已完成任务', start: '07:00', end: '07:30', done: true, memo: '' }
    ]},
    goals: [{ id: 'g1', name: '学英语', type: 'learn', deadline: '', progress: 30, subgoals: [] }],
    moods: { [k]: { level: 4, note: '不错' }, [yk]: { level: 3, note: '' } },
    weather: { [k]: 'sunny' },
    fitness: {}, diet: {}, fun: {}, memos: []
  });
}

console.log('== 阶段5: 首页总览 ==');
let dom = makeApp(seedData());
let d = dom.window.document;
const app = () => dom.window.__app;

t('首页显示今日计划摘要与完成数', () => {
  const card = d.querySelector('#page-home');
  ok(card.textContent.includes('进行中任务'));
  ok(card.textContent.includes('1/2'));
});
t('当前时段卡显示进行中的任务与剩余时间', () => {
  const cards = [...d.querySelectorAll('#page-home .card')];
  const slotCard = cards.find(c => c.textContent.includes('现在时段'));
  ok(slotCard.textContent.includes('进行中任务'), slotCard.textContent);
  ok(slotCard.textContent.includes('还剩'));
});
t('AI 推荐摘要显示健身/饮食/娱乐三行', () => {
  const rec = d.querySelector('#page-home .rec-card').textContent;
  ok(rec.includes('💪') && rec.includes('🍚') && rec.includes('🎮'));
});
t('心情与天气选择状态回显', () => {
  ok(d.querySelector('[data-action="quick-mood"][data-level="4"]').classList.contains('sel'));
  ok(d.querySelector('[data-action="set-weather"][data-w="sunny"]').classList.contains('sel'));
});
t('快速备忘输入即存', () => {
  d.querySelector('#memo-input').value = '记得买牛奶';
  d.querySelector('[data-action="add-memo"]').click();
  eq(app().DB.memos.length, 1);
  ok(d.querySelector('#page-home').textContent.includes('记得买牛奶'));
});
t('删除备忘', () => {
  d.querySelector('[data-action="del-memo"]').click();
  eq(app().DB.memos.length, 0);
});
close(dom);

console.log('== 阶段6: 数据统计 ==');
dom = makeApp(seedData()); d = dom.window.document;
d.querySelector('[data-page="settings"]').click();

t('完成率统计正确（1/2 = 50%）', () => {
  ok(d.querySelector('#page-settings').textContent.includes('50%'));
  eq(app().completionRate().pct, 50);
});
t('连续打卡天数正确（昨天+今天=2）', () => eq(app().calcStreak(), 2));
t('心情柱状图 14 根', () => eq(d.querySelectorAll('.chart .bar').length, 14));
t('昨天的柱子有真实高度，缺失日为灰色', () => {
  const bars = [...d.querySelectorAll('.chart .bar .b')];
  eq(bars[13].style.height, '64px'); // 今天 level4: 4/5*80
  eq(bars[12].style.height, '48px'); // 昨天 level3
  eq(bars[0].style.height, '3px');   // 13 天前无记录
});

console.log('== 阶段6: 备份与恢复 ==');
let exported;
t('导出 JSON 包含全部数据', () => {
  exported = app().exportJSON();
  const parsed = JSON.parse(exported);
  eq(parsed.version, 1);
  eq(parsed.tasks[todayKey()].length, 2);
  eq(parsed.goals[0].name, '学英语');
});
t('清空全部数据（双确认后生效）', () => {
  d.querySelector('[data-action="clear-all"]').click();
  eq(Object.keys(app().DB.tasks).length, 0);
  eq(app().DB.goals.length, 0);
  eq(app().calcStreak(), 0);
});
t('从备份恢复后数据完整还原', () => {
  ok(app().importData(exported));
  eq(app().DB.tasks[todayKey()].length, 2);
  eq(app().DB.goals[0].name, '学英语');
  eq(app().calcStreak(), 2);
  eq(app().completionRate().pct, 50);
});
t('导入无效文件被拒绝且不破坏现有数据', () => {
  ok(!app().importData('{"hello":"world"}'));
  ok(!app().importData('not json at all'));
  eq(app().DB.tasks[todayKey()].length, 2, '数据不应被破坏');
});
t('恢复后页面渲染同步刷新', () => {
  ok(d.querySelector('#page-settings').textContent.includes('50%'));
});
close(dom);

console.log('== 阶段6: 模拟浏览器重启后数据仍在 ==');
dom = makeApp(exported); d = dom.window.document;
t('重开后任务/心情/目标完整', () => {
  eq(app().DB.tasks[todayKey()].length, 2);
  eq(app().DB.moods[todayKey()].level, 4);
  eq(app().DB.goals.length, 1);
  ok(d.querySelector('#page-home').textContent.includes('进行中任务'));
});
close(dom);
console.log('阶段 5+6 测试结束');
