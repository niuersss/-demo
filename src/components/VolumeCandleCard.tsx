import React from "react";
import { CandlestickChart, BarChart, Layers } from "lucide-react";
import { StockAnalysis } from "../types";

interface VolumeCandleCardProps {
  volumeAndCandle: StockAnalysis["volumeAndCandle"];
}

export const VolumeCandleCard: React.FC<VolumeCandleCardProps> = ({
  volumeAndCandle,
}) => {
  const { candlePattern, volumeStatus, volumeAnalysis } = volumeAndCandle;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CandlestickChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
              K线形态与量价关系 (Volume)
            </h3>
            <p className="text-xs text-slate-400">研判实体K线组合与成交量放大萎缩异动</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-400">
          <span>量能: {volumeStatus || "正常"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <div className="text-xs text-slate-400 font-medium">识别关键K线形态</div>
          <div className="text-sm font-bold text-slate-200">
            {candlePattern || "标准K线组合"}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <div className="text-xs text-slate-400 font-medium">量价配合特征</div>
          <div className="text-sm font-bold text-slate-200">
            {volumeStatus || "温和放量配合"}
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-1.5">
        <div className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs text-emerald-300">
          <BarChart className="w-3.5 h-3.5" />
          量价协同解读：
        </div>
        <p>{volumeAnalysis}</p>
      </div>
    </div>
  );
};
