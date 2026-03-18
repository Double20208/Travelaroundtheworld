/**
 * -L 是农历  例如05-20-L 
 * +  是正计时 例如2026-05-20+ 这样天数从20号开始算起
 * 最上面那个是正计时 需要设置变量 'MAIN_TITLE' 'MAIN_DATE'
 * 下面六个 左边变量分别是 'L1_T' 'L1_D' 'L2_T' 'L2_D''L3_T' 'L3_D'
 * 下面六个 右边变量分别是 'R1_T' 'R1_D' 'R2_T' 'R2_D''R3_T' 'R3_D'
 */

export default async function (ctx) {
  // 1. 获取纯正的本地时间，将时分秒全部抹零，只取今天的日期
  const now = new Date();
  const currentYear = now.getFullYear();
  const todayLocal = new Date(currentYear, now.getMonth(), now.getDate());

  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // ================= 核心修复：纯数字日期天数计算器 =================
  // 绝对不使用 new Date("YYYY-MM-DD")，防止它擅自减去 8 小时变成前一天
  const getDiffDays = (y, m, d) => {
    // 使用本地时区构建目标日期的零点
    const target = new Date(y, m - 1, d);
    // 使用 Math.round 规避夏令时导致的 23.99 小时被取整为 0 天的 Bug
    return Math.round((target - todayLocal) / 86400000);
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
          // 农历计算
          days = getLunarRemaining(cleanStr, todayLocal);
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

// ================= 最纯净的农历引擎 =================
function getLunarRemaining(mdStr, todayLocal) {
  const [lMonth, lDay] = mdStr.split("-").map(Number);
  
  // 仅指定中国历法，让系统自动用你的手机时区去匹配
  const formatter = new Intl.DateTimeFormat('zh-CN', { 
    calendar: 'chinese',
    month: 'numeric', 
    day: 'numeric' 
  });

  for (let i = 0; i <= 385; i++) {
    // 从今天的本地零点开始往后推演，彻底杜绝 UTC 偏移
    const testDate = new Date(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate() + i);
    const parts = formatter.formatToParts(testDate);
    
    let m = 0, d = 0;
    parts.forEach(p => {
      // 兼容所有 iOS 版本，强行剔除可能出现的汉字（如"正月"），只保留数字
      if (p.type === 'month') m = parseInt(p.value.replace(/[^\d]/g, '')) || m;
      if (p.type === 'day') d = parseInt(p.value.replace(/[^\d]/g, '')) || d;
    });

    if (m === lMonth && d === lDay) return i;
  }
  return 0;
}
