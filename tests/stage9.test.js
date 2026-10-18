/* 阶段9：第五轮新功能测试（能量警告 / 复制昨天 / 子目标进度条 / 卡路里估算 / 游戏大卡样式） */
const { makeApp, close, fireChange, t, ok, eq, todayKey } = require('./helper.js');

/* ---------- 1. 能量警告 ---------- */
{
  const dom = makeApp();
  const d = dom.window.document;
  const app = () => dom.window.__app;
  const k = todayKey();

  console.log('== 阶段9: 任务能量与警告 ==');
  app().DB.tasks[k] = [
    { id: 'h1', title: '高强度1', start: '08:00', end: '09:00', done: false, energy: 'high' },
    { id: 'h2', title: '高强度2', start: '09:00', end: '10:00', done: false, energy: 'high' },
  ];
  app().openDayModal(k);
  t('2 项高能量任务时不显示警告', () => {
    ok(!d.querySelector('#modal-ov .energy-warn'), '2 项不应警告');
  });
  app().DB.tasks[k].push({ id: 'h3', title: '高强度3', start: '10:00', end: '11:00', done: false, energy: 'high' });
  app().openDayModal(k);
  t('3 项高能量任务时显示警告并提示删减', () => {
    const w = d.querySelector('#modal-ov .energy-warn');
    ok(w, '应出现警告条');
    ok(w.textContent.includes('3') && w.textContent.includes('删减'), '文案含数量与删减建议');
  });
  t('完成其中 1 项后警告消失', () => {
    app().DB.tasks[k][0].done = true;
    app().openDayModal(k);
    ok(!d.querySelector('#modal-ov .energy-warn'), '只剩 2 项未完成高能量，不应警告');
  });
  t('任务能量在弹窗列表中以圆点展示', () => {
    ok(d.querySelectorAll('#modal-ov .task-item .e-dot').length >= 3, '每条任务应有能量圆点');
  });
  t('旧数据无 energy 字段按中能量渲染（自动迁移）', () => {
    app().DB.tasks[k].push({ id: 'old1', title: '旧任务', start: '', end: '', done: false });
    app().openDayModal(k);
    const dots = [...d.querySelectorAll('#modal-ov .task-item')];
    const oldItem = dots.find(x => x.textContent.includes('旧任务'));
    ok(oldItem && oldItem.querySelector('.e-dot').title.includes('中'), '旧任务应按中能量显示圆点');
  });
  close(dom);
}

/* ---------- 2. 一键复制昨天的计划 ---------- */
{
  const dom = makeApp();
  const d = dom.window.document;
  const app = () => dom.window.__app;
  const k = todayKey();
  const yd = new Date(); yd.setDate(yd.getDate() - 1);
  const yk = app().keyOf(yd);

  console.log('== 阶段9: 复制昨天的计划 ==');
  app().DB.tasks[yk] = [
    { id: 'y1', title: '昨天任务A', start: '08:00', end: '09:00', done: true, energy: 'high', memo: '备注A' },
    { id: 'y2', title: '昨天任务B', start: '14:00', end: '15:00', done: true, energy: 'low' },
  ];
  app().DB.tasks[k] = [];
  app().openDayModal(k);
  d.querySelector('#modal-ov [data-action="copy-yesterday"]').click();
  t('复制后今天有 2 条任务', () => {
    eq(app().DB.tasks[k].length, 2);
  });
  t('复制的任务为新 id 且未完成、保留时间/能量/备注', () => {
    const list = app().DB.tasks[k];
    ok(list.every(x => x.id !== 'y1' && x.id !== 'y2'), 'id 必须是新生成的');
    ok(list.every(x => x.done === false), '复制出来的任务应是未完成状态');
    eq(list[0].title, '昨天任务A');
    eq(list[0].start, '08:00');
    eq(list[0].energy, 'high');
    eq(list[0].memo, '备注A');
    eq(list[1].energy, 'low');
  });
  t('复制后弹窗列表即时刷新显示', () => {
    ok(d.querySelector('#modal-ov').textContent.includes('昨天任务A'), '弹窗应显示复制来的任务');
  });
  t('昨天无计划时复制不产生任何任务', () => {
    const dom2 = makeApp();
    const app2 = () => dom2.window.__app;
    const k2 = todayKey();
    app2().openDayModal(k2);
    dom2.window.document.querySelector('#modal-ov [data-action="copy-yesterday"]').click();
    eq((app2().DB.tasks[k2] || []).length, 0);
    close(dom2);
  });
  close(dom);
}

/* ---------- 3. 子目标进度条 ---------- */
{
  const dom = makeApp();
  const d = dom.window.document;
  const app = () => dom.window.__app;

  console.log('== 阶段9: 子目标进度条 ==');
  app().DB.goals.push({ id: 'g1', title: '目标A', progress: 0, subgoals: [{ id: 's1', text: '子目标1', done: false, progress: 0 }] });
  app().showPage('goals');
  t('子目标渲染带进度条', () => {
    ok(d.querySelector('#page-goals [data-change="sub-progress"]'), '应存在子目标进度滑条');
  });
  t('子目标进度滑到 50 不自动完成', () => {
    const r = d.querySelector('#page-goals [data-change="sub-progress"]');
    r.value = '50';
    fireChange(r);
    const s = app().DB.goals[0].subgoals[0];
    eq(s.progress, 50);
    eq(s.done, false);
  });
  t('子目标进度滑到 100 自动标记完成', () => {
    const r = d.querySelector('#page-goals [data-change="sub-progress"]');
    r.value = '100';
    fireChange(r);
    const s = app().DB.goals[0].subgoals[0];
    eq(s.progress, 100);
    eq(s.done, true);
  });
  t('直接勾选子目标进度自动置为 100', () => {
    app().DB.goals[0].subgoals[0].done = false;
    app().DB.goals[0].subgoals[0].progress = 30;
    app().showPage('goals');
    const cb = d.querySelector('#page-goals [data-change="sub-toggle"]');
    cb.checked = true;
    fireChange(cb);
    const s = app().DB.goals[0].subgoals[0];
    eq(s.done, true);
    eq(s.progress, 100);
  });
  close(dom);
}

/* ---------- 4. 饮食卡路里估算 ---------- */
{
  const dom = makeApp();
  const d = dom.window.document;
  const app = () => dom.window.__app;

  console.log('== 阶段9: 卡路里估算 ==');
  t('estimateKcal 基本估算（燕麦粥150 + 香蕉90 = 240）', () => {
    eq(app().estimateKcal('燕麦粥+香蕉'), 240);
  });
  t('estimateKcal 长词优先不重复计数（鸡胸肉沙拉=300，不再加鸡胸肉）', () => {
    eq(app().estimateKcal('鸡胸肉沙拉'), 300);
  });
  t('无法识别的食物返回 null', () => {
    eq(app().estimateKcal('外星人料理'), null);
    eq(app().estimateKcal(''), null);
  });
  t('三餐合计文案带"千卡"与"仅供参考"', () => {
    const txt = app().dietKcalText({ breakfast: '燕麦粥', lunch: '米饭', dinner: '' });
    ok(txt.includes('千卡') && txt.includes('仅供参考'), '文案: ' + txt);
    ok(txt.includes('380'), '150+230=380: ' + txt);
  });
  t('部分无法估算时有提示', () => {
    const txt = app().dietKcalText({ breakfast: '燕麦粥', lunch: '神秘食物', dinner: '' });
    ok(txt.includes('部分食物无法估算'), '文案: ' + txt);
  });
  t('饮食页输入实际饮食后热量行即时更新且输入框不被打断', () => {
    app().showPage('diet');
    const input = d.querySelector('#page-diet [data-change="diet"][data-meal="breakfast"]');
    input.value = '燕麦粥+鸡蛋';
    fireChange(input);
    const kcalEl = d.getElementById('diet-kcal');
    ok(kcalEl.textContent.includes('290'), '150+140=290: ' + kcalEl.textContent);
    ok(d.querySelector('#page-diet [data-change="diet"][data-meal="breakfast"]') === input
       || input.value === '燕麦粥+鸡蛋', '输入框应保留原值');
    eq(app().DB.diet[todayKey()].breakfast, '燕麦粥+鸡蛋');
  });
  t('饮食页三餐建议带卡路里标注', () => {
    // 先打卡心情+天气使推荐出现
    const k = todayKey();
    app().DB.moods[k] = { level: 4, note: '' };
    app().DB.weather[k] = 'sunny';
    app().showPage('diet');
    const html = d.querySelector('#page-diet').innerHTML;
    ok(html.includes('千卡'), '建议中应包含千卡标注');
  });
  close(dom);
}

/* ---------- 5. 游戏卡片大卡样式 ---------- */
{
  const dom = makeApp();
  const html = dom.window.document.documentElement.innerHTML;
  console.log('== 阶段9: 游戏卡片大卡样式 ==');
  t('游戏卡片为大卡样式（min-height>=180px）', () => {
    const m = html.match(/\.game-card\s*\{[^}]*min-height:\s*(\d+)px/);
    ok(m && +m[1] >= 180, 'game-card min-height: ' + (m && m[1]));
  });
  t('游戏网格最小列宽>=280px', () => {
    const m = html.match(/\.game-grid\s*\{[^}]*minmax\((\d+)px/);
    ok(m && +m[1] >= 280, 'game-grid minmax: ' + (m && m[1]));
  });
  close(dom);
}

console.log('阶段 9 测试结束');
