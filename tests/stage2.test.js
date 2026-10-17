// 阶段2：清晨心情 / 天气 / AI 推荐引擎联动
const { makeApp, close, todayKey, t, ok, eq } = require('./helper');

console.log('== 阶段2: 推荐引擎单元测试（心情5档 × 天气4种 = 20 组合） ==');
const dom = makeApp();
const d = dom.window.document;
const app = () => dom.window.__app;

t('20 种组合全部返回完整推荐', () => {
  for (let mood = 1; mood <= 5; mood++) {
    for (const w of ['sunny','cloudy','rainy','snowy']) {
      const r = app().recommend(mood, w);
      ok(r && r.fitness.text && r.fitness.reason, `fitness 缺失 mood=${mood} w=${w}`);
      ok(r.diet.meals.b && r.diet.meals.l && r.diet.meals.d && r.diet.reason, `diet 缺失 mood=${mood} w=${w}`);
      ok(r.fun.text && r.fun.reason, `fun 缺失 mood=${mood} w=${w}`);
    }
  }
});
t('雨天推荐室内运动', () => {
  const r = app().recommend(4, 'rainy');
  ok(r.fitness.text.includes('室内'), '雨天应为室内: ' + r.fitness.text);
  ok(r.fitness.reason.includes('雨天'));
});
t('雪天推荐室内运动且饮食提示热乎', () => {
  const r = app().recommend(5, 'snowy');
  ok(r.fitness.text.includes('室内'));
  ok(r.diet.reason.includes('热乎'));
});
t('心情低落时推荐舒缓运动与暖胃饮食', () => {
  const r = app().recommend(2, 'cloudy');
  ok(r.fitness.text.includes('散步') || r.fitness.text.includes('舒缓'));
  ok(r.diet.reason.includes('暖胃') || r.diet.meals.b.includes('热'));
});
t('缺少心情或天气时返回 null（提示先打卡）', () => {
  eq(app().recommend(null, 'sunny'), null);
  eq(app().recommend(3, null), null);
});

console.log('== 阶段2: 心情打卡 ==');
t('首页快捷打卡心情', () => {
  d.querySelector('[data-action="quick-mood"][data-level="2"]').click();
  eq(app().DB.moods[todayKey()].level, 2);
});
t('心情页显示今日已打卡状态', () => {
  d.querySelector('[data-page="mood"]').click();
  ok(d.querySelector('#page-mood').textContent.includes('低落'));
});
t('保存一句话日记', () => {
  d.querySelector('#mood-note').value = '昨晚没睡好';
  d.querySelector('[data-action="save-mood-note"]').click();
  eq(app().DB.moods[todayKey()].note, '昨晚没睡好');
  eq(app().DB.moods[todayKey()].level, 2, '写日记不应覆盖心情');
});
t('心情日历今天格子有对应颜色', () => {
  const cell = d.querySelector('.cal .day.today');
  ok(cell.style.background.includes('rgb(247, 169, 76)') || cell.style.background.includes('#f7a94c'), '颜色: ' + cell.style.background);
});
t('点击日历历史日期显示回看信息', () => {
  d.querySelector('.cal .day.today').click();
  ok(d.querySelector('#mood-view').textContent.includes('昨晚没睡好'));
});

console.log('== 阶段2: 天气选择 + 推荐联动 ==');
t('首页选择雨天', () => {
  d.querySelector('[data-page="home"]').click();
  d.querySelector('[data-action="set-weather"][data-w="rainy"]').click();
  eq(app().DB.weather[todayKey()], 'rainy');
});
t('首页 AI 推荐卡片随心情+天气刷新（室内运动）', () => {
  const txt = d.querySelector('#page-home .rec-card').textContent;
  ok(txt.includes('室内'), '首页推荐未联动: ' + txt);
});
t('切换心情后推荐立即变化', () => {
  d.querySelector('[data-action="quick-mood"][data-level="5"]').click();
  const before = d.querySelector('#page-home .rec-card').textContent;
  d.querySelector('[data-action="quick-mood"][data-level="1"]').click();
  const after = d.querySelector('#page-home .rec-card').textContent;
  ok(before !== after, '推荐文案未变化');
  ok(after.includes('拉伸') || after.includes('休息'));
});
t('未打卡时推荐区显示引导文案', () => {
  const dom2 = makeApp();
  const txt = dom2.window.document.querySelector('#page-home .rec-card').textContent;
  ok(txt.includes('打卡心情'));
  dom2.window.close();
});
close(dom);
console.log('阶段 2 测试结束');
