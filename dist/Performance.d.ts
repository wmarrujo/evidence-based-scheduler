import { Accuracy } from "./types/aliases";
import { DiscreteStatistics } from "./Probability";
export declare class Performance {
    accuracies: Array<Accuracy>;
    constructor(accuracies: Array<Accuracy>);
    get statistics(): DiscreteStatistics | undefined;
    randomAccuracy(): Accuracy;
    static defaultProbabilities: number[];
}
