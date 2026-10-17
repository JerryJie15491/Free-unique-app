// 阶段3：健身 / 饮食 / 娱乐；阶段4：学习目标
const { makeApp, close, fireChange, todayKey, t, ok, eq } = require('./helper');

const dom = makeApp();
const d = dom.window.document;
const app = () => dom.window.__app;

// 预置心情+天气，让推荐出现
d.querySelector('[data-action="quick-mood"][data-level="4"]').click();
d.querySelector('[data-action="set-weather"][data-w="sunny"]').click();

console.log('== 阶段3: 健身计划 ==');
d.querySelector('[data-page="fitness"]').click();
t('显示晴天好心情的户外推荐与理由', () => {
  const txt = d.querySelector('#page-fitness .rec-card').textContent;
  ok(txt.includes('户外') || txt.includes('慢跑'), txt);
  ok(txt.includes('推荐理由'));
});
t('保存运动记录', () => {
  d.querySelector('#f-content').value = '慢跑';
  d.querySelector('#f-minutes').value = '30';
  d.querySelector('[data-action="save-fit"]').click();
  eq(app().DB.fitness[todayKey()].content, '慢跑');
  eq(app().DB.fitness[todayKey()].minutes, '30');
});
t('完成打卡后本周圆点点亮', () => {
  d.querySelector('[data-change="fit-check"]').click();
  eq(app().DB.fitness[todayKey()].checked, true);
  ok(d.querySelector('#page-fitness').textContent.includes('已打卡'));
  const dots = d.querySelectorAll('.dot');
  eq(dots.length, 7);
  ok(dots[6].classList.contains('on'), '今天的圆点应点亮');
});

console.log('== 阶段3: 饮食计划 ==');
d.querySelector('[data-page="diet"]').click();
t('显示三餐建议与理由', () => {
  const txt = d.querySelector('#page-diet .rec-card').textContent;
  ok(txt.includes('早餐') && txt.includes('午餐') && txt.includes('晚餐'));
  ok(txt.includes('推荐理由'));
});
t('记录三餐实际饮食自动保存', () => {
  const b = d.querySelector('[data-meal="breakfast"]');
  b.value = '包子豆浆'; fireChange(b);
  const l = d.querySelector('[data-meal="lunch"]');
  l.value = '牛肉面'; fireChange(l);
  eq(app().DB.diet[todayKey()].breakfast, '包子豆浆');
  eq(app().DB.diet[todayKey()].lunch, '牛肉面');
});

console.log('== 阶段3: 游戏娱乐 ==');
d.querySelector('[data-page="fun"]').click();
t('显示娱乐推荐与理由', () => {
  const txt = d.querySelector('#page-fun .rec-card').textContent;
  ok(txt.includes('推荐') && txt.includes('理由'));
});
t('添加娱乐计划', () => {
  d.querySelector('#fun-content').value = '看电影';
  d.querySelector('#fun-start').value = '20:00';
  d.querySelector('#fun-end').value = '22:00';
  d.querySelector('[data-action="add-fun"]').click();
  const list = app().DB.fun[todayKey()];
  eq(list.length, 1);
  eq(list[0].content, '看电影');
});
t('勾选完成并记录感受', () => {
  d.querySelector('[data-change="fun-toggle"]').click();
  eq(app().DB.fun[todayKey()][0].done, true);
  const feel = d.querySelector('[data-change="fun-feeling"]');
  feel.value = '很放松'; fireChange(feel);
  eq(app().DB.fun[todayKey()][0].feeling, '很放松');
});
t('删除娱乐计划', () => {
  d.querySelector('[data-action="del-fun"]').click();
  eq(app().DB.fun[todayKey()].length, 0);
});

console.log('== 阶段4: 学习目标 ==');
d.querySelector('[data-page="goals"]').click();
t('新建目标', () => {
  d.querySelector('#g-name').value = '学完英语语法';
  d.querySelector('#g-deadline').value = '2026-12-31';
  d.querySelector('[data-action="add-goal"]').click();
  eq(app().DB.goals.length, 1);
  eq(app().DB.goals[0].type, 'learn');
  eq(app().DB.goals[0].progress, 0);
  ok(d.querySelector('#page-goals').textContent.includes('学完英语语法'));
});
t('拖动进度条调整进度', () => {
  const r = d.querySelector('[data-change="goal-progress"]');
  r.value = '40'; fireChange(r);
  eq(app().DB.goals[0].progress, 40);
  ok(d.querySelector('#page-goals').textContent.includes('40%'));
});
t('添加并勾选子目标', () => {
  const gid = app().DB.goals[0].id;
  d.querySelector('#sg-' + gid).value = '完成时态章节';
  d.querySelector('[data-action="add-sub"][data-id="' + gid + '"]').click();
  eq(app().DB.goals[0].subgoals.length, 1);
  d.querySelector('[data-change="sub-toggle"]').click();
  eq(app().DB.goals[0].subgoals[0].done, true);
});
t('删除子目标', () => {
  d.querySelector('[data-action="del-sub"]').click();
  eq(app().DB.goals[0].subgoals.length, 0);
});
t('删除目标（二次确认通过）', () => {
  d.querySelector('[data-action="del-goal"]').click();
  eq(app().DB.goals.length, 0);
});

console.log('== 阶段3+4: 持久化复核 ==');
t('各模块数据互不干扰', () => {
  eq(app().DB.fitness[todayKey()].content, '慢跑');
  eq(app().DB.diet[todayKey()].breakfast, '包子豆浆');
  ok(Array.isArray(app().DB.fun[todayKey()]));
});
close(dom);
console.log('阶段 3+4 测试结束');
