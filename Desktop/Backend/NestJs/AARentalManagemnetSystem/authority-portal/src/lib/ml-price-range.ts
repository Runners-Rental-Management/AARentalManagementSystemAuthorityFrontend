import type { ListingRange } from "@/lib/addis-rent-benchmarks";
import type { PricePredictionResult } from "@/lib/api";

/** Map ML service output to the same shape used by MarketPricePanel / classifyRent. */
export function listingRangeFromMlPrediction(
  pred: PricePredictionResult,
  areaSqm: number,
): ListingRange {
  const recommendedMin = Math.round(pred.predictedMin);
  const recommendedMax = Math.round(pred.predictedMax);
  const mid = Math.round(pred.predictedMedian);
  const floor = Math.round(recommendedMin * 0.85);
  const ceiling = Math.round(recommendedMax * 1.15);

  return {
    floor,
    recommendedMin,
    recommendedMax,
    ceiling,
    mid,
    perSqmMin: areaSqm > 0 ? Math.round(recommendedMin / areaSqm) : 0,
    perSqmMax: areaSqm > 0 ? Math.round(recommendedMax / areaSqm) : 0,
    baseMin: recommendedMin,
    baseMax: recommendedMax,
    areaFactor: 1,
    citations: [],
  };
}

export function mlSourceLabel(source: PricePredictionResult["source"]): string {
  return source === "model" ? "ML model" : "ML rule-based estimate";
}
