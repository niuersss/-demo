import React, { useState } from "react";
import { Maximize2, X, Tag, Calendar, DollarSign, Layers } from "lucide-react";
import { StockAnalysis } from "../types";

interface ImagePreviewCardProps {
  imageUrl: string;
  analysis: StockAnalysis;
  colorScheme: "cn" | "us";
}

export const ImagePreviewCard: React.FC<ImagePreviewCardProps> = ({
  imageUrl,
  analysis,
  colorScheme,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  const isUp =
    analysis.priceChange.startsWith("+") ||
    !analysis.priceChange.startsWith("-");
  const changeColorClass =
    colorScheme === "cn"
      ? isUp
        ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      : isUp
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      : "text-rose-400 bg-rose-500/10 border-rose-500/30";

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
        {/* Header summary bar */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 border border-slate-700 font-bold text-sm">
              K线
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base">
                  {analysis.stockName || "股票走势图"}
                </h3>
                {analysis.stockCode && (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                    {analysis.stockCode}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {analysis.timeframe || "日K线"}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                {analysis.chartDescription || "截图解析特征"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-xs text-slate-400">最新收盘/现价</div>
              <div className="text-lg font-bold font-mono text-slate-100">
                {analysis.currentPrice || "--"}
              </div>
            </div>
            {analysis.priceChange && (
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border font-mono ${changeColorClass}`}
              >
                {analysis.priceChange}
              </span>
            )}
          </div>
        </div>

        {/* Image Preview with click to zoom */}
        <div className="relative group bg-slate-950 p-2 flex items-center justify-center min-h-[260px] max-h-[380px] overflow-hidden">
          <img
            src={imageUrl}
            alt="Stock Chart Preview"
            className="w-full h-full max-h-[360px] object-contain rounded-lg border border-slate-800/80"
          />

          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur transition-all shadow-md group-hover:opacity-100 opacity-80"
            title="放大查看高清原图"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded-md bg-slate-900/90 text-[11px] text-amber-400 border border-slate-700/80 backdrop-blur flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              已提取 MA5/10/20/60 均线
            </span>
            <span className="px-2 py-1 rounded-md bg-slate-900/90 text-[11px] text-indigo-400 border border-slate-700/80 backdrop-blur flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
              已识别 MACD 动能指标
            </span>
          </div>
        </div>
      </div>

      {/* Modal Zoom */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100">
                  {analysis.stockName} ({analysis.stockCode || "走势图"}) 原图解析视图
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {analysis.timeframe}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto py-3 flex items-center justify-center">
              <img
                src={imageUrl}
                alt="Full preview"
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
