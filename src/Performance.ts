import {Accuracy} from "./types"
import {randomEntry, discreteStatistics, DiscreteStatistics} from "./Probability"

////////////////////////////////////////////////////////////////////////////////
// TYPE
////////////////////////////////////////////////////////////////////////////////

export class Performance {
	accuracies: Array<Accuracy>
	
	constructor(accuracies: Array<Accuracy>) {
		this.accuracies = accuracies
	}
	
	// GETTERS
	
	get statistics(): DiscreteStatistics | undefined {
		return discreteStatistics(this.accuracies)
	}
	
	// METHODS
	
	randomAccuracy(): Accuracy { // get a random accuracy
		let accuracies = [...this.accuracies]
		if (accuracies.length < Performance.defaultProbabilities.length) { // if there are too few historical accuracies to pull from
			accuracies = accuracies.concat(Performance.defaultProbabilities.slice(0, Performance.defaultProbabilities.length - accuracies.length))
		}
		return randomEntry(accuracies)
	}
	
	// STATIC
	
	static defaultProbabilities = [1.0, 1.1, 0.9, 1.0, 1.2, 0.8, 1.0, 1.1, 0.9, 1.0] // the default probabilities to fill when there isn't enough historical data (its length is also the amount that determines how much that is)
}