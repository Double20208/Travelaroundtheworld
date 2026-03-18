/**
 * -L 是农历  例如05-20-L 
 * +  是正计时 例如2026-05-20+ 这样天数从20号开始算起
 * 最上面那个是正计时 需要设置变量 'MAIN_TITLE' 'MAIN_DATE'
 * 下面六个 左边变量分别是 'L1_T' 'L1_D' 'L2_T' 'L2_D''L3_T' 'L3_D'
 * 下面六个 右边变量分别是 'R1_T' 'R1_D' 'R2_T' 'R2_D''R3_T' 'R3_D'
 */

export default async function (ctx) {
  // ================= 核心魔法 1：获取真实的北京时间数字 =================
  const now = new Date();
  // 强行用毫秒数加上 8 小时，获取北京时间的绝对值
  const bjTime = new Date(now.getTime() + (8 * 3600000));
  const bjY = bjTime.getUTCFullYear();
  const bjM = bjTime.getUTCMonth(); // 月份是 0-11
  const bjD = bjTime.getUTCDate();
  
  // 顶部时钟
  const timeStr = `${String(bjTime.getUTCHours()).padStart(2, "0")}:${String(bjTime.getUTCMinutes()).padStart(2, "0")}`;

  // ================= 核心魔法 2：制造本地时区的“假北京时间” =================
  // 我们直接用北京的数字，生成一个手机【本地时区】的今天，并钉死在正午 12 点！
  // 这样不论手机底层怎么转，它读取出来的就是我们给的日期。
  const localToday = new Date(bjY, bjM, bjD, 12, 0, 0);

  // 通用天数计算：只比较两个正午 12 点的差值，完美避开夏令时吞掉的 1 小时
  const getDiff = (tY, tM, tD) => {
    const target = new Date(tY, tM - 1, tD, 12, 0, 0);
    return Math.round((target - localToday) / 86400000);
  };

  // 1. 主目标计算
  const mainTitle = ctx.env.MAIN_TITLE || "已出生天数";
  const mainRaw = (ctx.env.MAIN_DATE || "1997-06-20").replace('+', '').trim();
  const [bY, bM, bD] = mainRaw.split('-').map(Number);
  
  // 正计时，直接取绝对值
  const passedDays = Math.abs(getDiff(bY, bM, bD));

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
          // 过去的日子
          const [tY, tM, tD] = cleanStr.split("-").map(Number);
          days = Math.abs(getDiff(tY, tM, tD));
        } else if (d.endsWith("-L")) {
          // 农历计算
          days = getLunarRemaining(cleanStr, localToday);
        } else if (cleanStr.length === 5) {
          // 每年重复的阳历
          const [tM, tD] = cleanStr.split("-").map(Number);
          days = getDiff(bjY, tM, tD);
          if (days < 0) {
              days = getDiff(bjY + 1, tM, tD); // 过了算明年
          }
        } else {
          // 具体的未来某天
          const [tY, tM, tD] = cleanStr.split("-").map(Number);
          days = getDiff(tY, tM, tD);
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

// ================= 脱离时区绑定的农历引擎 =================
function getLunarRemaining(mdStr, localToday) {
  const [lMonth, lDay] = mdStr.split("-").map(Number);
  
  // 完全移除 timeZone 配置，让 iOS 乖乖使用我们喂给它的本地时间
  const formatter = new Intl.DateTimeFormat('zh-u-ca-chinese', { 
    month: 'numeric', 
    day: 'numeric' 
  });

  for (let i = 0; i <= 385; i++) {
    // 基于本地今天正午 12 点，每天增加 86400000 毫秒
    const testDate = new Date(localToday.getTime() + i * 86400000);
    const parts = formatter.formatToParts(testDate);
    
    let m = 0, d = 0;
    parts.forEach(p => {
      if (p.type === 'month') m = parseInt(p.value);
      if (p.type === 'day') d = parseInt(p.value);
    });

    if (m === lMonth && d === lDay) return i;
  }
  return 0;
}
