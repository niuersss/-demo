import React from "react";
import { History, Trash2, ArrowUpRight, ArrowDownRight, Minus, Clock } from "lucide-react";
import { AnalysisRecord } from "../types";

interface AnalysisHistoryProps {
  records: AnalysisRecord[];
  currentRecordId: string | null;
  onSelectRecord: (record: AnalysisRecord) => void;
  onClearHistory: () => void;
  colorScheme: "cn" | "us";
}

export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  records,
  currentRecordId,
  onSelectRecord,
  onClearHistory,
  colorScheme,
}) => {
  if (records.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-slate-200 font-bold text-sm">
          <History className="w-4 h-4 text-amber-400" />
          <span>历史分析记录 ({records.length})</span>
        </div>
        <button
          type="button"
          onClick={onClearHistory}
          className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition"
          title="清空历史记录"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>清空</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {records.map((rec) => {
          const isSelected = rec.id === currentRecordId;
          const isBull =
            rec.analysis.prediction.direction === "bullish" ||
            rec.analysis.prediction.direction === "volatile_bullish";

          const dirClass = isBull
            ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
            : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

          return (
            <button
              key={rec.id}
              type="button"
              onClick={() => onSelectRecord(rec)}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                isSelected
                  ? "border-amber-400/80 bg-amber-500/10 shadow-sm"
                  : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40"
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-800 flex items-center justify-center">
                <img
                  src={rec.imageUrl}
                  alt={rec.fileName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="font-bold text-slate-200 text-xs truncate">
                    {rec.analysis.stockName || rec.fileName}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${dirClass}`}
                  >
                    {isBull ? "看涨" : "承压"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span className="font-mono text-slate-300">
                    ¥{rec.analysis.currentPrice || "--"}
                  </span>
                  <span className="flex items-center gap-0.5 text-slate-500 text-[10px]">
                    <Clock className="w-3 h-3" />
                    {new Date(rec.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
