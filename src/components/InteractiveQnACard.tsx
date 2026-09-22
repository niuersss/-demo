import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { StockAnalysis, ChatMessage } from "../types";

interface InteractiveQnACardProps {
  analysis: StockAnalysis;
}

export const InteractiveQnACard: React.FC<InteractiveQnACardProps> = ({
  analysis,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const quickQuestions = [
    "如果明天低开跌破5日线，该如何应对？",
    "结合MACD形态，何时可能形成最稳妥的买点？",
    "当前形态的最佳止损位和防守线在什么位置？",
    "适合做短线日内T+0，还是中线波段持股？",
  ];

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || isAsking) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: q,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setIsAsking(true);

    try {
      const res = await fetch("/api/stock-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          analysisContext: analysis,
          history: messages.slice(-4),
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || "解答生成失败");
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `解答暂不可用：${err.message || "请稍后重试"}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
              针对该截图进行追问分析 (AI 量化操盘顾问)
            </h3>
            <p className="text-xs text-slate-400">结合提取的MA5/10/20和MACD指标，解答个性化操作疑问</p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          上下文感知中
        </span>
      </div>

      {/* Suggested Quick Questions */}
      <div className="space-y-1.5">
        <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>点击常见疑难直接提问：</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isAsking}
              onClick={() => handleSend(q)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-cyan-300 border border-slate-700/80 transition-all text-left disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages area if any */}
      {messages.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 ml-6"
                  : "bg-slate-950/80 border border-slate-800 text-slate-200 mr-4"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-slate-400">
                {m.role === "user" ? (
                  <>
                    <User className="w-3 h-3 text-cyan-400" />
                    <span>您的提问</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 text-amber-400" />
                    <span>AI 量化分析建议</span>
                  </>
                )}
              </div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}

          {isAsking && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>AI 顾问正在结合均线与MACD形态推理回复...</span>
            </div>
          )}
        </div>
      )}

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="输入您的疑问，如：如果下周一大盘下跌，它会如何表现？"
          disabled={isAsking}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/70 transition"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || isAsking}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-500/10"
        >
          {isAsking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>咨询</span>
        </button>
      </form>
    </div>
  );
};
