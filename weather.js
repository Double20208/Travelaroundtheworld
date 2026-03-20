// 天气小组件 (Refactored by Universal Code Architect)
// 使用 Open-Meteo 公共 API 获取天气信息，无需 API Key。

// [性能优化]: 将静态映射表提升至模块级作用域。
// 避免每次组件刷新/函数调用时重新创建该对象，降低垃圾回收(GC)压力。
const WEATHER_DESC_MAP = {
  0: "晴", 1: "大部晴朗", 2: "多云", 3: "阴", 45: "雾", 48: "雾凇",
  51: "小毛毛雨", 53: "毛毛雨", 55: "大毛毛雨", 56: "冻毛毛雨", 57: "强冻毛毛雨",
  61: "小雨", 63: "中雨", 65: "大雨", 66: "冻雨", 67: "强冻雨",
  71: "小雪", 73: "中雪", 75: "大雪", 77: "霰",
  80: "小阵雨", 81: "阵雨", 82: "强阵雨", 85: "小阵雪", 86: "大阵雪",
  95: "雷暴", 96: "雷暴冰雹", 99: "强雷暴冰雹",
};

function getWeatherDesc(code) {
  return WEATHER_DESC_MAP[code] || "未知";
}

function getWeatherIcon(code) {
  if (code === 0) return "sun.max.fill";
  if (code <= 2) return "cloud.sun.fill";
  if (code === 3) return "cloud.fill";
  if (code === 45 || code === 48) return "cloud.fog.fill";
  if (code >= 51 && code <= 57) return "cloud.drizzle.fill";
  if (code >= 61 && code <= 67) return "cloud.rain.fill";
  if (code >= 71 && code <= 77) return "cloud.snow.fill";
  if (code >= 80 && code <= 82) return "cloud.rain.fill";
  if (code >= 85 && code <= 86) return "cloud.snow.fill";
  if (code >= 95) return "cloud.bolt.rain.fill";
  return "cloud.fill";
}

export default async function (ctx) {
  // [防御性编程]: 安全解构环境变量，防止 ctx 或 ctx.env 未定义时抛出 TypeError
  const { CITY: city = "London" } = ctx?.env || {};

  // 初始化 UI 状态，默认展示为“错误降级状态”而非“加载中”
  // 如果 try 块成功，这些值会被覆盖。
  let temp = "--";
  let feelsLike = "--";
  let description = "获取失败"; 
  let humidity = "--";
  let wind = "--";
  let weatherIcon = "exclamationmark.triangle.fill"; // 错误警示图标
  let displayCity = city;

  try {
    // 1. 获取坐标
    const geoResp = await ctx.http.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`,
      { timeout: 8000 }
    );
    
    // [健壮性]: 检查 HTTP 状态码，防止 JSON 解析 HTML 错误页导致崩溃
    if (!geoResp.ok) throw new Error(`Geocoding API failed with status: ${geoResp.status}`);
    
    const geoData = await geoResp.json();
    const loc = geoData.results?.[0];
    if (!loc) throw new Error(`City not found: ${city}`);

    displayCity = loc.name || city;

    // 2. 获取天气
    const weatherResp = await ctx.http.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`,
      { timeout: 8000 }
    );

    if (!weatherResp.ok) throw new Error(`Weather API failed with status: ${weatherResp.status}`);

    const { current } = await weatherResp.json();
    if (!current) throw new Error("Invalid weather data format");

    // [空值合并]: 使用 ?? 操作符防范 API 返回 null 导致 Math.round 产生 NaN
    temp = Math.round(current.temperature_2m ?? 0);
    feelsLike = Math.round(current.apparent_temperature ?? 0);
    humidity = current.relative_humidity_2m ?? "--";
    wind = Math.round(current.wind_speed_10m ?? 0);

    const code = current.weather_code ?? -1;
    weatherIcon = getWeatherIcon(code);
    description = getWeatherDesc(code);

  } catch (err) {
    // [调试体验]: 绝不生吞(swallow)异常。打印错误日志，方便在控制台定位网络或数据结构问题。
    console.error(`[Weather Widget Error]: ${err.message}`);
    // 由于顶部已设置好默认的异常UI展示数据，此处无需额外操作，保证用户界面能正常渲染降级视图。
  }

  // 组件渲染工厂函数
  const buildStatItem = (icon, value, unit) => ({
    type: "stack",
    direction: "column",
    alignItems: "center",
    gap: 2,
    children: [
      {
        type: "image",
        src: `sf-symbol:${icon}`,
        width: 14,
        height: 14,
        color: "#FFFFFF99",
      },
      {
        type: "text",
        text: `${value}${unit}`,
        font: { size: "caption2", weight: "medium" },
        textColor: "#FFFFFFCC",
      },
    ],
  });

  return {
    type: "widget",
    padding: 14,
    gap: 8,
    backgroundGradient: {
      type: "linear",
      colors: ["#2563EB", "#1E40AF", "#1E3A5F"],
      stops: [0, 0.6, 1],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 0.3, y: 1 },
    },
    refreshAfter: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 提前计算常量
    children: [
      // 城市 + 描述
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          {
            type: "image",
            src: "sf-symbol:location.fill",
            width: 10,
            height: 10,
            color: "#FFFFFFBB",
          },
          {
            type: "text",
            text: displayCity,
            font: { size: "caption1", weight: "medium" },
            textColor: "#FFFFFFBB",
          },
          { type: "spacer" },
          {
            type: "image",
            src: `sf-symbol:${weatherIcon}`,
            width: 18,
            height: 18,
            color: "#FFFFFF",
          },
        ],
      },

      // 温度
      {
        type: "stack",
        direction: "row",
        alignItems: "end",
        gap: 4,
        children: [
          {
            type: "text",
            text: `${temp}°`,
            font: { size: 40, weight: "thin" },
            textColor: "#FFFFFF",
          },
          {
            type: "stack",
            direction: "column",
            alignItems: "start",
            padding: [0, 0, 8, 0],
            gap: 0,
            children: [
              {
                type: "text",
                text: description,
                font: { size: "caption1", weight: "medium" },
                textColor: "#FFFFFFDD",
              },
              {
                type: "text",
                text: `体感 ${feelsLike}°`,
                font: { size: "caption2" },
                textColor: "#FFFFFF99",
              },
            ],
          },
        ],
      },

      { type: "spacer" },

      // 底部指标
      {
        type: "stack",
        direction: "row",
        gap: 0,
        children: [
          buildStatItem("humidity.fill", humidity, "%"),
          { type: "spacer" },
          buildStatItem("wind", wind, "km/h"),
          { type: "spacer" },
          buildStatItem("thermometer.medium", feelsLike, "°"),
        ],
      },
    ],
  };
}
