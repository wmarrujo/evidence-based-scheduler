"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Probability_1 = require("./Probability");
////////////////////////////////////////////////////////////////////////////////
// TYPE
////////////////////////////////////////////////////////////////////////////////
class Performance {
    constructor(accuracies) {
        this.accuracies = accuracies;
    }
    // GETTERS
    get statistics() {
        return Probability_1.discreteStatistics(this.accuracies);
    }
    // METHODS
    randomAccuracy() {
        let accuracies = [...this.accuracies];
        if (accuracies.length < Performance.defaultProbabilities.length) { // if there are too few historical accuracies to pull from
            accuracies = accuracies.concat(Performance.defaultProbabilities.slice(0, Performance.defaultProbabilities.length - accuracies.length));
        }
        return Probability_1.randomEntry(accuracies);
    }
}
exports.Performance = Performance;
// STATIC
Performance.defaultProbabilities = [1.0, 1.1, 0.9, 1.0, 1.2, 0.8, 1.0, 1.1, 0.9, 1.0]; // the default probabilities to fill when there isn't enough historical data (its length is also the amount that determines how much that is)
//# sourceMappingURL=Performance.js.map