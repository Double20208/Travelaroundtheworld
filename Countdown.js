/**
 * -L 是农历  例如05-20-L 
 * +  是正计时 例如2026-05-20+ 这样天数从20号开始算起
 * 最上面那个是正计时 需要设置变量 'MAIN_TITLE' 'MAIN_DATE'
 * 下面六个 左边变量分别是 'L1_T' 'L1_D' 'L2_T' 'L2_D''L3_T' 'L3_D'
 * 下面六个 右边变量分别是 'R1_T' 'R1_D' 'R2_T' 'R2_D''R3_T' 'R3_D'
 */

export default async function (ctx) {
  // 1. 获取纯正的时间：强制锁定东八区 (UTC+8) 时间，彻底防止因系统时区导致的日期在午夜提前或延后翻滚
  const now = new Date(Date.now() + (new Date().getTimezoneOffset() + 480) * 60000);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  const todayLocal = new Date(currentYear, currentMonth, currentDate);

  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // ================= 核心修复：纯数字日期天数计算器 =================
  const getDiffDays = (y, m, d) => {
    // 强制使用 UTC 毫秒级计算天数差，完全规避夏令时 (DST) 导致的 "23.99小时" 取整 Bug
    const targetUTC = Date.UTC(y, m - 1, d);
    const todayUTC = Date.UTC(currentYear, currentMonth, currentDate);
    return Math.round((targetUTC - todayUTC) / 86400000);
  };

  // 1. 主目标计算
  const mainTitle = ctx.env.MAIN_TITLE || "已出生天数";
  const mainRaw = (ctx.env.MAIN_DATE || "1997-06-20").replace('+', '').trim();
  const [bY, bM, bD] = mainRaw.split('-').map(Number);
  
  // 主计算：求绝对值天数
  let passedDays = Math.abs(getDiffDays(bY, bM, bD));

  // 2. 列表解析
  const getList = (side) => {
    let list = [];
    for (let i = 1; i <= 3; i++) {
      const t = ctx.env[`${side}${i}_T`];
      const d = ctx.env[`${side}${i}_D`];
      if (t && d) {
        let days = 0;
        const cleanStr = d.replace('+', '').replace('-L', '').trim();
        
        if (d.endsWith("+")) {
          // 正计时：过去 -> 今天
          const [tY, tM, tD] = cleanStr.split("-").map(Number);
          days = Math.abs(getDiffDays(tY, tM, tD));
        } else if (d.endsWith("-L")) {
          // 农历计算 (调用全新查表引擎)
          days = getLunarRemaining(cleanStr, currentYear, currentMonth, currentDate);
        } else if (cleanStr.length === 5) {
          // 每年重复的阳历 (MM-DD)
          const [tM, tD] = cleanStr.split("-").map(Number);
          days = getDiffDays(currentYear, tM, tD);
          if (days < 0) {
              days = getDiffDays(currentYear + 1, tM, tD); // 今年已过，算明年的
          }
        } else {
          // 特定未来日期 (YYYY-MM-DD)
          const [tY, tM, tD] = cleanStr.split("-").map(Number);
          days = getDiffDays(tY, tM, tD);
        }
        list.push({ title: t, days: Math.max(0, days) });
      }
    }
    return list;
  };

  const leftList = getList("L");
  const rightList = getList("R");

  return {
    type: "widget",
    padding: [16, 12, 16, 12],
    backgroundGradient: {
      type: "linear",
      colors: ["#0891B2", "#4F46E5", "#0F172A"],
      stops: [0, 0.45, 1],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 }
    },
    refreshAfter: new Date(Date.now() + 3600000).toISOString(),
    children: [
      {
        type: "stack", direction: "row", alignItems: "center", padding: [0, 4, 0, 4],
        children: [
          { type: "image", src: "sf-symbol:clock.fill", width: 10, height: 10, color: "#22D3EE" },
          { type: "spacer", width: 5 },
          { type: "text", text: "2026 DIGITAL LIFE", font: { size: "caption2", weight: "black" }, textColor: "#FFFFFF55" },
          { type: "spacer" },
          { type: "text", text: timeStr, font: { size: "caption2" }, textColor: "#FFFFFF33" }
        ]
      },
      { type: "spacer", height: 12 },
      {
        type: "stack", direction: "row", alignItems: "center", padding: [0, 6, 0, 6],
        children: [
          { type: "text", text: mainTitle, font: { size: 14, weight: "bold" }, textColor: "#22D3EE", flex: 1 },
          {
            type: "stack", direction: "row", alignItems: "end", gap: 2,
            children: [
              { type: "text", text: `${passedDays}`, font: { size: 28, weight: "bold" }, textColor: "#FDE047" },
              { type: "text", text: "天", font: { size: 9, weight: "bold" }, textColor: "#FDE04744", padding: [0, 0, 4, 0] }
            ]
          }
        ]
      },
      { type: "spacer", height: 22 },
      {
        type: "stack", direction: "row", gap: 8, 
        children: [
          { type: "stack", direction: "column", flex: 1, gap: 7, children: leftList.map(item => buildCapsule(item)) },
          { type: "stack", direction: "column", flex: 1, gap: 7, children: rightList.map(item => buildCapsule(item)) }
        ]
      },
      { type: "spacer" }
    ]
  };
}

function buildCapsule(item) {
  return {
    type: "stack", direction: "row", alignItems: "center", padding: [8, 10, 8, 10],
    backgroundColor: "#FFFFFF0C", borderRadius: 10, borderWidth: 0.5, borderColor: "#FFFFFF12",
    children: [
      { type: "text", text: item.title, font: { size: 10 }, textColor: "#FFFFFF88", flex: 1, maxLines: 1 },
      {
        type: "stack", direction: "row", alignItems: "end", gap: 1.5,
        children: [
          { type: "text", text: `${item.days}`, font: { size: 11, weight: "bold" }, textColor: "#FFFFFFEE" },
          { type: "text", text: "天", font: { size: 7 }, textColor: "#FFFFFF33", padding: [0, 0, 0.5, 0] }
        ]
      }
    ]
  };
}

// ================= 全新植入：专业级农历计算引擎 =================
// 采用压缩的 16 进制硬编码表进行位运算解析，支持 1900 - 2100 年精准排盘
const LunarEngine = {
  info: [0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,0x0d520],
  
  getLunarDate(y, m, d) {
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
    
    // 返回纯数字的农历月(i)和农历日(offset + 1)
    return { month: i, day: offset + 1, isLeap: isLeap };
  }
};

function getLunarRemaining(mdStr, y, m, d) {
  const [targetMonth, targetDay] = mdStr.split("-").map(Number);
  
  // 从今天起，往后推演最多 385 天（覆盖农历闰年极限天数）
  for (let offsetDays = 0; offsetDays <= 385; offsetDays++) {
    const testDate = new Date(y, m, d + offsetDays);
    const lDate = LunarEngine.getLunarDate(testDate.getFullYear(), testDate.getMonth() + 1, testDate.getDate());
    
    // 匹配目标月份和日期。为防止闰月干扰常规生日计算，忽略闰月数据(!lDate.isLeap)
    if (lDate.month === targetMonth && lDate.day === targetDay && !lDate.isLeap) {
      return offsetDays;
    }
  }
  return 0;
}
