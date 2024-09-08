type StockData = {
  [key: string]: {
    "1. open": string;
    "2. high": string;
    "3. low": string;
    "4. close": string;
    "5. volume": string;
  };
};

interface IndicatorProps {
  period: number;
  data: number[];
}

export const SMA = ({ period, data }: IndicatorProps): number[] => {
  return data.reduce((acc: number[], curr, index, array) => {
    const baseIndex = index - period + 1;
    if (baseIndex < 0) {
      return acc;
    }
    const targetValues = array.slice(baseIndex, index + 1);
    const total = targetValues.reduce((total, value) => total + value, 0);
    const value = total / period;
    return [...acc, value];
  }, []);
};

export const EMA = ({ period, data }: IndicatorProps): number[] => {
  const k = 2 / (period + 1);
  let EMAYesterday: number | null = null;
  return data.reduce((acc: number[], value) => {
    
    if (EMAYesterday === null) {
      EMAYesterday = value;
      return acc;
    }
    const emaValue = value * k + EMAYesterday * (1 - k);
    EMAYesterday = emaValue;
    return [...acc, emaValue];
  }, []);
};

export const stochastic = ({ period, data }: IndicatorProps): number[] => {
  return data.reduce((acc: number[], _, index, array) => {
    const baseIndex = index - period + 1;
    if (baseIndex < 0) {
      return acc;
    }
    const targetValues = array.slice(baseIndex, index + 1);
    const currentValue = targetValues[targetValues.length - 1];
    const highestHigh = Math.max(...targetValues);
    const lowestLow = Math.min(...targetValues);
    const value = ((currentValue - lowestLow) / (highestHigh - lowestLow)) * 100;
    return [...acc, value];
  }, []);
};

export const RSI = ({ period, data }: IndicatorProps): number[] => {
  return data.reduce((acc: number[], _, index, array) => {
    const baseIndex = index - period;
    if (baseIndex < 0) {
      return acc;
    }
    const targetValues = array.slice(baseIndex, index + 1);
    let _lastCloseUpMove: number | null = null;
    const upMoves = targetValues.reduce(
      (acc, close) => {
        if (_lastCloseUpMove === null) {
          _lastCloseUpMove = close;
          return acc;
        }
        const diff = close - _lastCloseUpMove;
        _lastCloseUpMove = close;
        return diff > 0 ? { total: acc.total + diff, count: acc.count + 1 } : acc;
      },
      { total: 0, count: 0 }
    );

    let _lastCloseDownMove: number | null = null;
    const downMoves = targetValues.reduce(
      (acc, close) => {
        if (_lastCloseDownMove === null) {
          _lastCloseDownMove = close;
          return acc;
        }
        const diff = close - _lastCloseDownMove;
        _lastCloseDownMove = close;
        return diff < 0 ? { total: acc.total + Math.abs(diff), count: acc.count + 1 } : acc;
      },
      { total: 0, count: 0 }
    );

    const averageUpMoves = upMoves.count > 0 ? upMoves.total / upMoves.count : 0;
    const averageDownMoves = downMoves.count > 0 ? downMoves.total / downMoves.count : 0;
    const relativeStrength = averageDownMoves > 0 ? averageUpMoves / averageDownMoves : 0;
    const value = relativeStrength === 0 ? 100 : 100 - 100 / (1 + relativeStrength);

    return [...acc, value];
  }, []);
};

export const seasonality = ({ element, fn, days }: { element: [string, any]; fn: 'sin' | 'cos'; days: number }): number => {
  const timestamp = new Date(element[0]).getTime();
  const value = Math[fn](timestamp * ((2 * Math.PI) / days));
  return value;
};
