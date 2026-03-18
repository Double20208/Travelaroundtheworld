/**
 * -L 是农历  例如05-20-L 
 * +  是正计时 例如2026-05-20+ 这样天数从20号开始算起
 * 最上面那个是正计时 需要设置变量 'MAIN_TITLE' 'MAIN_DATE'
 * 下面六个 左边变量分别是 'L1_T' 'L1_D' 'L2_T' 'L2_D''L3_T' 'L3_D'
 * 下面六个 右边变量分别是 'R1_T' 'R1_D' 'R2_T' 'R2_D''R3_T' 'R3_D'
 */

export default async function (ctx) {
  const now = new Date();
  
  // 1. 安全获取北京时间的年、月、日
  const bjParts = new Intl.DateTimeFormat('en-US', { 
    timeZone: 'Asia/Shanghai', year: 'numeric', month: 'numeric', day: 'numeric' 
  }).formatToParts(now);
  
  let bjY, bjM, bjD;
  bjParts.forEach(p => {
    if (p.type === 'year') bjY = parseInt(p.value);
    if (p.type === 'month') bjM = parseInt(p.value);
    if (p.type === 'day') bjD = parseInt(p.value);
  });
  
  // 核心修复 1：将“今天”的计算锚点设为北京时间的【正午12点】（对应 UTC 的 04:00）
  // 完美吸收所有的时差波动，无论代理怎么飘，绝不跨日！
  const todayAnchor = new Date(Date.UTC(bjY, bjM - 1, bjD, 4, 0, 0));

  const timeFormatter = new Intl.DateTimeFormat('en-GB', { 
    timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false
  });
  const timeStr = timeFormatter.format(now);

  // 1. 主目标计算
  const mainTitle = ctx.env.MAIN_TITLE || "已出生天数";
  const mainRaw = (ctx.env.MAIN_DATE || "1997-06-20").replace('+', '').trim();
  const [bY, bM, bD] = mainRaw.split('-').map(Number);
  
  // 主目标的锚点同样设为正午12点
  const mainAnchor = new Date(Date.UTC(bY, bM - 1, bD, 4, 0, 0));
  let passedDays = Math.round((todayAnchor - mainAnchor) / 86400000);
  if (passedDays < 0) passedDays = Math.abs(passedDays);

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
          const [tY, tM, tD] = cleanStr.split("-").map(Number);
          const targetAnchor = new Date(Date.UTC(tY, tM - 1, tD, 4, 0, 0));
          days = Math.round((todayAnchor - targetAnchor) / 86400000);
        } else if (d.endsWith("-L")) {
          days = getLunarRemaining(cleanStr, todayAnchor);
        } else if (cleanStr.length === 5) {
          const [tM, tD] = cleanStr.split("-").map(Number);
          let targetAnchor = new Date(Date.UTC(bjY, tM - 1, tD, 4, 0, 0));
          if (targetAnchor < todayAnchor) {
            targetAnchor = new Date(Date.UTC(bjY + 1, tM - 1, tD, 4, 0, 0));
          }
          days = Math.round((targetAnchor - todayAnchor) / 86400000);
        } else {
          const [tY, tM, tD] = cleanStr.split("-").map(Number);
          const targetAnchor = new Date(Date.UTC(tY, tM - 1, tD, 4, 0, 0));
          days = Math.round((targetAnchor - todayAnchor) / 86400000);
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

// ================= 最稳健的农历推演引擎 =================
function getLunarRemaining(mdStr, todayAnchor) {
  const [lMonth, lDay] = mdStr.split("-").map(Number);
  
  // 恢复原版被验证跑得通的 Locale 配置，只加上关键的时区锁
  const formatter = new Intl.DateTimeFormat('zh-u-ca-chinese', { 
    timeZone: 'Asia/Shanghai', 
    month: 'numeric', 
    day: 'numeric' 
  });

  // 以今天中午 12 点为起跑线，每次平移 24 小时 (86400000毫秒) 穷举
  for (let i = 0; i <= 385; i++) {
    const testDate = new Date(todayAnchor.getTime() + i * 86400000);
    const parts = formatter.formatToParts(testDate);
    
    let m = 0, d = 0;
    parts.forEach(p => {
      // 这里的逻辑与你最早提供的一模一样，确保不会在特定 iOS 版本上报错
      if (p.type === 'month') m = parseInt(p.value);
      if (p.type === 'day') d = parseInt(p.value);
    });

    if (m === lMonth && d === lDay) return i;
  }
  return 0;
}
