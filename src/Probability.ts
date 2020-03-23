import {Percentage} from "@/types"

////////////////////////////////////////////////////////////////////////////////
// RANDOMIZATION
////////////////////////////////////////////////////////////////////////////////

export function randomEntry<T>(array: Array<T>): T { // get a random entry from an array
	return [...array][Math.floor(Math.random() * array.length)]
}

////////////////////////////////////////////////////////////////////////////////
// STATISTICS
////////////////////////////////////////////////////////////////////////////////

export interface DiscreteStatistics {
	minimum: number,
	firstQuartile: number,
	lowerQuartile: number,
	secondQuartile: number,
	middleQuartile: number,
	thirdQuartile: number,
	upperQuartile: number,
	maximum: number,
	median: number,
	mean: number
}

export function discreteStatistics(values: Array<number>): DiscreteStatistics | undefined {
	const sortedValues = [...values].sort((a, b) => a - b) // work with a sorted copy
	
	if (sortedValues.length == 0) { // if there are no values
		return undefined
	} else {
		const minimum = sortedValues[0]
		const maximum = sortedValues[sortedValues.length - 1]
		const median = (sortedValues[Math.floor((sortedValues.length - 1) / 2)] + sortedValues[Math.ceil((sortedValues.length - 1) / 2)]) / 2 // average between the 2 middle ones, or the middle one if it exists
		const firstHalf = sortedValues.slice(0, Math.ceil(sortedValues.length / 2)) // first half of the values, inclusive of the middle element if there is one
		const secondHalf = sortedValues.slice(Math.floor(sortedValues.length / 2)) // second half of the values, inclusive of the middle element if there is one
		const lowerQuartile = (firstHalf[Math.floor((firstHalf.length - 1) / 2)] + firstHalf[Math.ceil((firstHalf.length - 1) / 2)]) / 2 // average between the 2 middle ones of the first half of the array, or the middle one if it exists
		const upperQuartile = (secondHalf[Math.floor((secondHalf.length - 1) / 2)] + secondHalf[Math.ceil((secondHalf.length - 1) / 2)]) / 2 // average between the 2 middle ones of the second half of the array, or the middle one if it exists
		const mean = sortedValues.reduce((sum, velocity) => sum + velocity, 0) / sortedValues.length
		
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
		}
	}
}

export function cumulativeProbability<T>(values: Array<T>, value: T): Probability { // given a list of values, it finds at what percentile in that list the value is and returns that (highest occurrence)
	// assumes values are unique, if not, it takes the last one
	// assumes array is sorted
	
	// TODO: implement percentile
}