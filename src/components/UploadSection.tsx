import React, { useRef, useState, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Clipboard,
  AlertCircle,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { ALL_SAMPLES } from "../data/sampleCharts";

interface UploadSectionProps {
  onAnalyze: (imageData: string, fileName: string) => void;
  isLoading: boolean;
  loadingStep: string;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onAnalyze,
  isLoading,
  loadingStep,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste handler so user can press Ctrl+V / Cmd+V directly
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isLoading) return;
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // 1. Check items
      if (clipboardData.items) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.type.indexOf("image") !== -1) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              handleFile(file);
              return;
            }
          }
        }
      }

      // 2. Check files
      if (clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (file.type.startsWith("image/")) {
            e.preventDefault();
            handleFile(file);
            return;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isLoading]);

  const handlePasteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    setErrorMessage(null);

    try {
      if (!navigator.clipboard?.read) {
        setErrorMessage("请直接使用键盘快捷键 Ctrl + V (或 ⌘ + V) 粘贴截图");
        return;
      }

      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split("/")[1] || "png";
          const file = new File([blob], `剪贴板截图_${Date.now()}.${ext}`, {
            type: imageType,
          });
          handleFile(file);
          return;
        }
      }
      setErrorMessage("剪贴板中暂无图片数据，请先复制或截取股票走势图后再试");
    } catch (err: any) {
      console.warn("Clipboard access warning:", err);
      setErrorMessage("浏览器剪贴板权限受限，请直接使用键盘按 Ctrl + V (或 ⌘ + V) 粘贴");
    }
  };

  const handleFile = (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith("image/")) {
      setErrorMessage("请上传有效的图片文件（如 PNG、JPG、JPEG、WEBP 等）");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage("图片大小不能超过 20MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onAnalyze(result, file.name);
      }
    };
    reader.onerror = () => {
      setErrorMessage("读取图片失败，请重试");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Upload Box */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-amber-400 bg-amber-500/10 scale-[1.005]"
            : "border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-900/90"
        } ${isLoading ? "pointer-events-none opacity-80" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-16 h-16">
              <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-amber-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div className="space-y-1.5 text-center">
              <h3 className="text-base font-semibold text-slate-200">
                正在深度解析股票走势截图...
              </h3>
              <p className="text-sm text-amber-400 font-mono transition-all animate-pulse">
                {loadingStep || "正在提取5日/10日/20日均线与MACD指标数据..."}
              </p>
              <p className="text-xs text-slate-500">
                AI 正在推演多空博弈能量与技术支撑位，请稍候约 3~6 秒
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shadow-inner">
              <Upload className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-slate-100">
                拖拽股票截图至此处，或{" "}
                <span className="text-amber-400 underline underline-offset-4 hover:text-amber-300">
                  点击浏览本地图片
                </span>
              </h3>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                支持同花顺、通达信、富途牛牛、TradingView、大智慧、东方财富等各大看盘软件的K线截图
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handlePasteClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-medium text-amber-300 transition shadow-sm"
              >
                <Clipboard className="w-3.5 h-3.5 text-amber-400" />
                <span>点击粘贴剪贴板截图</span>
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <span>或直接按</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 font-mono text-[11px]">
                  Ctrl + V
                </kbd>
                <span>/</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 font-mono text-[11px]">
                  ⌘ + V
                </kbd>
              </div>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preset Demo Charts for Instant Test */}
      {!isLoading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>没有现成截图？可直接点击下方经典K线形态示例快速体验：</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ALL_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => onAnalyze(sample.url, `${sample.name}.png`)}
                className="group relative p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 text-left transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
                      {sample.name}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="inline-block px-2 py-0.5 rounded bg-slate-800 text-[11px] font-medium text-amber-300/90 border border-slate-700/60 line-clamp-1">
                    {sample.tag}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {sample.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>点击一键解析</span>
                  <span className="text-amber-400 font-medium">智能识别 →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
