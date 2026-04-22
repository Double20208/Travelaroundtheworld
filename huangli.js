/**
 * 代码名称: 📅 日历 / 老黄历 (极简比例优化防吞字版)
 * ==========================================
 */
export default async function(ctx) {
  const { MY_ZODIAC } = ctx.env || {};

  const C = {
    bg: { light: '#FFFFFF', dark: '#121212' },
    cardBg: { light: '#F2F2F7', dark: '#1C1C1E' },     
    bubbleBg: { light: '#8E8E9315', dark: '#FFFFFF15' }, 
    main: { light: '#1C1C1E', dark: '#FFFFFF' },
    sub: { light: '#48484A', dark: '#D1D1D6' },
    muted: { light: '#8E8E93', dark: '#8E8E93' },
    divider: { light: '#E5E5EA', dark: '#38383A' },
    gold: { light: '#FF9500', dark: '#FFD700' },     
    yi: { light: '#34C759', dark: '#30D158' },       
    ji: { light: '#FF3B30', dark: '#FF453A' },       
    term: { light: '#34C759', dark: '#30D158' },     
    holiday: { light: '#007AFF', dark: '#0A84FF' },
    yiBg: { light: '#34C75910', dark: '#30D15815' },
    jiBg: { light: '#FF3B3010', dark: '#FF453A15' },
    transparent: '#00000000'
  };

  const now = new Date(Date.now() + (new Date().getTimezoneOffset() + 480) * 60000);
  const [Y, M, D] = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
  const WEEK = "日一二三四五六"[now.getDay()];
  const P = n => n < 10 ? `0${n}` : n;

  const getZodiac = (m, d) => {
    const s = ["摩羯座","水瓶座","双鱼座","白羊座","金牛座","双子座","巨蟹座","狮子座","处女座","天秤座","天蝎座","射手座","摩羯座"];
    const l = [20,19,21,20,21,22,23,23,23,24,23,22];
    return d < l[m-1] ? s[m-1] : s[m];
  };
  const currentZodiacDisplay = MY_ZODIAC || getZodiac(M, D);

  const Lunar = {
    info: [0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,0x0d520],
    termNames: ["小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至"],
    getTerm(y, n) { return new Date((31556925974.7*(y-1900)+[0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758][n-1]*60000)+Date.UTC(1900,0,6,2,5)).getUTCDate() },
    parse(y, m, d) {
      let offset = Math.round((Date.UTC(y, m-1, d) - Date.UTC(1900, 0, 31)) / 86400000), i, temp = 0;
      for(i=1900; i<2101 && offset>0; i++) {
        temp = 348; for(let j=0x8000; j>0x8; j>>=1) temp += (this.info[i-1900] & j) ? 1 : 0;
        temp += (this.info[i-1900] & 0xf) ? ((this.info[i-1900] & 0x10000) ? 30 : 29) : 0;
        offset -= temp;
      }
      if(offset < 0) { offset += temp; i--; }
      const lYear = i, leap = this.info[lYear-1900] & 0xf; 
      let isLeap = false;
      for(i=1; i<13 && offset>0; i++) {
        if(leap>0 && i==(leap+1) && !isLeap) { --i; isLeap=true; temp = (this.info[lYear-1900] & 0x10000) ? 30 : 29; } 
        else temp = (this.info[lYear-1900] & (0x10000 >> i)) ? 30 : 29;
        if(isLeap && i==(leap+1)) isLeap = false; 
        offset -= temp;
      }
      if(offset==0 && leap>0 && i==leap+1) if(isLeap) isLeap=false; else { isLeap=true; --i; }
      if(offset<0) { offset+=temp; i--; }
      const lD = offset + 1, tId = m * 2 - (d < this.getTerm(y, m * 2 - 1) ? 2 : 1);
      const gz = "甲乙丙丁戊己庚辛壬癸"[(lYear-4)%10] + "子丑寅卯辰巳午未申酉戌亥"[(lYear-4)%12];
      const ani = "鼠牛虎兔龙蛇马羊猴鸡狗猪"[(lYear-4)%12];
      const cnMonth = `${isLeap?"闰":""}${["正","二","三","四","五","六","七","八","九","十","冬","腊"][i-1]}月`;
      const cnDay = lD==10?"初十":lD==20?"二十":lD==30?"三十":["初","十","廿","卅"][Math.floor(lD/10)] + ["日","一","二","三","四","五","六","七","八","九","十"][lD%10];
      return { gz, ani, cn: `${cnMonth}${cnDay}`, term: (this.getTerm(y, tId+1) == d) ? this.termNames[tId] : "" };
    }
  };

  const allTerms = [];
  [-1, 0, 1].forEach(offset => {
    for(let i=1; i<=24; i++) allTerms.push({ name: Lunar.termNames[i-1], date: new Date(Y + offset, Math.floor((i-1)/2), Lunar.getTerm(Y + offset, i)) });
  });

  const todayMs = new Date(Y, M-1, D).getTime();
  let currentTerm = "", upcomingTerms = [];
  for (let i = 0; i < allTerms.length; i++) {
    const diff = Math.round((allTerms[i].date.getTime() - todayMs) / 86400000);
    if (diff >= 0) {
      currentTerm = diff === 0 ? allTerms[i].name : allTerms[i-1].name;
      const startIdx = diff === 0 ? i + 1 : i;
      // 【修改点】将显示的未来节气数量从 4 改为 3
      upcomingTerms = allTerms.slice(startIdx, startIdx + 3).map(t => `${t.name} ${Math.round((t.date.getTime() - todayMs) / 86400000)}天`);
      break;
    }
  }

  const obj = Lunar.parse(Y, M, D);
  const shichenStr = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"][Math.floor((now.getHours() + 1) % 24 / 2)] + "时";
  let apiData = {};

  try {
    const resp = await ctx.http.get(`https://raw.githubusercontent.com/zqzess/openApiData/main/calendar_new/${Y}/${Y}${P(M)}.json`, { timeout: 8000 });
    const json = JSON.parse(await resp.text());
    const patterns = [`${Y}-${P(M)}-${P(D)}`, `${Y}-${M}-${D}`, `${Y}/${P(M)}/${P(D)}`, `${Y}/${M}/${D}`, `${Y}${P(M)}${P(D)}`];
    const findDateData = (data) => {
      if (!data || typeof data !== 'object') return null;
      for (const key in data) {
        const val = data[key];
        if (!val) continue;
        if (patterns.some(p => String(key).includes(p))) return val;
        if (typeof val === 'object') {
          const dStr = String(val.date || val.day || val.gregorian || val.oDate || "");
          if (patterns.some(p => dStr.includes(p))) return val;
          if (val.day == D && (val.month == M || (!val.month && !val.year))) return val;
          const res = findDateData(val);
          if (res) return res;
        }
      }
      return null;
    };
    apiData = findDateData(json) || {};
  } catch (e) {}

  const getVal = (...keys) => { for(let k of keys) if(apiData[k]) return apiData[k]; return ""; };
  const rawYi = getVal("yi", "Yi", "suit").replace(/\./g, " ").trim();
  const rawJi = getVal("ji", "Ji", "avoid").replace(/\./g, " ").trim();

  let chongshaInfo = getVal("chongsha", "ChongSha", "chong");
  if (!chongshaInfo || chongshaInfo === "无") {
      const cycle = (Math.round((Date.UTC(Y, M-1, D) - Date.UTC(1900,0,31)) / 86400000) + 40) % 60;
      const dCycle = cycle < 0 ? cycle + 60 : cycle;
      const dZhi = dCycle % 12;
      const cIndex = (dCycle + 6) % 60;
      chongshaInfo = `冲${"鼠牛虎兔龙蛇马羊猴鸡狗猪"[(dZhi+6)%12]}(${"甲乙丙丁戊己庚辛壬癸"[cIndex%10]}${"子丑寅卯辰巳午未申酉戌亥"[cIndex%12]})煞${["南","东","北","西"][dZhi%4]}`;
  }

  let todayHoliday = getVal("holiday", "festival", "jiejiari");
  if (!todayHoliday && apiData.type && apiData.type.name) {
      const tName = apiData.type.name;
      if (tName !== "工作日" && tName !== "周末" && tName !== "休息日") todayHoliday = tName;
  }

  const targetHolidays = [
    { name: "元旦", match: (m, d, l, nL) => m === 1 && d === 1 },
    { name: "春节", match: (m, d, l, nL) => l.cn === "正月初一" },
    { name: "清明", match: (m, d, l, nL) => l.term === "清明" },
    { name: "劳动", match: (m, d, l, nL) => m === 5 && d === 1 },
    { name: "端午", match: (m, d, l, nL) => l.cn === "五月初五" },
    { name: "中秋", match: (m, d, l, nL) => l.cn === "八月十五" },
    { name: "国庆", match: (m, d, l, nL) => m === 10 && d === 1 }
  ];

  let upcomingHolidays = [];
  let foundHolidays = new Set();
  for (let i = 1; i <= 365; i++) {
    let tempDate = new Date(todayMs + i * 86400000);
    let ty = tempDate.getFullYear(), tm = tempDate.getMonth() + 1, td = tempDate.getDate();
    let tl = Lunar.parse(ty, tm, td);
    for (let h of targetHolidays) {
      if (!foundHolidays.has(h.name) && h.match(tm, td, tl, tl)) {
        upcomingHolidays.push(`${h.name} ${i}天`);
        foundHolidays.add(h.name);
      }
    }
    // 【修改点】将显示的节假日数量从 4 改为 3
    if (upcomingHolidays.length >= 3) break; 
  }

  let finalHolidayText = upcomingHolidays.join(" · ");
  if (todayHoliday) finalHolidayText = `今日${todayHoliday} | 距 ${finalHolidayText}`;

  return {
    type: 'widget', padding: [10, 12], url: 'calshow://', backgroundColor: C.bg, 
    children: [
      { 
        type: 'stack', direction: 'row', alignItems: 'center', gap: 4, 
        children: [
          { type: 'image', src: 'sf-symbol:calendar.circle.fill', color: C.main, width: 14, height: 14 }, 
          { type: 'text', text: `${Y}年${M}月${D}日`, font: { size: 13, weight: 'heavy' }, textColor: C.main },
          { type: 'spacer' },
          { type: 'text', text: currentZodiacDisplay, font: { size: 11, weight: 'bold' }, textColor: C.muted },
          { type: 'text', text: '|', font: { size: 11, weight: 'medium' }, textColor: C.divider },
          { type: 'text', text: shichenStr, font: { size: 11, weight: 'bold' }, textColor: C.muted }
        ]
      },
      { type: 'spacer', length: 6 }, 
      {
        type: 'stack', direction: 'row', alignItems: 'center', gap: 10, 
        children: [
          // 🌟 极简版左侧日期卡片
          {
            type: 'stack', direction: 'column', alignItems: 'center', justifyContent: 'center',
            backgroundColor: C.cardBg, borderRadius: 10, padding: [3, 5], 
            children: [
              { type: 'text', text: `周${WEEK}`, font: { size: 10, weight: 'bold' }, textColor: C.holiday, maxLines: 1 }, 
              { type: 'spacer', length: 1 },
              { type: 'text', text: `${D}`, font: { size: 22, weight: 'heavy', family: 'rounded' }, textColor: C.main, maxLines: 1 }, 
              { type: 'spacer', length: 1 },
              { type: 'text', text: obj.cn, font: { size: 10, weight: 'bold' }, textColor: C.gold, maxLines: 1 } 
            ]
          },
          {
            // 【修改点】右侧列表 gap 从 4 微调为 3
            type: 'stack', direction: 'column', gap: 3, flex: 1, 
            children: [
              { type: 'text', text: `${obj.gz}(${obj.ani})年 ${obj.term ? `今日${obj.term}` : `当前${currentTerm}`}`, font: { size: 11, weight: 'bold' }, textColor: C.gold },
              {
                type: 'stack', direction: 'row', alignItems: 'center', gap: 4, 
                backgroundColor: C.yiBg, borderRadius: 6, padding: [2, 4],
                children: [
                  { type: 'stack', padding: [1, 3], backgroundColor: C.yi, borderRadius: 4, children: [{ type: 'text', text: "宜", font: { size: 9, weight: 'heavy' }, textColor: '#FFFFFF' }] },
                  // 【修改点】maxLines 改为 2，允许换行
                  { type: 'text', text: rawYi || "诸事皆宜", font: { size: 11, weight: 'medium' }, textColor: C.sub, maxLines: 2, flex: 1 } 
                ]
              },
              {
                type: 'stack', direction: 'row', alignItems: 'center', gap: 4,
                backgroundColor: C.jiBg, borderRadius: 6, padding: [2, 4],
                children: [
                  { type: 'stack', padding: [1, 3], backgroundColor: C.ji, borderRadius: 4, children: [{ type: 'text', text: "忌", font: { size: 9, weight: 'heavy' }, textColor: '#FFFFFF' }] },
                  // 【修改点】maxLines 改为 2，允许换行
                  { type: 'text', text: rawJi || "诸事无忌", font: { size: 11, weight: 'medium' }, textColor: C.sub, maxLines: 2, flex: 1 }
                ]
              },
              {
                type: 'stack', direction: 'row', alignItems: 'center', gap: 4, padding: [0, 4],
                children: [
                  { type: 'image', src: 'sf-symbol:flame.fill', color: C.ji, width: 11, height: 11 },
                  { type: 'text', text: chongshaInfo.split('煞')[0], font: { size: 11, weight: 'medium' }, textColor: C.muted },
                  { type: 'spacer' }
                ]
              }
            ]
          }
        ]
      },
      { type: 'spacer', length: 6 }, 
      {
        type: 'stack', direction: 'column', gap: 2, padding: [5, 8], backgroundColor: C.bubbleBg, borderRadius: 8,
        children: [
          {
            type: 'stack', direction: 'row', alignItems: 'center', gap: 4,
            children: [
              { type: 'image', src: 'sf-symbol:leaf.fill', color: C.term, width: 11, height: 11 },
              // 【修改点】maxLines 改为 2，允许换行
              { type: 'text', text: upcomingTerms.join(" · "), font: { size: 11, weight: 'medium' }, textColor: C.sub, maxLines: 2, flex: 1 }
            ]
          },
          {
            type: 'stack', direction: 'row', alignItems: 'center', gap: 4,
            children: [
              { type: 'image', src: 'sf-symbol:paperplane.fill', color: C.holiday, width: 11, height: 11 },
              // 【修改点】maxLines 改为 2，允许换行
              { type: 'text', text: finalHolidayText, font: { size: 11, weight: 'medium' }, textColor: C.sub, maxLines: 2, flex: 1 }
            ]
          }
        ]
      }
    ]
  };
}