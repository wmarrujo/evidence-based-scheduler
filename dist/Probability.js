"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
////////////////////////////////////////////////////////////////////////////////
// RANDOMIZATION
////////////////////////////////////////////////////////////////////////////////
function randomEntry(array) {
    return [...array][Math.floor(Math.random() * array.length)];
}
exports.randomEntry = randomEntry;
function discreteStatistics(values) {
    const sortedValues = [...values].sort((a, b) => a - b); // work with a sorted copy
    if (sortedValues.length == 0) { // if there are no values
        return undefined;
    }
    else {
        const minimum = sortedValues[0];
        const maximum = sortedValues[sortedValues.length - 1];
        const median = (sortedValues[Math.floor((sortedValues.length - 1) / 2)] + sortedValues[Math.ceil((sortedValues.length - 1) / 2)]) / 2; // average between the 2 middle ones, or the middle one if it exists
        const firstHalf = sortedValues.slice(0, Math.ceil(sortedValues.length / 2)); // first half of the values, inclusive of the middle element if there is one
        const secondHalf = sortedValues.slice(Math.floor(sortedValues.length / 2)); // second half of the values, inclusive of the middle element if there is one
        const lowerQuartile = (firstHalf[Math.floor((firstHalf.length - 1) / 2)] + firstHalf[Math.ceil((firstHalf.length - 1) / 2)]) / 2; // average between the 2 middle ones of the first half of the array, or the middle one if it exists
        const upperQuartile = (secondHalf[Math.floor((secondHalf.length - 1) / 2)] + secondHalf[Math.ceil((secondHalf.length - 1) / 2)]) / 2; // average between the 2 middle ones of the second half of the array, or the middle one if it exists
        const mean = sortedValues.reduce((sum, accuracy) => sum + accuracy, 0) / sortedValues.length;
        return {
            minimum: minimum,
            firstQuartile: lowerQuartile,
            lowerQuartile: lowerQuartile,
            secondQuartile: median,
            middleQuartile: median,
            upperQuartile: upperQuartile,
            thirdQuartile: upperQuartile,
            maximum: maximum,
            median: median,
            mean: mean
        };
    }
}
exports.discreteStatistics = discreteStatistics;
function cumulativeProbability(values, value, compareFunction = (a, b) => a < b ? -1 : a > b ? 1 : 0) {
    // assumes values are unique, if not, it takes the last one
    // compare function: if a < b then -1, if a > b then 1, if a = b then 0
    if (values.length == 0) { // if there are no elements in the list
        return 0; // there is no value to be before or after, so 0% probability
    }
    else {
        const vs = [...values]
            .sort(compareFunction)
            .reverse();
        const reverseIndex = vs.findIndex(v => compareFunction(v, value) <= 0); // find the first occurrence of the value being less than or equal to the value in the list
        const index = vs.length - (reverseIndex == -1 ? vs.length : reverseIndex);
        return index / vs.length;
    }
}
exports.cumulativeProbability = cumulativeProbability;
function percentile(values, percentile) {
    // assumes array is sorted
    return values[Math.round((values.length - 1) * percentile)];
}
exports.percentile = percentile;
//# sourceMappingURL=Probability.js.map