import React from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  GitCommit,
  Zap,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
} from "lucide-react";
import { StockAnalysis } from "../types";

interface MacdAnalysisCardProps {
  macd: StockAnalysis["macd"];
  colorScheme: "cn" | "us";
}

export const MacdAnalysisCard: React.FC<MacdAnalysisCardProps> = ({
  macd,
  colorScheme,
}) => {
  const { dif, dea, histogram, signal, signalText, macdAnalysis } = macd;

  const getSignalBadge = () => {
    switch (signal) {
      case "golden_cross":
        return {
          label: signalText || "MACD金叉买点",
          bg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
          icon: <TrendingUp className="w-4 h-4 text-rose-400" />,
        };
      case "bullish_divergence":
        return {
          label: signalText || "MACD底背离信号",
          bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          icon: <Sparkles className="w-4 h-4 text-amber-400" />,
        };
      case "death_cross":
        return {
          label: signalText || "MACD死叉风险",
          bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          icon: <TrendingDown className="w-4 h-4 text-emerald-400" />,
        };
      case "bearish_divergence":
        return {
          label: signalText || "MACD顶背离预警",
          bg: "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse",
          icon: <AlertOctagon className="w-4 h-4 text-rose-400" />,
        };
      case "zero_axis_rebound":
        return {
          label: signalText || "0轴空中加油",
          bg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
          icon: <Zap className="w-4 h-4 text-indigo-400" />,
        };
      default:
        return {
          label: signalText || "指标常规波动",
          bg: "bg-slate-800 text-slate-300 border-slate-700",
          icon: <GitCommit className="w-4 h-4 text-slate-400" />,
        };
    }
  };

  const signalBadge = getSignalBadge();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
              MACD 动能与形态深度分析
            </h3>
            <p className="text-xs text-slate-400">研判快慢线交叉形态、红绿柱能量及背离结构</p>
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${signalBadge.bg}`}
        >
          {signalBadge.icon}
          <span>{signalBadge.label}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* DIF */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 font-medium">快线 (DIF 12日EMA差)</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-400">
            {dif || "--"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">反应股价短期变动速度</div>
        </div>

        {/* DEA */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 font-medium">慢线 (DEA 9日平滑)</span>
            <span className="w-2 h-2 rounded-full bg-blue-400" />
          </div>
          <div className="text-lg font-bold font-mono text-blue-400">
            {dea || "--"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">中期趋势基准参照线</div>
        </div>

        {/* Histogram */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 font-medium">能量柱 (Histogram)</span>
            <span className="w-2 h-2 rounded-full bg-purple-400" />
          </div>
          <div className="text-base font-bold text-slate-200 truncate">
            {histogram || "--"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">动能强弱与多空动势</div>
        </div>
      </div>

      {/* Narrative Analysis */}
      <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-1.5">
        <div className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs text-indigo-300">
          <Zap className="w-3.5 h-3.5" />
          MACD 动能综合推演：
        </div>
        <p>{macdAnalysis}</p>
      </div>
    </div>
  );
};
