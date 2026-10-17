// 阶段3：健身（打卡+日历）/ 饮食（三餐+日历）/ 娱乐（游戏卡片）；阶段4：学习目标
const { makeApp, close, fireChange, todayKey, t, ok, eq } = require('./helper');

function setBtn(d, key, val) {
  const btn = d.querySelector('[data-key="' + key + '"]');
  btn.dataset.value = val;
  btn.textContent = String(val);
  btn.classList.remove('empty');
}

const dom = makeApp();
const d = dom.window.document;
const app = () => dom.window.__app;

// 预置心情+天气
d.querySelector('[data-action="quick-mood"][data-level="4"]').click();
d.querySelector('[data-action="set-weather"][data-w="sunny"]').click();

console.log('== 阶段3: 健身计划（打卡制） ==');
d.querySelector('[data-page="fitness"]').click();

t('显示晴天好心情的户外推荐与理由', () => {
  const txt = d.querySelector('#page-fitness .rec-card').textContent;
  ok(txt.includes('户外') || txt.includes('慢跑'), txt);
  ok(txt.includes('推荐理由'));
});
t('默认每日目标 60 分钟', () => {
  eq(app().fitDay(todayKey()).goalMin, 60);
  ok(d.querySelector('#page-fitness').textContent.includes('1 小时'));
});
t('8 个运动标签可点选', () => {
  eq(d.querySelectorAll('.tag-chip').length, 8);
  d.querySelector('[data-action="fit-tag"][data-tag="力量"]').click();
  ok(d.querySelector('[data-action="fit-tag"][data-tag="力量"]').classList.contains('sel'));
});
t('打卡：标签+部位+动作+次数+时长', () => {
  d.querySelector('#f-part').value = '胸';
  d.querySelector('#f-detail').value = '俯卧撑';
  d.querySelector('#f-reps').value = '3组×12次';
  setBtn(d, 'fit-dur', '20');
  d.querySelector('[data-action="add-fit-entry"]').click();
  const f = app().fitDay(todayKey());
  eq(f.entries.length, 1);
  eq(f.entries[0].tag, '力量');
  eq(f.entries[0].part, '胸');
  eq(f.entries[0].detail, '俯卧撑');
  eq(f.entries[0].reps, '3组×12次');
  eq(f.entries[0].minutes, 20);
});
t('再打卡一条，累计时长更新', () => {
  d.querySelector('[data-action="fit-tag"][data-tag="跑步"]').click();
  d.querySelector('#f-detail').value = '';
  d.querySelector('#f-reps').value = '';
  setBtn(d, 'fit-dur', '45');
  d.querySelector('[data-action="add-fit-entry"]').click();
  eq(app().fitTotal(todayKey()), 65);
  ok(d.querySelector('#page-fitness').textContent.includes('65'));
});
t('超过目标后显示"已达成"', () => {
  ok(d.querySelector('#page-fitness').textContent.includes('已达成'));
});
t('时长不可能为负（数据层钳制）', () => {
  app().fitDay(todayKey()).entries.push({id:'neg', tag:'跑步', part:'有氧', detail:'', reps:'', minutes:-10});
  ok(app().fitTotal(todayKey()) >= 65, '负数不应计入总时长');
  app().fitDay(todayKey()).entries = app().fitDay(todayKey()).entries.filter(x=>x.id!=='neg');
});
t('删除一条打卡记录（删除跑步那条，保留俯卧撑）', () => {
  const before = app().fitDay(todayKey()).entries.length;
  d.querySelector('[data-page="fitness"]').click(); // 重渲染
  d.querySelectorAll('#page-fitness [data-action="del-fit-entry"]')[1].click();
  eq(app().fitDay(todayKey()).entries.length, before - 1);
  eq(app().fitDay(todayKey()).entries[0].detail, '俯卧撑');
});
t('运动日历今天格子显示总分钟数', () => {
  const cell = d.querySelector('#page-fitness .cal .day.today');
  ok(cell.querySelector('.sub'), '日历格子无分钟标记');
  ok(cell.textContent.includes("20"), '应为剩余 20 分钟: ' + cell.textContent);
});
t('点击日历日期显示当天明细（部位/动作/次数）', () => {
  d.querySelector('#page-fitness .cal .day.today').click();
  const box = d.querySelector('#fit-day-detail');
  ok(box.style.display !== 'none');
  ok(box.textContent.includes('俯卧撑'));
  ok(box.textContent.includes('胸'));
  ok(box.textContent.includes('3组×12次'));
});

console.log('== 阶段3: 饮食计划（三餐 + 日历） ==');
d.querySelector('[data-page="diet"]').click();
t('显示三餐建议与理由', () => {
  const txt = d.querySelector('#page-diet .rec-card').textContent;
  ok(txt.includes('早餐') && txt.includes('午餐') && txt.includes('晚餐'));
});
t('记录三餐实际饮食自动保存', () => {
  const b = d.querySelector('[data-meal="breakfast"]');
  b.value = '包子豆浆'; fireChange(b);
  eq(app().DB.diet[todayKey()].breakfast, '包子豆浆');
});
t('饮食日历今天有标记，点击查看明细', () => {
  d.querySelector('[data-page="diet"]').click();
  const cell = d.querySelector('#page-diet .cal .day.today');
  ok(cell.querySelector('.sub'), '日历格子应有饮食标记');
  cell.click();
  const box = d.querySelector('#diet-day-detail');
  ok(box.textContent.includes('包子豆浆'));
});

console.log('== 阶段3: 游戏娱乐（游戏卡片） ==');
d.querySelector('[data-page="fun"]').click();
t('显示娱乐推荐与理由', () => {
  ok(d.querySelector('#page-fun .rec-card').textContent.includes('推荐理由'));
});
t('保存游戏卡片（名称+时长+安排时间）', () => {
  d.querySelector('#fun-name').value = '塞尔达传说';
  setBtn(d, 'fun-dur', '90');
  setBtn(d, 'fun-start', '20:00');
  setBtn(d, 'fun-end', '21:30');
  d.querySelector('[data-action="add-fun"]').click();
  const list = app().funDay(todayKey());
  eq(list.length, 1);
  eq(list[0].name, '塞尔达传说');
  eq(list[0].minutes, 90);
  eq(list[0].start, '20:00');
  eq(list[0].end, '21:30');
});
t('卡片渲染包含名称/时长/安排时间', () => {
  const card = d.querySelector('.game-card');
  ok(card, '没有游戏卡片');
  ok(card.textContent.includes('塞尔达传说'));
  ok(card.textContent.includes('1 小时 30 分'));
  ok(card.textContent.includes('20:00'));
});
t('勾选"已玩"与删除卡片', () => {
  d.querySelector('[data-change="fun-toggle"]').click();
  eq(app().funDay(todayKey())[0].done, true);
  ok(d.querySelector('.game-card.done'));
  d.querySelector('[data-action="del-fun"]').click();
  eq(app().funDay(todayKey()).length, 0);
});

console.log('== 阶段4: 学习目标 ==');
d.querySelector('[data-page="goals"]').click();
t('新建目标', () => {
  d.querySelector('#g-name').value = '学完英语语法';
  d.querySelector('#g-deadline').value = '2026-12-31';
  d.querySelector('[data-action="add-goal"]').click();
  eq(app().DB.goals.length, 1);
  eq(app().DB.goals[0].type, 'learn');
});
t('拖动进度条调整进度', () => {
  const r = d.querySelector('[data-change="goal-progress"]');
  r.value = '40'; fireChange(r);
  eq(app().DB.goals[0].progress, 40);
});
t('添加并勾选子目标', () => {
  const gid = app().DB.goals[0].id;
  d.querySelector('#sg-' + gid).value = '完成时态章节';
  d.querySelector('[data-action="add-sub"][data-id="' + gid + '"]').click();
  eq(app().DB.goals[0].subgoals.length, 1);
  d.querySelector('[data-change="sub-toggle"]').click();
  eq(app().DB.goals[0].subgoals[0].done, true);
});
t('删除目标（二次确认通过）', () => {
  d.querySelector('[data-action="del-goal"]').click();
  eq(app().DB.goals.length, 0);
});

console.log('== 阶段3+4: 持久化复核 ==');
t('各模块数据互不干扰', () => {
  ok(app().fitDay(todayKey()).entries.length >= 1);
  eq(app().DB.diet[todayKey()].breakfast, '包子豆浆');
  ok(Array.isArray(app().DB.fun[todayKey()]));
});
close(dom);
console.log('阶段 3+4 测试结束');
