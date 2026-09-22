export interface MovingAverageItem {
  value: string;
  trend: 'up' | 'down' | 'flat';
  status: string;
  color?: string;
}

export interface StockAnalysis {
  stockName: string;
  stockCode: string;
  timeframe: string;
  currentPrice: string;
  priceChange: string;
  chartDescription: string;
  movingAverages: {
    ma5: MovingAverageItem;
    ma10: MovingAverageItem;
    ma20: MovingAverageItem;
    ma30?: MovingAverageItem;
    ma60?: MovingAverageItem;
    ma120?: MovingAverageItem;
    ma250?: MovingAverageItem;
    maAlignment: 'bullish' | 'bearish' | 'entangled' | 'diverging';
    alignmentLabel: string;
    maAnalysis: string;
  };
  macd: {
    dif: string;
    dea: string;
    histogram: string;
    signal: 'golden_cross' | 'death_cross' | 'bullish_divergence' | 'bearish_divergence' | 'neutral' | 'zero_axis_rebound';
    signalText: string;
    macdAnalysis: string;
  };
  volumeAndCandle: {
    candlePattern: string;
    volumeStatus: string;
    volumeAnalysis: string;
  };
  keyLevels: {
    support1: string;
    support2: string;
    resistance1: string;
    resistance2: string;
  };
  prediction: {
    direction: 'bullish' | 'bearish' | 'volatile_bullish' | 'volatile_bearish' | 'consolidation';
    directionText: string;
    confidenceScore: number;
    shortTermOutlook: string;
    mediumTermOutlook: string;
    triggerConditions: string[];
    targetPriceRange: string;
    stopLossPrice: string;
  };
  tradingStrategy: {
    action: 'buy' | 'add_position' | 'hold' | 'reduce_position' | 'sell' | 'wait_and_see';
    actionText: string;
    suggestedPosition: string;
    operationalTips: string[];
    riskWarnings: string[];
  };
  disclaimer: string;
}

export interface AnalysisRecord {
  id: string;
  timestamp: number;
  imageUrl: string;
  fileName: string;
  analysis: StockAnalysis;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
