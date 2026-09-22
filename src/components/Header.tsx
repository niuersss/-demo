import React from "react";
import { TrendingUp, BarChart2, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";

interface HeaderProps {
  colorScheme: "cn" | "us";
  setColorScheme: (scheme: "cn" | "us") => void;
  onReset: () => void;
  hasCurrentAnalysis: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  colorScheme,
  setColorScheme,
  onReset,
  hasCurrentAnalysis,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 p-0.5 shadow-lg shadow-rose-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                股票K线与均线走势AI预测器
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                多模态视觉量化
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              截图识别 5日/10日/20日/60日均线数值 · MACD背离金叉研判 · 预测走势策略
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Market Color Mode Toggle */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/80 text-xs">
            <button
              type="button"
              onClick={() => setColorScheme("cn")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                colorScheme === "cn"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="A股习惯：红涨绿跌"
            >
              A股 (红涨绿跌)
            </button>
            <button
              type="button"
              onClick={() => setColorScheme("us")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                colorScheme === "us"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="国际/美股习惯：绿涨红跌"
            >
              国际 (绿涨红跌)
            </button>
          </div>

          {hasCurrentAnalysis && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="分析新截图"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">新分析</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
