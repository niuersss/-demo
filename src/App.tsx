import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { UploadSection } from "./components/UploadSection";
import { ImagePreviewCard } from "./components/ImagePreviewCard";
import { MovingAverageCard } from "./components/MovingAverageCard";
import { MacdAnalysisCard } from "./components/MacdAnalysisCard";
import { VolumeCandleCard } from "./components/VolumeCandleCard";
import { TrendPredictionCard } from "./components/TrendPredictionCard";
import { TradingStrategyCard } from "./components/TradingStrategyCard";
import { InteractiveQnACard } from "./components/InteractiveQnACard";
import { AnalysisHistory } from "./components/AnalysisHistory";
import { StockAnalysis, AnalysisRecord } from "./types";
import { AlertCircle, ChevronDown, ChevronUp, Sparkles, TrendingUp } from "lucide-react";
import { SAMPLE_BULLISH_BREAKOUT } from "./data/sampleCharts";

export default function App() {
  const [colorScheme, setColorScheme] = useState<"cn" | "us">("cn");
  const [currentAnalysis, setCurrentAnalysis] = useState<StockAnalysis | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUploadPanel, setShowUploadPanel] = useState<boolean>(true);

  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem("stock_analysis_records");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecords(parsed);
          // Set first record as initial if available
          setCurrentAnalysis(parsed[0].analysis);
          setCurrentImage(parsed[0].imageUrl);
          setCurrentFileName(parsed[0].fileName);
          setCurrentRecordId(parsed[0].id);
          setShowUploadPanel(false);
        }
      }
    } catch (e) {
      console.warn("Failed to load records from storage", e);
    }
  }, []);

  // Global paste handler on App level so Ctrl+V works anytime anywhere
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (isLoading) return;

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // 1. Try items
      if (clipboardData.items) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.type.indexOf("image") !== -1) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              processFile(file);
              return;
            }
          }
        }
      }

      // 2. Try files
      if (clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (file.type.startsWith("image/")) {
            e.preventDefault();
            processFile(file);
            return;
          }
        }
      }
    };

    const processFile = (file: File) => {
      setErrorMessage(null);
      if (!file.type.startsWith("image/")) {
        setErrorMessage("请粘贴或上传有效的股票走势截图（支持 PNG、JPG、JPEG 等）");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          handleAnalyze(result, file.name || `剪贴板截图_${new Date().toLocaleTimeString()}.png`);
        }
      };
      reader.onerror = () => {
        setErrorMessage("读取剪贴板图片失败，请重试");
      };
      reader.readAsDataURL(file);
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [isLoading]);

  const handleAnalyze = async (imageData: string, fileName: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentImage(imageData);
    setCurrentFileName(fileName);

    // Dynamic friendly progress updates
    setLoadingStep("1/4 正在高精度扫描K线走势与价格坐标系统...");
    const timer1 = setTimeout(() => {
      setLoadingStep("2/4 正在提取MA5、MA10、MA20均线数值与拐头斜率...");
    }, 1200);
    const timer2 = setTimeout(() => {
      setLoadingStep("3/4 正在测算MACD快慢线、红绿柱能量及顶底背离金叉信号...");
    }, 2400);
    const timer3 = setTimeout(() => {
      setLoadingStep("4/4 正在结合量价形态综合推演多空走势与操盘风控策略...");
    }, 3800);

    try {
      let mimeType = "image/png";
      const match = imageData.match(/^data:([a-zA-Z0-9+/.-]+);base64,/);
      if (match && match[1]) {
        mimeType = match[1];
      }

      const response = await fetch("/api/analyze-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          mimeType,
          colorScheme,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      const data = await response.json();
      if (!response.ok || !data.success || !data.analysis) {
        throw new Error(data.error || "分析失败，请确认图片包含清晰的K线及均线图例");
      }

      const newAnalysis: StockAnalysis = data.analysis;
      const newRecordId = Date.now().toString();
      const newRecord: AnalysisRecord = {
        id: newRecordId,
        timestamp: Date.now(),
        imageUrl: imageData,
        fileName,
        analysis: newAnalysis,
      };

      setCurrentAnalysis(newAnalysis);
      setCurrentRecordId(newRecordId);
      setShowUploadPanel(false);

      setRecords((prev) => {
        const updated = [newRecord, ...prev.filter((r) => r.fileName !== fileName)].slice(0, 10);
        try {
          localStorage.setItem("stock_analysis_records", JSON.stringify(updated));
        } catch (e) {
          console.warn("LocalStorage save error", e);
        }
        return updated;
      });
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setErrorMessage(err.message || "请求失败，请稍后重试");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleSelectRecord = (record: AnalysisRecord) => {
    setCurrentAnalysis(record.analysis);
    setCurrentImage(record.imageUrl);
    setCurrentFileName(record.fileName);
    setCurrentRecordId(record.id);
    setShowUploadPanel(false);
  };

  const handleClearHistory = () => {
    setRecords([]);
    try {
      localStorage.removeItem("stock_analysis_records");
    } catch (e) {
      // ignore
    }
  };

  const handleReset = () => {
    setCurrentAnalysis(null);
    setCurrentImage(null);
    setCurrentFileName("");
    setCurrentRecordId(null);
    setShowUploadPanel(true);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation */}
      <Header
        colorScheme={colorScheme}
        setColorScheme={setColorScheme}
        onReset={handleReset}
        hasCurrentAnalysis={!!currentAnalysis}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error notification if any */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2 ml-3">
              {currentImage && (
                <button
                  type="button"
                  onClick={() =>
                    handleAnalyze(
                      currentImage,
                      currentFileName || "重新分析截图.png"
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs text-rose-200 border border-rose-500/30 transition"
                >
                  点击重试
                </button>
              )}
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs text-rose-400 hover:text-white underline"
              >
                忽略
              </button>
            </div>
          </div>
        )}

        {/* Upload section (Full or collapsible toggle when analysis is active) */}
        {(!currentAnalysis || showUploadPanel) && (
          <div className="space-y-4">
            {currentAnalysis && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">上传新截图分析</span>
                <button
                  type="button"
                  onClick={() => setShowUploadPanel(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <ChevronUp className="w-4 h-4" /> 收起上传面板
                </button>
              </div>
            )}
            <UploadSection
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              loadingStep={loadingStep}
            />
          </div>
        )}

        {/* Collapsed re-upload bar */}
        {currentAnalysis && !showUploadPanel && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>正在查看：</span>
              <strong className="text-slate-200">{currentAnalysis.stockName}</strong>
              <span className="font-mono text-slate-400">({currentAnalysis.stockCode || currentFileName})</span>
              <span className="hidden sm:inline-block text-slate-500 ml-2">| 可随时按 Ctrl+V 粘贴新截图直接分析</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowUploadPanel(true)}
                className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
              >
                <span>展开上传面板</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Analysis Display Panel */}
        {currentAnalysis && currentImage && (
          <div className="space-y-6">
            {/* Top Grid: Image Preview & Trend Prediction */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 flex flex-col">
                <ImagePreviewCard
                  imageUrl={currentImage}
                  analysis={currentAnalysis}
                  colorScheme={colorScheme}
                />
              </div>
              <div className="lg:col-span-7 flex flex-col">
                <TrendPredictionCard
                  prediction={currentAnalysis.prediction}
                  keyLevels={currentAnalysis.keyLevels}
                  currentPrice={currentAnalysis.currentPrice}
                  colorScheme={colorScheme}
                  movingAverages={currentAnalysis.movingAverages}
                />
              </div>
            </div>

            {/* Core Metrics: Moving Averages (MA5, MA10, MA20, MA60) + MACD */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MovingAverageCard
                movingAverages={currentAnalysis.movingAverages}
                currentPrice={currentAnalysis.currentPrice}
              />
              <MacdAnalysisCard
                macd={currentAnalysis.macd}
                colorScheme={colorScheme}
              />
            </div>

            {/* Volume & Strategy Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VolumeCandleCard
                volumeAndCandle={currentAnalysis.volumeAndCandle}
              />
              <TradingStrategyCard
                tradingStrategy={currentAnalysis.tradingStrategy}
                disclaimer={currentAnalysis.disclaimer}
                fullAnalysis={currentAnalysis}
              />
            </div>

            {/* Interactive Q&A for the Chart */}
            <InteractiveQnACard analysis={currentAnalysis} />
          </div>
        )}

        {/* Recent Analysis History Records */}
        <AnalysisHistory
          records={records}
          currentRecordId={currentRecordId}
          onSelectRecord={handleSelectRecord}
          onClearHistory={handleClearHistory}
          colorScheme={colorScheme}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>股票K线走势与均线指标AI量化解析工具 · 基于Gemini视觉大模型深度驱动</p>
      </footer>
    </div>
  );
}
