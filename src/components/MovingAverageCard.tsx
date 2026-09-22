import React from "react";
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { StockAnalysis, MovingAverageItem } from "../types";

interface MovingAverageCardProps {
  movingAverages: StockAnalysis["movingAverages"];
  currentPrice: string;
}

export const MovingAverageCard: React.FC<MovingAverageCardProps> = ({
  movingAverages,
  currentPrice: _currentPrice,
}) => {
  const {
    ma5,
    ma10,
    ma20,
    ma30,
    ma60,
    ma120,
    ma250,
    maAlignment,
    alignmentLabel,
    maAnalysis,
  } = movingAverages;

  const renderTrendIcon = (trend?: MovingAverageItem["trend"]) => {
    if (trend === "up") {
      return (
        <span className="inline-flex items-center text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> 上扬
        </span>
      );
    }
    if (trend === "down") {
      return (
        <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> 下倾
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
        <Minus className="w-3.5 h-3.5 mr-0.5" /> 走平
      </span>
    );
  };

  const getAlignmentBadge = () => {
    switch (maAlignment) {
      case "bullish":
        return {
          label: alignmentLabel || "均线多头排列",
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          icon: <CheckCircle2 className="w-4 h-4 text-rose-400" />,
        };
      case "bearish":
        return {
          label: alignmentLabel || "均线空头排列",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: <AlertTriangle className="w-4 h-4 text-emerald-400" />,
        };
      case "entangled":
        return {
          label: alignmentLabel || "均线粘合震荡",
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: <Activity className="w-4 h-4 text-amber-400" />,
        };
      default:
        return {
          label: alignmentLabel || "均线交叉发散",
          bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
          icon: <Info className="w-4 h-4 text-indigo-400" />,
        };
    }
  };

  const alignBadge = getAlignmentBadge();

  // Build the list of active moving averages
  const maList: {
    key: string;
    title: string;
    subtitle: string;
    color: string;
    dotColor: string;
    item?: MovingAverageItem;
  }[] = [
    {
      key: "ma5",
      title: "5日均线 (MA5)",
      subtitle: "超短攻击线",
      color: "text-amber-400",
      dotColor: "bg-amber-400 shadow-amber-400/50",
      item: ma5,
    },
    {
      key: "ma10",
      title: "10日均线 (MA10)",
      subtitle: "短期防守线",
      color: "text-pink-400",
      dotColor: "bg-pink-400 shadow-pink-400/50",
      item: ma10,
    },
    {
      key: "ma20",
      title: "20日均线 (MA20)",
      subtitle: "月度生命线",
      color: "text-cyan-400",
      dotColor: "bg-cyan-400 shadow-cyan-400/50",
      item: ma20,
    },
  ];

  if (ma30) {
    maList.push({
      key: "ma30",
      title: "30日均线 (MA30)",
      subtitle: "中期生命线",
      color: "text-emerald-400",
      dotColor: "bg-emerald-400 shadow-emerald-400/50",
      item: ma30,
    });
  }

  if (ma60) {
    maList.push({
      key: "ma60",
      title: "60日均线 (MA60)",
      subtitle: "季线决策线",
      color: "text-indigo-400",
      dotColor: "bg-indigo-400 shadow-indigo-400/50",
      item: ma60,
    });
  }

  if (ma120) {
    maList.push({
      key: "ma120",
      title: "120日均线 (MA120)",
      subtitle: "半年趋势线",
      color: "text-purple-400",
      dotColor: "bg-purple-400 shadow-purple-400/50",
      item: ma120,
    });
  }

  if (ma250) {
    maList.push({
      key: "ma250",
      title: "250日均线 (MA250)",
      subtitle: "牛熊分界年线",
      color: "text-rose-400",
      dotColor: "bg-rose-400 shadow-rose-400/50",
      item: ma250,
    });
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
              均线系统数据解析 (MA)
            </h3>
            <p className="text-xs text-slate-400">已从截图中识别并提取关键均线数值与拐点</p>
          </div>
        </div>

        {/* Alignment badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${alignBadge.bg}`}
        >
          {alignBadge.icon}
          <span>{alignBadge.label}</span>
        </div>
      </div>

      {/* MA Cards Grid */}
      <div
        className={`grid gap-3 ${
          maList.length <= 4
            ? "grid-cols-2 sm:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        }`}
      >
        {maList.map((m) => (
          <div
            key={m.key}
            className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${m.dotColor}`} />
                <span className="text-xs font-bold text-slate-200">{m.title}</span>
              </div>
              {renderTrendIcon(m.item?.trend)}
            </div>
            <div>
              <div className={`text-xl font-bold font-mono ${m.color}`}>
                {m.item?.value || "--"}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                {m.item?.status || m.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MA Analysis Details Text */}
      <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-1.5">
        <div className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs text-amber-300">
          <Info className="w-3.5 h-3.5" />
          均线形态研判要点：
        </div>
        <p>{maAnalysis}</p>
      </div>
    </div>
  );
};
