// 一言（Hitokoto）小组件
// 每次刷新展示一条随机名言/语录，支持多种类型筛选。

export default async function (ctx) {
  // 1. 提取常量，提升可维护性 (Maintainability)
  const API_BASE_URL = "https://v1.hitokoto.cn/";
  const REFRESH_MINUTES = 30;
  const DEFAULT_QUOTE = "庐山烟雨浙江潮，未至千般恨不消。到得还来别无事，庐山烟雨浙江潮。";
  const DEFAULT_AUTHOR = "苏轼";

  // 2. 优化 URL 构造逻辑
  const type = ctx.env.TYPE?.trim() || "";
  const url = type ? `${API_BASE_URL}?c=${type}` : API_BASE_URL;

  // 3. 初始化默认状态
  let hitokoto = DEFAULT_QUOTE;
  let from = DEFAULT_AUTHOR;

  try {
    const resp = await ctx.http.get(url, { timeout: 5000 });
    
    // 防御性编程：检查 HTTP 状态码，避免解析非 200 响应体 (Security/Robustness)
    if (!resp || resp.status < 200 || resp.status >= 300) {
      throw new Error(`HTTP Error: ${resp?.status || 'Unknown'}`);
    }

    const data = await resp.json();

    // 防御性编程：确保 data.hitokoto 存在
    if (data && data.hitokoto) {
      hitokoto = data.hitokoto;
      
      // 优雅处理来源文本：兼容只有作者、只有作品、或两者皆有/皆无的情况
      const author = data.from_who || "";
      const source = data.from ? `「${data.from}」` : "";
      
      // 拼接并去除多余空格，若为空则回退到默认作者
      from = `${author}${source}`.trim() || DEFAULT_AUTHOR;
    }
  } catch (error) {
    // 捕获并打印错误日志，便于排查问题，但对外依然展示默认文案 (Maintainability)
    console.error("Hitokoto Widget Error:", error.message);
  }

  // 计算刷新时间
  const refreshTime = new Date(Date.now() + REFRESH_MINUTES * 60 * 1000).toISOString();

  // 返回 Widget UI 树
  return {
    type: "widget",
    padding: 16,
    gap: 0,
    backgroundGradient: {
      type: "linear",
      colors: ["#FEF3C7", "#FDE68A"],
      stops: [0, 1],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 0, y: 1 },
    },
    refreshAfter: refreshTime,
    children: [
      {
        type: "image",
        src: "sf-symbol:quote.opening",
        width: 20,
        height: 20,
        color: "#92400E66",
      },
      { type: "spacer" },
      {
        type: "text",
        text: hitokoto,
        font: { size: "callout", weight: "medium" },
        textColor: "#78350F",
        maxLines: 4,
        minScale: 0.8,
      },
      { type: "spacer" },
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          { type: "spacer" },
          {
            type: "text",
            text: `— ${from}`,
            font: { size: "caption1" },
            textColor: "#92400EAA",
            maxLines: 1,
            minScale: 0.7,
          },
        ],
      },
    ],
  };
}
