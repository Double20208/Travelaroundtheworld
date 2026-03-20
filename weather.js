// 天气小组件 (Universal Code Architect 修复版)
// 修复了特定小组件宿主环境下的 HTTP 响应兼容性问题

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
  const { CITY: city = "London" } = ctx?.env || {};

  let temp = "--";
  let feelsLike = "--";
  let description = "获取失败"; 
  let humidity = "--";
  let wind = "--";
  let weatherIcon = "exclamationmark.triangle.fill"; 
  let displayCity = city;

  try {
    // 1. 获取坐标
    const geoResp = await ctx.http.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`,
      { timeout: 8000 }
    );
    
    // [环境兼容]: 仅当明确存在 status 且属于 4xx/5xx 时才报错，兼容没有 .ok 属性的宿主
    if (geoResp.status && geoResp.status >= 400) {
        throw new Error(`Geocoding API Error: ${geoResp.status}`);
    }
    
    const geoData = await geoResp.json();
    const loc = geoData.results?.[0];
    if (!loc) throw new Error(`未找到城市: ${city}`);

    displayCity = loc.name || city;

    // 2. 获取天气
    const weatherResp = await ctx.http.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`,
      { timeout: 8000 }
    );

    if (weatherResp.status && weatherResp.status >= 400) {
        throw new Error(`Weather API Error: ${weatherResp.status}`);
    }

    const weatherData = await weatherResp.json();
    const current = weatherData.current;
    if (!current) throw new Error("返回的数据格式不包含 current 节点");

    temp = Math.round(current.temperature_2m ?? 0);
    feelsLike = Math.round(current.apparent_temperature ?? 0);
    humidity = current.relative_humidity_2m ?? "--";
    wind = Math.round(current.wind_speed_10m ?? 0);

    const code = current.weather_code ?? -1;
    weatherIcon = getWeatherIcon(code);
    description = getWeatherDesc(code);

  } catch (err) {
    console.error(`[Weather Widget Error]:`, err);
    // 依然走降级 UI，避免整个组件白屏
  }

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
    refreshAfter: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          { type: "image", src: "sf-symbol:location.fill", width: 10, height: 10, color: "#FFFFFFBB" },
          { type: "text", text: displayCity, font: { size: "caption1", weight: "medium" }, textColor: "#FFFFFFBB" },
          { type: "spacer" },
          { type: "image", src: `sf-symbol:${weatherIcon}`, width: 18, height: 18, color: "#FFFFFF" },
        ],
      },
      {
        type: "stack",
        direction: "row",
        alignItems: "end",
        gap: 4,
        children: [
          { type: "text", text: `${temp}°`, font: { size: 40, weight: "thin" }, textColor: "#FFFFFF" },
          {
            type: "stack",
            direction: "column",
            alignItems: "start",
            padding: [0, 0, 8, 0],
            gap: 0,
            children: [
              { type: "text", text: description, font: { size: "caption1", weight: "medium" }, textColor: "#FFFFFFDD" },
              { type: "text", text: `体感 ${feelsLike}°`, font: { size: "caption2" }, textColor: "#FFFFFF99" },
            ],
          },
        ],
      },
      { type: "spacer" },
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
