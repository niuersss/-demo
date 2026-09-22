import React, { useState } from "react";
import {
  Briefcase,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Shield,
} from "lucide-react";
import { StockAnalysis } from "../types";

interface TradingStrategyCardProps {
  tradingStrategy: StockAnalysis["tradingStrategy"];
  disclaimer: string;
  fullAnalysis: StockAnalysis;
}

export const TradingStrategyCard: React.FC<TradingStrategyCardProps> = ({
  tradingStrategy,
  disclaimer,
  fullAnalysis,
}) => {
  const { action, actionText, suggestedPosition, operationalTips, riskWarnings } =
    tradingStrategy;
  const [copied, setCopied] = useState(false);

  const getActionColor = () => {
    switch (action) {
      case "buy":
      case "add_position":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "hold":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "reduce_position":
      case "sell":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const handleCopyReport = () => {
    const reportText = `
【股票技术面深度研判报告 - AI Vision】
标的：${fullAnalysis.stockName} (${fullAnalysis.stockCode || "走势图"}) | 周期：${fullAnalysis.timeframe}
最新参考价：${fullAnalysis.currentPrice} (${fullAnalysis.priceChange})

一、均线系统 (MA)
- MA5: ${fullAnalysis.movingAverages.ma5.value} (${fullAnalysis.movingAverages.ma5.status})
- MA10: ${fullAnalysis.movingAverages.ma10.value} (${fullAnalysis.movingAverages.ma10.status})
- MA20: ${fullAnalysis.movingAverages.ma20.value} (${fullAnalysis.movingAverages.ma20.status})
- 均线排列：${fullAnalysis.movingAverages.alignmentLabel}
- 解析：${fullAnalysis.movingAverages.maAnalysis}

二、MACD 动能指标
- DIF: ${fullAnalysis.macd.dif} | DEA: ${fullAnalysis.macd.dea} | 柱体: ${fullAnalysis.macd.histogram}
- 信号：${fullAnalysis.macd.signalText}
- 解析：${fullAnalysis.macd.macdAnalysis}

三、关键技术位
- 第一压力：${fullAnalysis.keyLevels.resistance1} | 强压力：${fullAnalysis.keyLevels.resistance2}
- 第一支撑：${fullAnalysis.keyLevels.support1} | 强支撑：${fullAnalysis.keyLevels.support2}

四、走势推演与操作策略
- 预测方向：${fullAnalysis.prediction.directionText} (置信度 ${fullAnalysis.prediction.confidenceScore}%)
- 短期预测：${fullAnalysis.prediction.shortTermOutlook}
- 目标区间：${fullAnalysis.prediction.targetPriceRange} | 防守止损：${fullAnalysis.prediction.stopLossPrice}
- 建议动作：${actionText} | 建议仓位：${suggestedPosition}
- 风险提示：${riskWarnings?.join("；")}

(本研判由AI辅助技术面推演，不构成投资承诺，股市有风险，入市需谨慎)
    `.trim();

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
              实战操盘策略与资金风控
            </h3>
            <p className="text-xs text-slate-400">针对当前形态量身定制的仓位管理与操盘纪律</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">已复制报告</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>复制研报</span>
            </>
          )}
        </button>
      </div>

      {/* Action and Position */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className={`p-4 rounded-xl border flex items-center justify-between ${getActionColor()}`}>
          <div>
            <div className="text-xs opacity-80 font-medium">推荐操盘动作</div>
            <div className="text-lg font-bold mt-0.5">{actionText}</div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-900/60 font-semibold">
            {action.toUpperCase()}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">建议仓位配比</div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
              {suggestedPosition}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
            <PieChart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Operational Tips */}
      {operationalTips && operationalTips.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            实战操盘纪律与执行要点：
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs text-slate-300">
            {operationalTips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50">
                <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Warnings */}
      {riskWarnings && riskWarnings.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            风险警示与潜在隐患：
          </div>
          <ul className="space-y-1 text-xs text-slate-300">
            {riskWarnings.map((w, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-400">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-800/80 pt-3 flex items-start gap-1.5">
        <Shield className="w-3.5 h-3.5 flex-shrink-0 text-slate-500 mt-0.5" />
        <span>
          {disclaimer ||
            "免责声明：本工具基于计算机视觉与人工智能算法对K线截图进行技术形态推演，分析结果仅供学习研究参考，不构成任何具体的投资建议与收益承诺。证券市场有风险，投资决策需审慎独立。"}
        </span>
      </div>
    </div>
  );
};
