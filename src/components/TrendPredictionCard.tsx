import React from "react";
import {
  Compass,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Sliders,
} from "lucide-react";
import { StockAnalysis } from "../types";
import { TrendProjectionChart } from "./TrendProjectionChart";

interface TrendPredictionCardProps {
  prediction: StockAnalysis["prediction"];
  keyLevels: StockAnalysis["keyLevels"];
  currentPrice: string;
  colorScheme: "cn" | "us";
  movingAverages?: StockAnalysis["movingAverages"];
}

export const TrendPredictionCard: React.FC<TrendPredictionCardProps> = ({
  prediction,
  keyLevels,
  currentPrice,
  colorScheme,
  movingAverages,
}) => {
  const {
    direction,
    directionText,
    confidenceScore,
    shortTermOutlook,
    mediumTermOutlook,
    triggerConditions,
    targetPriceRange,
    stopLossPrice,
  } = prediction;

  const isBullish =
    direction === "bullish" || direction === "volatile_bullish";
  const isBearish =
    direction === "bearish" || direction === "volatile_bearish";

  const getDirectionBadge = () => {
    if (direction === "bullish") {
      return {
        label: directionText || "强烈看多 (突破上行)",
        bg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
        icon: <TrendingUp className="w-5 h-5 text-rose-400" />,
      };
    }
    if (direction === "volatile_bullish") {
      return {
        label: directionText || "震荡偏多 (逢低看涨)",
        bg: "bg-rose-500/10 text-rose-300 border-rose-500/20",
        icon: <TrendingUp className="w-5 h-5 text-rose-300" />,
      };
    }
    if (direction === "bearish") {
      return {
        label: directionText || "偏空承压 (见顶/破位)",
        bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        icon: <TrendingDown className="w-5 h-5 text-emerald-400" />,
      };
    }
    if (direction === "volatile_bearish") {
      return {
        label: directionText || "震荡偏空 (反弹减仓)",
        bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        icon: <TrendingDown className="w-5 h-5 text-emerald-300" />,
      };
    }
    return {
      label: directionText || "窄幅震荡 (蓄势盘整)",
      bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      icon: <Activity className="w-5 h-5 text-amber-400" />,
    };
  };

  const dirBadge = getDirectionBadge();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
              行情走势推演与置信度预测
            </h3>
            <p className="text-xs text-slate-400">结合均线系统、MACD动能及量价配合综合研判</p>
          </div>
        </div>

        {/* Confidence pill */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
          <span className="text-xs text-slate-400">模型研判置信度:</span>
          <span className="text-sm font-bold text-amber-400 font-mono">
            {confidenceScore}%
          </span>
        </div>
      </div>

      {/* Main direction banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${dirBadge.bg}`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            {dirBadge.icon}
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">综合走势倾向研判</div>
            <div className="text-lg font-bold tracking-tight">
              {dirBadge.label}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 mr-1.5">短期目标区间:</span>
            <span className="font-bold font-mono text-amber-300">
              {targetPriceRange || "详见研判"}
            </span>
          </div>
          <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 mr-1.5">防守止损位:</span>
            <span className="font-bold font-mono text-rose-400">
              {stopLossPrice || "破MA10止损"}
            </span>
          </div>
        </div>
      </div>

      {/* D3.js Powered Dynamic Trend Projection Chart */}
      <TrendProjectionChart
        currentPrice={currentPrice}
        prediction={prediction}
        keyLevels={keyLevels}
        movingAverages={movingAverages}
        colorScheme={colorScheme}
      />

      {/* Short & Medium Outlook */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            短期走势推演 (1-5个交易日)
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {shortTermOutlook}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            中期格局推演 (1-4周波段)
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {mediumTermOutlook}
          </p>
        </div>
      </div>

      {/* Support & Resistance Price Ladder */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-200">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            关键技术位价格阶梯 (支撑与压力)
          </span>
          <span className="text-slate-500 font-mono">最新参考: {currentPrice}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <div className="text-[11px] text-slate-400">强阻力位 (压力2)</div>
            <div className="font-bold font-mono text-rose-300 text-sm mt-0.5">
              {keyLevels.resistance2 || "--"}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10">
            <div className="text-[11px] text-slate-400">第一压力位 (阻力1)</div>
            <div className="font-bold font-mono text-rose-400 text-sm mt-0.5">
              {keyLevels.resistance1 || "--"}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
            <div className="text-[11px] text-slate-400">第一支撑位 (支撑1)</div>
            <div className="font-bold font-mono text-emerald-400 text-sm mt-0.5">
              {keyLevels.support1 || "--"}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-[11px] text-slate-400">强防守位 (支撑2)</div>
            <div className="font-bold font-mono text-emerald-300 text-sm mt-0.5">
              {keyLevels.support2 || "--"}
            </div>
          </div>
        </div>
      </div>

      {/* Trigger Conditions */}
      {triggerConditions && triggerConditions.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
          <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            关键变盘触发信号与应对要点：
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {triggerConditions.map((cond, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>{cond}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
