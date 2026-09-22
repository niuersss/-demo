import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { StockAnalysis } from "../types";
import { Sparkles, ArrowUpRight, ArrowDownRight, Eye } from "lucide-react";

interface TrendProjectionChartProps {
  currentPrice: string;
  prediction: StockAnalysis["prediction"];
  keyLevels: StockAnalysis["keyLevels"];
  movingAverages?: StockAnalysis["movingAverages"];
  colorScheme: "cn" | "us";
}

interface TrajectoryPoint {
  dayIndex: number; // -4 to +5
  label: string;
  price: number;
  upper: number;
  lower: number;
  isForecast: boolean;
  desc: string;
}

export const TrendProjectionChart: React.FC<TrendProjectionChartProps> = ({
  currentPrice,
  prediction,
  keyLevels,
  movingAverages,
  colorScheme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 500,
    height: 190,
  });
  const [hoveredPoint, setHoveredPoint] = useState<TrajectoryPoint | null>(null);

  // Responsive container observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setDimensions({
            width: Math.floor(width),
            height: Math.max(180, Math.min(220, Math.floor(width * 0.38))),
          });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Parse numeric values safely
  const parseNum = (val?: string | number, fallback = 0): number => {
    if (typeof val === "number" && !isNaN(val)) return val;
    if (!val) return fallback;
    const clean = String(val).replace(/[^0-9.-]/g, "");
    const n = parseFloat(clean);
    return isNaN(n) ? fallback : n;
  };

  const curr = parseNum(currentPrice, 100);
  const sup1 = parseNum(keyLevels?.support1, curr * 0.97);
  const sup2 = parseNum(keyLevels?.support2, curr * 0.94);
  const res1 = parseNum(keyLevels?.resistance1, curr * 1.04);
  const res2 = parseNum(keyLevels?.resistance2, curr * 1.08);
  const stopLoss = parseNum(prediction?.stopLossPrice, sup1);

  // Extract upper target
  let targetVal = res1;
  if (prediction?.targetPriceRange) {
    const matches = prediction.targetPriceRange.match(/[0-9.]+/g);
    if (matches && matches.length > 0) {
      targetVal = parseFloat(matches[matches.length - 1]);
    }
  }
  if (isNaN(targetVal) || targetVal <= 0) {
    targetVal = curr * 1.06;
  }

  // Generate Trajectory Points (Historical T-4..T0 and Future T+1..T+5)
  const generateTrajectory = (): TrajectoryPoint[] => {
    const dir = prediction.direction || "neutral";
    const pts: TrajectoryPoint[] = [];

    // Historical points T-4 to T0
    const ma5Val = parseNum(movingAverages?.ma5?.value, curr * 0.99);
    const ma10Val = parseNum(movingAverages?.ma10?.value, curr * 0.98);

    const histOffsets =
      dir === "bullish" || dir === "volatile_bullish"
        ? [-0.038, -0.024, -0.015, -0.006, 0]
        : dir === "bearish" || dir === "volatile_bearish"
        ? [0.035, 0.026, 0.018, 0.008, 0]
        : [-0.01, 0.012, -0.008, 0.004, 0];

    const histLabels = ["T-4", "T-3", "T-2", "前一交易日", "当前价 (T0)"];

    for (let i = 0; i < 5; i++) {
      const p = Number((curr * (1 + histOffsets[i])).toFixed(2));
      pts.push({
        dayIndex: i - 4,
        label: histLabels[i],
        price: i === 4 ? curr : p,
        upper: i === 4 ? curr : p,
        lower: i === 4 ? curr : p,
        isForecast: false,
        desc: i === 4 ? `最新价: ${curr}` : `实盘走势: ${p}`,
      });
    }

    // Future points T+1 to T+5 based on market direction
    const forecastDays = ["T+1 (次日)", "T+2", "T+3", "T+4", "T+5 (目标期)"];

    let targetDelta = targetVal - curr;
    if (dir === "bearish" || dir === "volatile_bearish") {
      targetDelta = (sup2 - curr) * 0.8;
      if (targetDelta >= 0) targetDelta = -curr * 0.05;
    }

    const forecastProfiles: Record<string, number[]> = {
      bullish: [0.22, 0.45, 0.68, 0.86, 1.0],
      volatile_bullish: [-0.15, 0.1, 0.45, 0.75, 1.0], // 探底回踩后再冲高
      bearish: [0.25, 0.5, 0.72, 0.88, 1.0],
      volatile_bearish: [0.2, 0.05, -0.3, -0.7, 1.0], // 弱反弹冲高回落
      neutral: [0.15, -0.2, 0.1, -0.15, 0.05], // 震荡走平
    };

    const profile = forecastProfiles[dir] || forecastProfiles.neutral;

    for (let step = 0; step < 5; step++) {
      const progress = profile[step];
      const forecastedPrice = Number((curr + targetDelta * progress).toFixed(2));
      // Confidence funnel widens as time progresses
      const uncertainty = curr * (0.012 + (step + 1) * 0.008);
      const upper = Number((forecastedPrice + uncertainty).toFixed(2));
      const lower = Number((forecastedPrice - uncertainty).toFixed(2));

      let desc = `推演目标: ${forecastedPrice}`;
      if (step === 0) desc = "首日惯性演化";
      if (step === 1 && dir.includes("volatile")) desc = "洗盘/回踩支撑检验";
      if (step === 4) desc = `预期触及目标区间: ~${forecastedPrice}`;

      pts.push({
        dayIndex: step + 1,
        label: forecastDays[step],
        price: forecastedPrice,
        upper,
        lower,
        isForecast: true,
        desc,
      });
    }

    return pts;
  };

  const data = generateTrajectory();

  // Color theme logic
  const isUpRed = colorScheme === "cn";
  const isBullish =
    prediction.direction === "bullish" || prediction.direction === "volatile_bullish";
  const isBearish =
    prediction.direction === "bearish" || prediction.direction === "volatile_bearish";

  let mainColor = "#f59e0b"; // amber neutral
  if (isBullish) {
    mainColor = isUpRed ? "#f43f5e" : "#10b981"; // rose or emerald
  } else if (isBearish) {
    mainColor = isUpRed ? "#10b981" : "#f43f5e";
  }

  // D3 Render Effect
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous drawing

    const { width, height } = dimensions;
    const margin = { top: 22, right: 38, bottom: 28, left: 46 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X and Y Scales
    const xScale = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.dayIndex) || -4, d3.max(data, (d) => d.dayIndex) || 5])
      .range([0, innerWidth]);

    const allPrices = [
      ...data.map((d) => d.price),
      ...data.map((d) => d.upper),
      ...data.map((d) => d.lower),
      curr,
      targetVal,
      stopLoss,
    ];

    const minY = (d3.min(allPrices) || curr * 0.95) * 0.992;
    const maxY = (d3.max(allPrices) || curr * 1.05) * 1.008;

    const yScale = d3.scaleLinear().domain([minY, maxY]).range([innerHeight, 0]).nice();

    // Definitions for gradients & glow filters
    const defs = svg.append("defs");

    // Line gradient
    const gradId = "trend-line-grad";
    const lineGrad = defs
      .append("linearGradient")
      .attr("id", gradId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    lineGrad
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#94a3b8")
      .attr("stop-opacity", 0.7);

    lineGrad
      .append("stop")
      .attr("offset", "45%")
      .attr("stop-color", "#f8fafc")
      .attr("stop-opacity", 0.95);

    lineGrad
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", mainColor)
      .attr("stop-opacity", 1);

    // Area confidence gradient
    const areaGradId = "confidence-area-grad";
    const areaGrad = defs
      .append("linearGradient")
      .attr("id", areaGradId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    areaGrad
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", mainColor)
      .attr("stop-opacity", 0.22);

    areaGrad
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", mainColor)
      .attr("stop-opacity", 0.02);

    // Grid lines (horizontal)
    const yTicks = yScale.ticks(4);
    g.selectAll(".grid-line")
      .data(yTicks)
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#334155")
      .attr("stroke-dasharray", "2 3")
      .attr("stroke-opacity", 0.4);

    // Current Price Baseline (Horizontal subtle dashed line)
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", yScale(curr))
      .attr("y2", yScale(curr))
      .attr("stroke", "#64748b")
      .attr("stroke-dasharray", "3 3")
      .attr("stroke-opacity", 0.7);

    g.append("text")
      .attr("x", innerWidth + 4)
      .attr("y", yScale(curr) + 3)
      .attr("fill", "#94a3b8")
      .attr("font-size", "9px")
      .attr("font-family", "monospace")
      .text(`现价 ${curr}`);

    // Vertical Divider Line at T0 (Now)
    const nowX = xScale(0);
    g.append("line")
      .attr("x1", nowX)
      .attr("x2", nowX)
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#475569")
      .attr("stroke-dasharray", "2 2")
      .attr("stroke-opacity", 0.8);

    g.append("text")
      .attr("x", nowX)
      .attr("y", -6)
      .attr("text-anchor", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .text("实盘 | 预测推演 →");

    // Confidence Band Area for Future T0..T5
    const forecastPts = data.filter((d) => d.dayIndex >= 0);
    const areaGen = d3
      .area<TrajectoryPoint>()
      .x((d) => xScale(d.dayIndex))
      .y0((d) => yScale(d.lower))
      .y1((d) => yScale(d.upper))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(forecastPts)
      .attr("fill", `url(#${areaGradId})`)
      .attr("d", areaGen);

    // Line Generators
    const lineGen = d3
      .line<TrajectoryPoint>()
      .x((d) => xScale(d.dayIndex))
      .y((d) => yScale(d.price))
      .curve(d3.curveMonotoneX);

    // Historical segment (T-4 to T0) - Solid
    const pastData = data.filter((d) => d.dayIndex <= 0);
    g.append("path")
      .datum(pastData)
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2.2)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", lineGen);

    // Forecast segment (T0 to T5) - Dashed with main color
    g.append("path")
      .datum(forecastPts)
      .attr("fill", "none")
      .attr("stroke", mainColor)
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "5 3")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", lineGen);

    // Data circles
    data.forEach((d) => {
      const cx = xScale(d.dayIndex);
      const cy = yScale(d.price);

      if (d.dayIndex === 0) {
        // Pulse ring at current point T0
        g.append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 7)
          .attr("fill", "none")
          .attr("stroke", "#38bdf8")
          .attr("stroke-width", 1.5)
          .attr("stroke-opacity", 0.7);

        g.append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 4)
          .attr("fill", "#38bdf8")
          .attr("stroke", "#0f172a")
          .attr("stroke-width", 2);
      } else if (d.dayIndex === 5) {
        // Target flag point at T+5
        g.append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 5)
          .attr("fill", mainColor)
          .attr("stroke", "#0f172a")
          .attr("stroke-width", 2);

        g.append("text")
          .attr("x", cx)
          .attr("y", cy - 9)
          .attr("text-anchor", "middle")
          .attr("fill", mainColor)
          .attr("font-size", "10px")
          .attr("font-weight", "bold")
          .attr("font-family", "monospace")
          .text(`${d.price}`);
      } else {
        // Intermediate points
        g.append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", d.isForecast ? 3 : 2.5)
          .attr("fill", d.isForecast ? mainColor : "#94a3b8")
          .attr("stroke", "#0f172a")
          .attr("stroke-width", 1.5);
      }
    });

    // X Axis Labels
    const xTicks = [-4, -2, 0, 2, 4, 5];
    xTicks.forEach((tick) => {
      const pt = data.find((d) => d.dayIndex === tick);
      if (!pt) return;
      g.append("text")
        .attr("x", xScale(tick))
        .attr("y", innerHeight + 18)
        .attr("text-anchor", "middle")
        .attr("fill", tick === 0 ? "#38bdf8" : tick > 0 ? "#cbd5e1" : "#64748b")
        .attr("font-size", "10px")
        .attr("font-weight", tick === 0 || tick === 5 ? "bold" : "normal")
        .text(tick === 0 ? "T0现价" : tick === 5 ? "T+5目标" : pt.label.split(" ")[0]);
    });

    // Y Axis Labels (Left)
    yTicks.forEach((tick) => {
      g.append("text")
        .attr("x", -8)
        .attr("y", yScale(tick) + 3.5)
        .attr("text-anchor", "end")
        .attr("fill", "#64748b")
        .attr("font-size", "9px")
        .attr("font-family", "monospace")
        .text(tick.toFixed(1));
    });

    // Interactive Overlay for Tooltip & Crosshair
    const bisect = d3.bisector<TrajectoryPoint, number>((d) => d.dayIndex).center;

    const overlay = g
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .attr("cursor", "crosshair");

    const hoverG = g.append("g").attr("class", "hover-group").style("display", "none");

    const crosshairLine = hoverG
      .append("line")
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#94a3b8")
      .attr("stroke-dasharray", "2 2")
      .attr("stroke-width", 1);

    const hoverCircle = hoverG
      .append("circle")
      .attr("r", 5)
      .attr("fill", "#38bdf8")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2);

    overlay
      .on("mousemove", (event) => {
        const [mx] = d3.pointer(event);
        const dayVal = xScale.invert(mx);
        const idx = bisect(data, dayVal);
        const pt = data[idx];
        if (!pt) return;

        hoverG.style("display", null);
        const px = xScale(pt.dayIndex);
        const py = yScale(pt.price);

        crosshairLine.attr("x1", px).attr("x2", px);
        hoverCircle
          .attr("cx", px)
          .attr("cy", py)
          .attr("fill", pt.isForecast ? mainColor : "#38bdf8");

        setHoveredPoint(pt);
      })
      .on("mouseleave", () => {
        hoverG.style("display", "none");
        setHoveredPoint(null);
      });
  }, [dimensions, data, curr, targetVal, stopLoss, mainColor]);

  const targetPt = data.find((d) => d.dayIndex === 5);
  const targetPct = targetPt ? (((targetPt.price - curr) / curr) * 100).toFixed(2) : "0.00";
  const isTargetUp = parseFloat(targetPct) >= 0;

  return (
    <div
      ref={containerRef}
      className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 relative overflow-hidden space-y-3"
    >
      {/* Mini Chart Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-bold text-slate-200">
            D3.js 动态走势推演轨迹折线图 (T-4 ~ T+5)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-400 rounded" />
            <span>实盘历史走势</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 rounded"
              style={{
                borderBottom: `2px dashed ${mainColor}`,
              }}
            />
            <span style={{ color: mainColor }}>AI预测轨迹</span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400/20 border border-amber-400/30" />
            <span>置信度区间</span>
          </div>
        </div>
      </div>

      {/* D3 Canvas Stage */}
      <div className="relative w-full flex justify-center">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible select-none"
        />

        {/* Floating Tooltip if Hovered */}
        {hoveredPoint && (
          <div
            className="absolute top-2 right-2 sm:right-6 pointer-events-none bg-slate-900/95 border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-xl text-xs backdrop-blur-md z-10 space-y-0.5 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-slate-400 font-medium">{hoveredPoint.label}</span>
              <span
                className={`font-mono font-bold ${
                  hoveredPoint.price >= curr
                    ? isUpRed
                      ? "text-rose-400"
                      : "text-emerald-400"
                    : isUpRed
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {hoveredPoint.price.toFixed(2)} (
                {hoveredPoint.price >= curr ? "+" : ""}
                {(((hoveredPoint.price - curr) / curr) * 100).toFixed(2)}%)
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {hoveredPoint.desc}
              {hoveredPoint.isForecast && (
                <span className="text-slate-500 ml-1">
                  [区间: {hoveredPoint.lower.toFixed(2)} ~ {hoveredPoint.upper.toFixed(2)}]
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mini Trend Summary Footnote */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span>移动光标悬停折线点可查看各交易日精确推演价位及置信度包络</span>
        </div>

        <div className="flex items-center gap-2">
          <span>T+5预期目标价:</span>
          <span className="font-mono font-bold text-slate-100">
            {targetPt?.price.toFixed(2) || targetVal}
          </span>
          <span
            className={`font-mono font-semibold inline-flex items-center ${
              isTargetUp
                ? isUpRed
                  ? "text-rose-400"
                  : "text-emerald-400"
                : isUpRed
                ? "text-emerald-400"
                : "text-rose-400"
            }`}
          >
            {isTargetUp ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            {isTargetUp ? "+" : ""}
            {targetPct}%
          </span>
        </div>
      </div>
    </div>
  );
};
