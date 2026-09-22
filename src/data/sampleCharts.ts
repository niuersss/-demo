// Utility to generate realistic stock K-line chart SVG Data URLs for demonstration and rapid testing

function createStockChartSvg({
  title,
  symbol,
  period,
  prices,
  ma5Values,
  ma10Values,
  ma20Values,
  volumes,
  difValues,
  deaValues,
  histValues,
}: {
  title: string;
  symbol: string;
  period: string;
  prices: { o: number; h: number; l: number; c: number }[];
  ma5Values: number[];
  ma10Values: number[];
  ma20Values: number[];
  volumes: { v: number; isUp: boolean }[];
  difValues: number[];
  deaValues: number[];
  histValues: number[];
}) {
  const width = 800;
  const height = 520;
  const paddingLeft = 60;
  const paddingRight = 40;
  const klineTop = 50;
  const klineHeight = 240;
  const volTop = 310;
  const volHeight = 70;
  const macdTop = 400;
  const macdHeight = 85;

  const n = prices.length;
  const chartWidth = width - paddingLeft - paddingRight;
  const candleStep = chartWidth / n;
  const candleW = Math.max(4, candleStep * 0.65);

  const minP = Math.min(...prices.map((p) => p.l)) * 0.98;
  const maxP = Math.max(...prices.map((p) => p.h)) * 1.02;

  const getY = (val: number) =>
    klineTop + klineHeight - ((val - minP) / (maxP - minP)) * klineHeight;

  // Max volume
  const maxV = Math.max(...volumes.map((v) => v.v), 1);
  const getVolY = (val: number) =>
    volTop + volHeight - (val / maxV) * volHeight;

  // MACD scales
  const maxM = Math.max(
    ...difValues.map((v) => Math.abs(v)),
    ...deaValues.map((v) => Math.abs(v)),
    ...histValues.map((v) => Math.abs(v)),
    0.1
  ) * 1.15;

  const getMacdY = (val: number) =>
    macdTop + macdHeight / 2 - (val / maxM) * (macdHeight / 2);

  // Generate Candlesticks
  let candlesSvg = "";
  prices.forEach((p, i) => {
    const cx = paddingLeft + i * candleStep + candleStep / 2;
    const isUp = p.c >= p.o;
    const color = isUp ? "#ef4444" : "#10b981"; // CN stock: red up, green down
    const topY = getY(Math.max(p.o, p.c));
    const botY = getY(Math.min(p.o, p.c));
    const h = Math.max(2, botY - topY);
    const wickTop = getY(p.h);
    const wickBot = getY(p.l);

    // Wick
    candlesSvg += `<line x1="${cx}" y1="${wickTop}" x2="${cx}" y2="${wickBot}" stroke="${color}" stroke-width="1.5" />`;
    // Body
    candlesSvg += `<rect x="${cx - candleW / 2}" y="${topY}" width="${candleW}" height="${h}" fill="${isUp ? "#ef4444" : "#10b981"}" rx="1" />`;
  });

  // Generate MA Lines
  const createPolyline = (vals: number[], color: string) => {
    const pts = vals
      .map((val, i) => {
        const cx = paddingLeft + i * candleStep + candleStep / 2;
        return `${cx.toFixed(1)},${getY(val).toFixed(1)}`;
      })
      .join(" ");
    return `<polyline fill="none" stroke="${color}" stroke-width="2" points="${pts}" stroke-linecap="round" stroke-linejoin="round" />`;
  };

  const ma5Svg = createPolyline(ma5Values, "#f59e0b"); // Yellow MA5
  const ma10Svg = createPolyline(ma10Values, "#ec4899"); // Pink/Purple MA10
  const ma20Svg = createPolyline(ma20Values, "#06b6d4"); // Cyan MA20

  // Volume Bars
  let volSvg = "";
  volumes.forEach((v, i) => {
    const cx = paddingLeft + i * candleStep + candleStep / 2;
    const color = v.isUp ? "#ef4444" : "#10b981";
    const y = getVolY(v.v);
    const h = volTop + volHeight - y;
    volSvg += `<rect x="${cx - candleW / 2}" y="${y}" width="${candleW}" height="${Math.max(1, h)}" fill="${color}" opacity="0.85" />`;
  });

  // MACD Histogram & Lines
  let macdSvg = "";
  const zeroY = macdTop + macdHeight / 2;
  macdSvg += `<line x1="${paddingLeft}" y1="${zeroY}" x2="${width - paddingRight}" y2="${zeroY}" stroke="#475569" stroke-dasharray="3,3" stroke-width="1" />`;

  histValues.forEach((h, i) => {
    const cx = paddingLeft + i * candleStep + candleStep / 2;
    const y = getMacdY(h);
    const color = h >= 0 ? "#ef4444" : "#10b981";
    const barH = Math.max(1, Math.abs(y - zeroY));
    const barTop = h >= 0 ? y : zeroY;
    macdSvg += `<rect x="${cx - candleW / 2.5}" y="${barTop}" width="${candleW / 1.3}" height="${barH}" fill="${color}" opacity="0.8" />`;
  });

  const difPoints = difValues
    .map((v, i) => `${(paddingLeft + i * candleStep + candleStep / 2).toFixed(1)},${getMacdY(v).toFixed(1)}`)
    .join(" ");
  const deaPoints = deaValues
    .map((v, i) => `${(paddingLeft + i * candleStep + candleStep / 2).toFixed(1)},${getMacdY(v).toFixed(1)}`)
    .join(" ");

  macdSvg += `<polyline fill="none" stroke="#f59e0b" stroke-width="1.8" points="${difPoints}" />`;
  macdSvg += `<polyline fill="none" stroke="#3b82f6" stroke-width="1.8" points="${deaPoints}" />`;

  const lastPrice = prices[prices.length - 1].c.toFixed(2);
  const prevPrice = prices[prices.length - 2].c;
  const pctChange = (((prices[prices.length - 1].c - prevPrice) / prevPrice) * 100).toFixed(2);
  const isUpChange = prices[prices.length - 1].c >= prevPrice;

  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #0f172a; font-family: ui-sans-serif, system-ui, sans-serif;">
  <!-- Grid Lines -->
  <line x1="${paddingLeft}" y1="${klineTop}" x2="${width - paddingRight}" y2="${klineTop}" stroke="#1e293b" stroke-width="1" />
  <line x1="${paddingLeft}" y1="${klineTop + klineHeight * 0.5}" x2="${width - paddingRight}" y2="${klineTop + klineHeight * 0.5}" stroke="#1e293b" stroke-width="1" stroke-dasharray="4 4" />
  <line x1="${paddingLeft}" y1="${klineTop + klineHeight}" x2="${width - paddingRight}" y2="${klineTop + klineHeight}" stroke="#334155" stroke-width="1" />
  <line x1="${paddingLeft}" y1="${volTop}" x2="${width - paddingRight}" y2="${volTop}" stroke="#334155" stroke-width="1" />
  <line x1="${paddingLeft}" y1="${volTop + volHeight}" x2="${width - paddingRight}" y2="${volTop + volHeight}" stroke="#334155" stroke-width="1" />
  <line x1="${paddingLeft}" y1="${macdTop}" x2="${width - paddingRight}" y2="${macdTop}" stroke="#334155" stroke-width="1" />

  <!-- Header Info -->
  <text x="${paddingLeft}" y="28" fill="#f8fafc" font-size="16" font-weight="700">${title} (${symbol})</text>
  <text x="240" y="28" fill="#94a3b8" font-size="13">${period}</text>
  <text x="310" y="28" fill="${isUpChange ? '#ef4444' : '#10b981'}" font-size="16" font-weight="700">最新: ¥${lastPrice}</text>
  <text x="440" y="28" fill="${isUpChange ? '#ef4444' : '#10b981'}" font-size="14" font-weight="600">${isUpChange ? '+' : ''}${pctChange}%</text>

  <!-- Legend: MAs -->
  <text x="${paddingLeft}" y="46" fill="#f59e0b" font-size="11" font-weight="600">MA5: ${ma5Values[ma5Values.length - 1].toFixed(2)}</text>
  <text x="${paddingLeft + 90}" y="46" fill="#ec4899" font-size="11" font-weight="600">MA10: ${ma10Values[ma10Values.length - 1].toFixed(2)}</text>
  <text x="${paddingLeft + 190}" y="46" fill="#06b6d4" font-size="11" font-weight="600">MA20: ${ma20Values[ma20Values.length - 1].toFixed(2)}</text>

  <!-- Price Scale Labels -->
  <text x="${paddingLeft - 8}" y="${klineTop + 12}" fill="#64748b" font-size="11" text-anchor="end">${maxP.toFixed(1)}</text>
  <text x="${paddingLeft - 8}" y="${klineTop + klineHeight * 0.5}" fill="#64748b" font-size="11" text-anchor="end">${((maxP + minP) / 2).toFixed(1)}</text>
  <text x="${paddingLeft - 8}" y="${klineTop + klineHeight}" fill="#64748b" font-size="11" text-anchor="end">${minP.toFixed(1)}</text>

  <!-- K-Line & Moving Averages -->
  ${candlesSvg}
  ${ma5Svg}
  ${ma10Svg}
  ${ma20Svg}

  <!-- Volume Subplot -->
  <text x="${paddingLeft}" y="${volTop - 6}" fill="#94a3b8" font-size="11" font-weight="600">VOL (成交量)</text>
  ${volSvg}

  <!-- MACD Subplot -->
  <text x="${paddingLeft}" y="${macdTop - 6}" fill="#94a3b8" font-size="11" font-weight="600">MACD (12, 26, 9)</text>
  <text x="${paddingLeft + 110}" y="${macdTop - 6}" fill="#f59e0b" font-size="11">DIF: ${difValues[difValues.length - 1].toFixed(2)}</text>
  <text x="${paddingLeft + 190}" y="${macdTop - 6}" fill="#3b82f6" font-size="11">DEA: ${deaValues[deaValues.length - 1].toFixed(2)}</text>
  <text x="${paddingLeft + 270}" y="${macdTop - 6}" fill="${histValues[histValues.length - 1] >= 0 ? '#ef4444' : '#10b981'}" font-size="11">MACD: ${(histValues[histValues.length - 1] * 2).toFixed(2)}</text>
  ${macdSvg}
</svg>
`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
}

// 1. 多头排列放量突破型 (Bullish Breakout)
export const SAMPLE_BULLISH_BREAKOUT = {
  id: "sample_bullish",
  name: "中航高科 (600862) - 多头突破",
  tag: "均线多头排列 + MACD水上金叉放量突破",
  description: "MA5>MA10>MA20呈漂亮多头排列发散，放量大阳线站稳突破前高，MACD0轴上方金叉，红柱放大。",
  url: createStockChartSvg({
    title: "中航高科",
    symbol: "600862",
    period: "日K线",
    prices: [
      { o: 21.0, h: 21.5, l: 20.8, c: 21.4 },
      { o: 21.3, h: 21.6, l: 21.1, c: 21.5 },
      { o: 21.5, h: 21.8, l: 21.3, c: 21.7 },
      { o: 21.6, h: 22.0, l: 21.5, c: 21.9 },
      { o: 21.8, h: 22.3, l: 21.7, c: 22.2 },
      { o: 22.1, h: 22.4, l: 21.9, c: 22.0 },
      { o: 22.0, h: 22.5, l: 21.8, c: 22.4 },
      { o: 22.3, h: 22.9, l: 22.2, c: 22.8 },
      { o: 22.7, h: 23.2, l: 22.6, c: 23.1 },
      { o: 23.0, h: 23.3, l: 22.8, c: 22.9 },
      { o: 22.8, h: 23.2, l: 22.7, c: 23.1 },
      { o: 23.2, h: 23.8, l: 23.0, c: 23.6 },
      { o: 23.5, h: 24.2, l: 23.4, c: 24.0 },
      { o: 24.0, h: 24.5, l: 23.8, c: 24.3 },
      { o: 24.2, h: 25.6, l: 24.1, c: 25.4 }, // 大阳线放量突破
    ],
    ma5Values: [21.0, 21.2, 21.4, 21.6, 21.8, 22.0, 22.1, 22.3, 22.5, 22.7, 22.9, 23.1, 23.4, 23.8, 24.3],
    ma10Values: [20.6, 20.8, 21.0, 21.1, 21.3, 21.5, 21.7, 21.9, 22.1, 22.3, 22.4, 22.6, 22.8, 23.1, 23.5],
    ma20Values: [20.0, 20.2, 20.4, 20.6, 20.8, 20.9, 21.1, 21.3, 21.5, 21.7, 21.9, 22.0, 22.2, 22.4, 22.7],
    volumes: [
      { v: 45, isUp: true },
      { v: 40, isUp: true },
      { v: 52, isUp: true },
      { v: 48, isUp: true },
      { v: 65, isUp: true },
      { v: 50, isUp: false },
      { v: 58, isUp: true },
      { v: 72, isUp: true },
      { v: 80, isUp: true },
      { v: 62, isUp: false },
      { v: 55, isUp: true },
      { v: 88, isUp: true },
      { v: 95, isUp: true },
      { v: 90, isUp: true },
      { v: 160, isUp: true },
    ],
    difValues: [0.12, 0.15, 0.19, 0.22, 0.28, 0.31, 0.35, 0.42, 0.49, 0.52, 0.55, 0.63, 0.74, 0.86, 1.05],
    deaValues: [0.08, 0.10, 0.12, 0.15, 0.19, 0.23, 0.27, 0.32, 0.38, 0.42, 0.46, 0.51, 0.58, 0.66, 0.76],
    histValues: [0.04, 0.05, 0.07, 0.07, 0.09, 0.08, 0.08, 0.10, 0.11, 0.10, 0.09, 0.12, 0.16, 0.20, 0.29],
  }),
};

// 2. 底背离金叉超跌反弹型 (Bullish Divergence Rebound)
export const SAMPLE_DIVERGENCE_REBOUND = {
  id: "sample_divergence",
  name: "宁德时代 (300750) - 底背离金叉",
  tag: "二次探底MACD底背离 + 均线低位拐头",
  description: "股价触底二次破新低，但MACD指标绿柱明显萎缩且DIF抬高形成典型双底背离，MA5拐头向上金叉MA10。",
  url: createStockChartSvg({
    title: "宁德时代",
    symbol: "300750",
    period: "日K线",
    prices: [
      { o: 195, h: 198, l: 192, c: 193 },
      { o: 192, h: 194, l: 188, c: 189 },
      { o: 189, h: 191, l: 184, c: 185 },
      { o: 185, h: 188, l: 181, c: 182 }, // 第一波低点
      { o: 183, h: 189, l: 182, c: 187 },
      { o: 187, h: 192, l: 186, c: 190 },
      { o: 190, h: 191, l: 185, c: 186 },
      { o: 186, h: 187, l: 180, c: 181 },
      { o: 180, h: 182, l: 177, c: 178 }, // 破新低
      { o: 178, h: 181, l: 176, c: 177 },
      { o: 177, h: 184, l: 176, c: 183 }, // 探底下影锤子线
      { o: 183, h: 188, l: 182, c: 186 },
      { o: 186, h: 190, l: 185, c: 189 },
      { o: 189, h: 195, l: 188, c: 194 },
      { o: 194, h: 199, l: 193, c: 198 },
    ],
    ma5Values: [197, 194, 191, 187, 185, 186, 186, 184, 182, 180, 180, 182, 185, 188, 192],
    ma10Values: [202, 200, 197, 195, 192, 190, 189, 188, 186, 185, 184, 183, 183, 184, 186],
    ma20Values: [208, 206, 204, 202, 200, 198, 196, 194, 192, 190, 188, 187, 186, 185, 185],
    volumes: [
      { v: 120, isUp: false },
      { v: 140, isUp: false },
      { v: 155, isUp: false },
      { v: 180, isUp: false },
      { v: 90, isUp: true },
      { v: 85, isUp: true },
      { v: 75, isUp: false },
      { v: 80, isUp: false },
      { v: 70, isUp: false },
      { v: 60, isUp: false }, // 地量
      { v: 110, isUp: true },
      { v: 125, isUp: true },
      { v: 130, isUp: true },
      { v: 145, isUp: true },
      { v: 160, isUp: true },
    ],
    difValues: [-3.2, -3.8, -4.5, -5.2, -4.8, -4.2, -4.0, -3.6, -3.2, -3.0, -2.4, -1.6, -0.7, 0.2, 1.1],
    deaValues: [-2.1, -2.6, -3.2, -3.8, -4.1, -4.2, -4.1, -4.0, -3.8, -3.6, -3.3, -2.8, -2.2, -1.6, -0.9],
    histValues: [-1.1, -1.2, -1.3, -1.4, -0.7, 0.0, 0.1, 0.4, 0.6, 0.6, 0.9, 1.2, 1.5, 1.8, 2.0],
  }),
};

// 3. 高位死叉跌破均线减仓型 (High Death Cross & Breakdown)
export const SAMPLE_DEATH_CROSS = {
  id: "sample_death_cross",
  name: "药明康德 (603259) - 高位死叉",
  tag: "均线高位死叉破位 + MACD绿柱放大",
  description: "冲高承压收出长上影，MA5下穿MA10形成高位死叉，MACD高位死叉且红柱翻绿放大，短期承压需防范深调。",
  url: createStockChartSvg({
    title: "药明康德",
    symbol: "603259",
    period: "日K线",
    prices: [
      { o: 62.0, h: 63.5, l: 61.8, c: 63.2 },
      { o: 63.3, h: 64.8, l: 63.0, c: 64.5 },
      { o: 64.6, h: 66.2, l: 64.2, c: 65.8 },
      { o: 66.0, h: 67.5, l: 65.8, c: 67.0 },
      { o: 67.2, h: 69.8, l: 67.0, c: 69.2 }, // 冲高见顶
      { o: 69.0, h: 70.0, l: 67.5, c: 68.0 }, // 冲高回落长上影
      { o: 67.8, h: 68.2, l: 66.0, c: 66.4 },
      { o: 66.2, h: 66.8, l: 65.1, c: 65.5 },
      { o: 65.3, h: 65.8, l: 64.0, c: 64.2 },
      { o: 64.0, h: 64.5, l: 62.8, c: 63.0 },
      { o: 63.0, h: 63.4, l: 61.5, c: 61.8 },
      { o: 61.7, h: 62.0, l: 60.2, c: 60.5 },
      { o: 60.5, h: 61.2, l: 59.5, c: 59.8 },
      { o: 59.8, h: 60.0, l: 58.2, c: 58.6 },
      { o: 58.5, h: 58.8, l: 57.0, c: 57.4 }, // 破位下行
    ],
    ma5Values: [61.8, 62.8, 64.0, 65.5, 66.9, 67.9, 68.1, 67.4, 66.5, 65.4, 64.2, 63.0, 61.9, 60.7, 59.6],
    ma10Values: [60.5, 61.2, 62.0, 63.0, 64.1, 65.3, 66.3, 67.1, 67.6, 67.8, 67.4, 66.7, 65.7, 64.6, 63.3],
    ma20Values: [58.5, 59.0, 59.6, 60.3, 61.1, 62.0, 62.8, 63.7, 64.4, 65.1, 65.6, 66.0, 66.2, 66.1, 65.8],
    volumes: [
      { v: 80, isUp: true },
      { v: 95, isUp: true },
      { v: 110, isUp: true },
      { v: 130, isUp: true },
      { v: 190, isUp: true }, // 天量见顶
      { v: 180, isUp: false },
      { v: 140, isUp: false },
      { v: 125, isUp: false },
      { v: 110, isUp: false },
      { v: 95, isUp: false },
      { v: 105, isUp: false },
      { v: 115, isUp: false },
      { v: 100, isUp: false },
      { v: 120, isUp: false },
      { v: 135, isUp: false },
    ],
    difValues: [1.2, 1.5, 1.9, 2.3, 2.7, 2.5, 2.0, 1.4, 0.7, -0.1, -0.9, -1.6, -2.2, -2.8, -3.5],
    deaValues: [0.8, 1.0, 1.2, 1.5, 1.8, 2.0, 2.1, 2.0, 1.8, 1.4, 0.9, 0.3, -0.3, -0.9, -1.5],
    histValues: [0.4, 0.5, 0.7, 0.8, 0.9, 0.5, -0.1, -0.6, -1.1, -1.5, -1.8, -1.9, -1.9, -1.9, -2.0],
  }),
};

// 4. 箱体震荡均线粘合变盘型 (Consolidation & MA Squeeze)
export const SAMPLE_CONSOLIDATION_SQUEEZE = {
  id: "sample_squeeze",
  name: "比亚迪 (002594) - 均线粘合蓄势",
  tag: "MA5/MA10/MA20三线粘合 + 变盘在即",
  description: "股价长期在245-255元箱体内窄幅振荡，MA5/10/20均线极度粘合收敛，MACD柱线贴近0轴震荡，蓄势待变盘。",
  url: createStockChartSvg({
    title: "比亚迪",
    symbol: "002594",
    period: "日K线",
    prices: [
      { o: 252, h: 254, l: 250, c: 251 },
      { o: 251, h: 253, l: 249, c: 252 },
      { o: 252, h: 255, l: 251, c: 254 },
      { o: 254, h: 255, l: 250, c: 250 },
      { o: 250, h: 253, l: 248, c: 249 },
      { o: 249, h: 252, l: 249, c: 251 },
      { o: 251, h: 254, l: 250, c: 253 },
      { o: 253, h: 254, l: 251, c: 252 },
      { o: 252, h: 253, l: 249, c: 250 },
      { o: 250, h: 252, l: 248, c: 251 },
      { o: 251, h: 253, l: 250, c: 252 },
      { o: 252, h: 254, l: 251, c: 253 },
      { o: 253, h: 254, l: 251, c: 252 },
      { o: 252, h: 253, l: 250, c: 251 },
      { o: 251, h: 255, l: 251, c: 254 },
    ],
    ma5Values: [251.5, 251.8, 252.2, 251.8, 251.2, 251.2, 251.4, 251.5, 251.2, 251.4, 251.6, 251.8, 251.8, 251.8, 252.4],
    ma10Values: [251.0, 251.2, 251.4, 251.5, 251.3, 251.2, 251.3, 251.4, 251.3, 251.3, 251.4, 251.5, 251.6, 251.6, 251.9],
    ma20Values: [250.8, 251.0, 251.1, 251.2, 251.2, 251.1, 251.2, 251.2, 251.2, 251.2, 251.3, 251.3, 251.4, 251.4, 251.5],
    volumes: [
      { v: 55, isUp: false },
      { v: 48, isUp: true },
      { v: 52, isUp: true },
      { v: 50, isUp: false },
      { v: 45, isUp: false },
      { v: 42, isUp: true },
      { v: 46, isUp: true },
      { v: 40, isUp: false },
      { v: 38, isUp: false },
      { v: 35, isUp: true },
      { v: 39, isUp: true },
      { v: 44, isUp: true },
      { v: 41, isUp: false },
      { v: 43, isUp: false },
      { v: 62, isUp: true },
    ],
    difValues: [0.08, 0.06, 0.09, 0.05, 0.01, 0.02, 0.04, 0.03, 0.01, 0.02, 0.03, 0.05, 0.04, 0.03, 0.08],
    deaValues: [0.07, 0.07, 0.07, 0.06, 0.05, 0.04, 0.04, 0.04, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03, 0.04],
    histValues: [0.01, -0.01, 0.02, -0.01, -0.04, -0.02, 0.0, -0.01, -0.02, -0.01, 0.0, 0.02, 0.01, 0.0, 0.04],
  }),
};

// 0. 豪威集团 (603501) - 真实K线走势样本：探底75.85后反弹突破均线 + MACD底背离金叉
export const SAMPLE_HAO_WEI = {
  id: "sample_haowei",
  name: "豪威集团 (603501) - 超跌反弹与MACD底背离金叉",
  tag: "突破MA5/10/20/30 + MACD红柱+0.79 + 探底回升",
  description: "豪威集团在探底75.85低点后强势反弹至83.38(+3.22%)，连续突破5日线(80.49)、10日线(79.37)、20日线(80.60)、30日线(83.14)。副图MACD于0轴下方形成低位金叉(DIF -3.25 / DEA -3.65)，红柱放大至+0.79，上方阻力位看MA60(90.34)。",
  url: createStockChartSvg({
    title: "豪威集团",
    symbol: "603501",
    period: "日K线",
    prices: [
      { o: 88.5, h: 89.2, l: 86.8, c: 87.0 },
      { o: 86.9, h: 87.4, l: 84.5, c: 84.8 },
      { o: 84.6, h: 85.0, l: 82.1, c: 82.3 },
      { o: 82.0, h: 82.8, l: 79.5, c: 79.8 },
      { o: 79.5, h: 80.2, l: 77.0, c: 77.3 },
      { o: 77.0, h: 77.8, l: 75.85, c: 76.2 }, // 探底75.85最低点
      { o: 76.5, h: 78.4, l: 76.0, c: 78.1 }, // 止跌阳线
      { o: 78.0, h: 79.6, l: 77.5, c: 79.2 },
      { o: 79.0, h: 80.5, l: 78.6, c: 80.0 }, // 突破5日线
      { o: 80.1, h: 81.3, l: 79.7, c: 80.8 }, // 突破10日、20日线
      { o: 80.6, h: 82.2, l: 80.3, c: 81.5 },
      { o: 81.55, h: 83.86, l: 81.38, c: 83.38 }, // 最新日大阳放量突破30日线
    ],
    ma5Values: [87.5, 86.2, 84.8, 83.0, 81.2, 79.5, 78.2, 78.0, 78.8, 79.4, 80.1, 80.49],
    ma10Values: [89.0, 88.2, 87.1, 85.8, 84.5, 83.2, 81.8, 80.5, 79.8, 79.5, 79.4, 79.37],
    ma20Values: [92.0, 91.2, 90.1, 88.8, 87.5, 86.0, 84.6, 83.4, 82.2, 81.5, 80.9, 80.60],
    volumes: [
      { v: 120, isUp: false },
      { v: 135, isUp: false },
      { v: 140, isUp: false },
      { v: 110, isUp: false },
      { v: 160, isUp: false },
      { v: 195, isUp: false }, // 恐慌抛售探底75.85
      { v: 130, isUp: true },
      { v: 125, isUp: true },
      { v: 145, isUp: true },
      { v: 160, isUp: true },
      { v: 150, isUp: true },
      { v: 171, isUp: true }, // 放量17.12万手
    ],
    difValues: [-4.8, -4.9, -4.95, -4.8, -4.6, -4.4, -4.1, -3.85, -3.6, -3.45, -3.35, -3.25],
    deaValues: [-4.2, -4.35, -4.5, -4.55, -4.55, -4.5, -4.4, -4.25, -4.1, -3.95, -3.8, -3.65],
    histValues: [-0.6, -0.55, -0.45, -0.25, -0.05, 0.1, 0.3, 0.4, 0.5, 0.5, 0.65, 0.79], // MACD柱翻红且抽长至+0.79
  }),
};

export const ALL_SAMPLES = [
  SAMPLE_HAO_WEI,
  SAMPLE_BULLISH_BREAKOUT,
  SAMPLE_DIVERGENCE_REBOUND,
  SAMPLE_DEATH_CROSS,
  SAMPLE_CONSOLIDATION_SQUEEZE,
];
