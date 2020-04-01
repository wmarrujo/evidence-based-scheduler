import { Percentage, Probability } from "./types";
export declare function randomEntry<T>(array: Array<T>): T;
export interface DiscreteStatistics {
    minimum: number;
    firstQuartile: number;
    lowerQuartile: number;
    secondQuartile: number;
    middleQuartile: number;
    thirdQuartile: number;
    upperQuartile: number;
    maximum: number;
    median: number;
    mean: number;
}
export declare function discreteStatistics(values: Array<number>): DiscreteStatistics | undefined;
export declare function cumulativeProbability<T>(values: Array<T>, value: T, compareFunction?: (a: T, b: T) => number): Probability;
export declare function percentile<T>(values: Array<T>, percentile: Percentage): T;
