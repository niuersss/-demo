import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Support high payload limit for base64 screenshots
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy-initialized Gemini client with required headers
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

// Helper: Normalize and sanitize stock analysis response
function normalizeStockAnalysis(raw: any) {
  const safeStr = (val: any, fallback = "--") =>
    typeof val === "string" && val.trim() ? val.trim() : fallback;

  const safeNum = (val: any, fallback = 75) => {
    const num = Number(val);
    return Number.isFinite(num) ? num : fallback;
  };

  const safeArr = (val: any, fallback: string[] = []) =>
    Array.isArray(val) && val.length > 0 ? val : fallback;

  return {
    stockName: safeStr(raw.stockName, "标的技术图谱"),
    stockCode: safeStr(raw.stockCode, "走势分析"),
    timeframe: safeStr(raw.timeframe, "日K"),
    currentPrice: safeStr(raw.currentPrice, "--"),
    priceChange: safeStr(raw.priceChange, "0.00%"),
    chartDescription: safeStr(raw.chartDescription, "K线及均线技术面走势图"),
    movingAverages: {
      ma5: {
        value: safeStr(raw.movingAverages?.ma5?.value, "--"),
        trend: raw.movingAverages?.ma5?.trend || "flat",
        status: safeStr(raw.movingAverages?.ma5?.status, "平稳运行"),
        color: safeStr(raw.movingAverages?.ma5?.color, "#f59e0b"),
      },
      ma10: {
        value: safeStr(raw.movingAverages?.ma10?.value, "--"),
        trend: raw.movingAverages?.ma10?.trend || "flat",
        status: safeStr(raw.movingAverages?.ma10?.status, "平稳运行"),
        color: safeStr(raw.movingAverages?.ma10?.color, "#3b82f6"),
      },
      ma20: {
        value: safeStr(raw.movingAverages?.ma20?.value, "--"),
        trend: raw.movingAverages?.ma20?.trend || "flat",
        status: safeStr(raw.movingAverages?.ma20?.status, "平稳运行"),
        color: safeStr(raw.movingAverages?.ma20?.color, "#a855f7"),
      },
      ma30: raw.movingAverages?.ma30
        ? {
            value: safeStr(raw.movingAverages.ma30.value, "--"),
            trend: raw.movingAverages.ma30.trend || "flat",
            status: safeStr(raw.movingAverages.ma30.status, "运行中"),
            color: safeStr(raw.movingAverages.ma30.color, "#10b981"),
          }
        : undefined,
      ma60: raw.movingAverages?.ma60
        ? {
            value: safeStr(raw.movingAverages.ma60.value, "--"),
            trend: raw.movingAverages.ma60.trend || "flat",
            status: safeStr(raw.movingAverages.ma60.status, "中期生命线"),
            color: safeStr(raw.movingAverages.ma60.color, "#06b6d4"),
          }
        : undefined,
      ma120: raw.movingAverages?.ma120
        ? {
            value: safeStr(raw.movingAverages.ma120.value, "--"),
            trend: raw.movingAverages.ma120.trend || "flat",
            status: safeStr(raw.movingAverages.ma120.status, "半年线"),
            color: safeStr(raw.movingAverages.ma120.color, "#8b5cf6"),
          }
        : undefined,
      ma250: raw.movingAverages?.ma250
        ? {
            value: safeStr(raw.movingAverages.ma250.value, "--"),
            trend: raw.movingAverages.ma250.trend || "flat",
            status: safeStr(raw.movingAverages.ma250.status, "年线"),
            color: safeStr(raw.movingAverages.ma250.color, "#ef4444"),
          }
        : undefined,
      maAlignment: raw.movingAverages?.maAlignment || "diverging",
      alignmentLabel: safeStr(raw.movingAverages?.alignmentLabel, "均线形态整理中"),
      maAnalysis: safeStr(raw.movingAverages?.maAnalysis, "均线系统处于拐点过渡期，关注均线粘合突破方向。"),
    },
    macd: {
      dif: safeStr(raw.macd?.dif, "--"),
      dea: safeStr(raw.macd?.dea, "--"),
      histogram: safeStr(raw.macd?.histogram, "--"),
      signal: raw.macd?.signal || "neutral",
      signalText: safeStr(raw.macd?.signalText, "常规波动"),
      macdAnalysis: safeStr(raw.macd?.macdAnalysis, "快慢线在当前区间波动，需关注量能放大配合情况。"),
    },
    volumeAndCandle: {
      candlePattern: safeStr(raw.volumeAndCandle?.candlePattern, "标准K线组合"),
      volumeStatus: safeStr(raw.volumeAndCandle?.volumeStatus, "温和成交"),
      volumeAnalysis: safeStr(raw.volumeAndCandle?.volumeAnalysis, "成交量配合平稳，等待放量突破信号。"),
    },
    keyLevels: {
      support1: safeStr(raw.keyLevels?.support1, "--"),
      support2: safeStr(raw.keyLevels?.support2, "--"),
      resistance1: safeStr(raw.keyLevels?.resistance1, "--"),
      resistance2: safeStr(raw.keyLevels?.resistance2, "--"),
    },
    prediction: {
      direction: raw.prediction?.direction || "consolidation",
      directionText: safeStr(raw.prediction?.directionText, "区间盘整蓄势"),
      confidenceScore: safeNum(raw.prediction?.confidenceScore, 75),
      shortTermOutlook: safeStr(raw.prediction?.shortTermOutlook, "短期走势在关键技术位区间震荡整固。"),
      mediumTermOutlook: safeStr(raw.prediction?.mediumTermOutlook, "中期趋势取决于突破阻力位或回踩支撑位的有效性。"),
      triggerConditions: safeArr(raw.prediction?.triggerConditions, [
        "放量站稳短期压力位将确认反弹持续",
        "跌破关键防守位需防范进一步回撤风险",
      ]),
      targetPriceRange: safeStr(raw.prediction?.targetPriceRange, "详见技术位推演"),
      stopLossPrice: safeStr(raw.prediction?.stopLossPrice, "破位防守支撑"),
    },
    tradingStrategy: {
      action: raw.tradingStrategy?.action || "hold",
      actionText: safeStr(raw.tradingStrategy?.actionText, "持股待变 / 逢低关注"),
      suggestedPosition: safeStr(raw.tradingStrategy?.suggestedPosition, "2-3成轻仓试探"),
      operationalTips: safeArr(raw.tradingStrategy?.operationalTips, [
        "严守纪律，顺应均线与量能趋势操作",
        "以第一支撑位为防守基准，破位及时控制仓位",
      ]),
      riskWarnings: safeArr(raw.tradingStrategy?.riskWarnings, [
        "突发行业利空或市场系统性调整可能导致破位",
        "量能若不持续放大需警惕冲高回落风险",
      ]),
    },
    disclaimer: safeStr(
      raw.disclaimer,
      "免责声明：本工具基于计算机视觉与人工智能算法对K线截图进行技术形态推演，分析结果仅供学习研究参考，不构成任何具体的投资建议与收益承诺。"
    ),
  };
}

// Primary endpoint: Analyze stock chart screenshot
app.post("/api/analyze-stock", async (req, res) => {
  try {
    const { image, mimeType, colorScheme = "cn" } = req.body;

    if (!image) {
      return res.status(400).json({ error: "请提供股票走势图截图" });
    }

    const ai = getGeminiClient();

    // 1. Accurately detect MIME type from data URI or body
    let effectiveMime = "image/png";
    if (typeof mimeType === "string" && mimeType.startsWith("image/")) {
      effectiveMime = mimeType;
    }
    const mimeMatch = image.match(/^data:([a-zA-Z0-9+/.-]+);base64,/);
    if (mimeMatch && mimeMatch[1]) {
      effectiveMime = mimeMatch[1];
    }

    // 2. Clean base64 data
    const base64Data = image
      .replace(/^data:[a-zA-Z0-9+/.-]+;base64,/, "")
      .replace(/[\r\n\s]/g, "");

    const promptText = `
你是一位资深、严谨的特许金融分析师(CFA)及资深证券投资顾问，精通K线理论、道氏理论、均线系统(MA)以及MACD等经典量价指标技术分析。
请仔细分析用户上传的这张股票或大盘K线走势截图。

色彩习惯设定：当前用户选定的涨跌显示偏好为【${colorScheme === "cn" ? "A股传统模式 (红涨绿跌)" : "国际美股模式 (绿涨红跌)"}】。

请详细识别并分析图中信息，并输出结构化JSON：
1. 【标的信息与价格】：若图中有股票名称、代码、周期(如日K、周K、60分钟等)、最新股价/收盘价、涨跌幅，请准确提取（例如标的名称“豪威集团”、代码“603501”、最新价、涨跌额与涨跌幅等）；若无明确股票名称请注明“K线技术图谱”并提取可见最新价。
2. 【均线系统(MA)深度解析】：
   - 提取图中可见的各条均线数值（如MA5/M5、MA10/M10、MA20/M20、MA30/M30、MA60/M60、MA120/M120等，从图例说明或均线走势对应价格轴推算）。
   - 分析各均线的当前倾斜角度/走势（向上多头推进、走平胶着、向下死叉发散等）。
   - 均线排列形态：判断是标准多头排列(MA5>MA10>MA20)、空头排列(MA5<MA10<MA20)、均线粘合变盘期、还是均线交叉/底部反弹状态。
   - 给出均线系统的专业技术研判结论。
3. 【MACD指标深度解析】：
   - 寻找图中的MACD副图指标。
   - 分析DIF(快线)与DEA(慢线)的数值或相对0轴位置(0轴上方多头区 / 0轴下方空头区)。
   - 分析MACD红柱/绿柱能量棒的变化趋势(放大、收敛、衰减、翻红/翻绿)。
   - 识别关键MACD形态信号：0轴上金叉、低位二次金叉、高位死叉、顶背离(价格创新高而MACD指标未创新高)、底背离(价格创新低而MACD指标止跌抬高形成金叉)等。
4. 【K线形态与量价关系(Volume)】：
   - 识别近期K线组合（如突破大阳线、长上影冲高回落、缩量十字星、底部红三兵、看跌吞没等）。
   - 分析成交量柱状图：放量突破、缩量回调、量价背离或放量滞涨等特征。
5. 【关键技术位】：
   - 给出第一支撑位(支撑位1)、关键强支撑位(支撑位2)。
   - 给出第一阻力位(压力位1)、强压力位(压力位2)。
6. 【综合走势预测 (1-5个交易日及中期1-4周)】：
   - 趋势方向预测：看多上涨(bullish) / 看空下跌(bearish) / 偏多震荡(volatile_bullish) / 偏空震荡(volatile_bearish) / 窄幅盘整(consolidation)。
   - 给出置信度评分 (50-95之间的整数)。
   - 给出短期(1-5日)与中期(1-4周)走势推演描述。
   - 明确变盘点触发条件（例如：“若放量站稳MA30并冲击MA60，将打开上行空间；若跌破MA5支撑，需防范回踩考验MA10/MA20”）。
   - 预估目标价区间及止损警戒线。
7. 【实战操盘策略与风控】：
   - 操作指引动作：逢低建仓(buy) / 回踩加仓(add_position) / 持股待涨(hold) / 冲高减仓(reduce_position) / 破位止损(sell) / 保持观望(wait_and_see)。
   - 建议仓位(如 2-3成轻仓试探、半仓稳健、暂空仓观望等)。
   - 3-4条关键操作实战要点。
   - 2-3条核心风险警示与合规免责声明。

务必严格返回合法的JSON格式，符合系统预设字段。`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        stockName: { type: Type.STRING, description: "股票名称或标的识别" },
        stockCode: { type: Type.STRING, description: "股票代码" },
        timeframe: { type: Type.STRING, description: "K线周期如日K、周K等" },
        currentPrice: { type: Type.STRING, description: "最新价格" },
        priceChange: { type: Type.STRING, description: "涨跌幅" },
        chartDescription: { type: Type.STRING, description: "图表整体特征概述" },
        movingAverages: {
          type: Type.OBJECT,
          properties: {
            ma5: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                trend: { type: Type.STRING, enum: ["up", "down", "flat"] },
                status: { type: Type.STRING },
                color: { type: Type.STRING },
              },
              required: ["value", "trend", "status"],
            },
            ma10: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                trend: { type: Type.STRING, enum: ["up", "down", "flat"] },
                status: { type: Type.STRING },
                color: { type: Type.STRING },
              },
              required: ["value", "trend", "status"],
            },
            ma20: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                trend: { type: Type.STRING, enum: ["up", "down", "flat"] },
                status: { type: Type.STRING },
                color: { type: Type.STRING },
              },
              required: ["value", "trend", "status"],
            },
            ma30: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                trend: { type: Type.STRING, enum: ["up", "down", "flat"] },
                status: { type: Type.STRING },
                color: { type: Type.STRING },
              },
            },
            ma60: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                trend: { type: Type.STRING, enum: ["up", "down", "flat"] },
                status: { type: Type.STRING },
                color: { type: Type.STRING },
              },
            },
            ma120: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                trend: { type: Type.STRING, enum: ["up", "down", "flat"] },
                status: { type: Type.STRING },
                color: { type: Type.STRING },
              },
            },
            ma250: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                trend: { type: Type.STRING, enum: ["up", "down", "flat"] },
                status: { type: Type.STRING },
                color: { type: Type.STRING },
              },
            },
            maAlignment: {
              type: Type.STRING,
              enum: ["bullish", "bearish", "entangled", "diverging"],
            },
            alignmentLabel: { type: Type.STRING },
            maAnalysis: { type: Type.STRING },
          },
          required: ["ma5", "ma10", "ma20", "maAlignment", "alignmentLabel", "maAnalysis"],
        },
        macd: {
          type: Type.OBJECT,
          properties: {
            dif: { type: Type.STRING },
            dea: { type: Type.STRING },
            histogram: { type: Type.STRING },
            signal: {
              type: Type.STRING,
              enum: [
                "golden_cross",
                "death_cross",
                "bullish_divergence",
                "bearish_divergence",
                "neutral",
                "zero_axis_rebound",
              ],
            },
            signalText: { type: Type.STRING },
            macdAnalysis: { type: Type.STRING },
          },
          required: ["dif", "dea", "histogram", "signal", "signalText", "macdAnalysis"],
        },
        volumeAndCandle: {
          type: Type.OBJECT,
          properties: {
            candlePattern: { type: Type.STRING },
            volumeStatus: { type: Type.STRING },
            volumeAnalysis: { type: Type.STRING },
          },
          required: ["candlePattern", "volumeStatus", "volumeAnalysis"],
        },
        keyLevels: {
          type: Type.OBJECT,
          properties: {
            support1: { type: Type.STRING },
            support2: { type: Type.STRING },
            resistance1: { type: Type.STRING },
            resistance2: { type: Type.STRING },
          },
          required: ["support1", "support2", "resistance1", "resistance2"],
        },
        prediction: {
          type: Type.OBJECT,
          properties: {
            direction: {
              type: Type.STRING,
              enum: [
                "bullish",
                "bearish",
                "volatile_bullish",
                "volatile_bearish",
                "consolidation",
              ],
            },
            directionText: { type: Type.STRING },
            confidenceScore: { type: Type.INTEGER },
            shortTermOutlook: { type: Type.STRING },
            mediumTermOutlook: { type: Type.STRING },
            triggerConditions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            targetPriceRange: { type: Type.STRING },
            stopLossPrice: { type: Type.STRING },
          },
          required: [
            "direction",
            "directionText",
            "confidenceScore",
            "shortTermOutlook",
            "mediumTermOutlook",
            "triggerConditions",
            "targetPriceRange",
            "stopLossPrice",
          ],
        },
        tradingStrategy: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              enum: [
                "buy",
                "add_position",
                "hold",
                "reduce_position",
                "sell",
                "wait_and_see",
              ],
            },
            actionText: { type: Type.STRING },
            suggestedPosition: { type: Type.STRING },
            operationalTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            riskWarnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            "action",
            "actionText",
            "suggestedPosition",
            "operationalTips",
            "riskWarnings",
          ],
        },
        disclaimer: { type: Type.STRING },
      },
      required: [
        "stockName",
        "stockCode",
        "timeframe",
        "currentPrice",
        "priceChange",
        "chartDescription",
        "movingAverages",
        "macd",
        "volumeAndCandle",
        "keyLevels",
        "prediction",
        "tradingStrategy",
        "disclaimer",
      ],
    };

    // Candidate models with retry fallback to handle temporary high-demand spikes
    const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];
    let rawText = "";
    let lastError: any = null;

    for (const modelName of candidateModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }

          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: effectiveMime,
                    data: base64Data,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
            config: {
              responseMimeType: "application/json",
              responseSchema,
            },
          });

          rawText = response.text?.trim() || "";
          if (rawText) break;
        } catch (err: any) {
          lastError = err;
          console.warn(`[Stock Analysis] Model ${modelName} attempt ${attempt + 1} error:`, err?.message || err);
        }
      }
      if (rawText) break;
    }

    if (!rawText) {
      throw lastError || new Error("AI 视觉识别服务繁忙或响应超时，请重试");
    }

    // Clean markdown code blocks if any
    let cleanJson = rawText;
    cleanJson = cleanJson
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    const parsedData = JSON.parse(cleanJson);
    const normalizedData = normalizeStockAnalysis(parsedData);

    res.json({
      success: true,
      analysis: normalizedData,
    });
  } catch (error: any) {
    console.error("Stock analysis error:", error);
    res.status(500).json({
      error: error?.message || "股票图表解析失败，请检查图片清晰度或重试",
    });
  }
});

// Follow-up Q&A endpoint for deeper interactive analysis
app.post("/api/stock-chat", async (req, res) => {
  try {
    const { question, analysisContext, history = [] } = req.body;

    if (!question) {
      return res.status(400).json({ error: "问题内容不能为空" });
    }

    const ai = getGeminiClient();

    const systemInstruction = `
你是一位专业的量化技术面操盘导师。用户正在询问关于刚刚分析的一张股票走势图的问题。
已知的技术面图谱解析如下：
${JSON.stringify(analysisContext, null, 2)}

回答要求：
1. 紧密结合已识别的MA5/MA10/MA20/MA30/MA60均线状态、MACD金叉/死叉/背离信号、量能变化及关键支撑压力位。
2. 给出逻辑清晰、切实可行的策略建议，并说明具体依据（如跌破哪个点位离场、放量站上哪条均线确认加仓）。
3. 语气客观严谨，必须提醒控制风险与资金回撤。
4. 使用格式优美 Markdown 排版。`;

    const chatMessages = [
      ...history.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
      {
        role: "user",
        parts: [{ text: question }],
      },
    ];

    const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];
    let replyText = "";
    let lastChatError: any = null;

    for (const modelName of candidateModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
          }
          const response = await ai.models.generateContent({
            model: modelName,
            contents: chatMessages,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          replyText = response.text || "";
          if (replyText) break;
        } catch (err: any) {
          lastChatError = err;
          console.warn(`[Stock Chat] Model ${modelName} error:`, err?.message);
        }
      }
      if (replyText) break;
    }

    if (!replyText) {
      throw lastChatError || new Error("咨询解答生成失败，请重试");
    }

    res.json({
      success: true,
      reply: replyText,
    });
  } catch (error: any) {
    console.error("Stock chat error:", error);
    res.status(500).json({
      error: error?.message || "咨询解答生成失败，请重试",
    });
  }
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Stock Vision AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
