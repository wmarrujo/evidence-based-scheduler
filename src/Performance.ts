import {Velocity, Percentage} from "@/types"

////////////////////////////////////////////////////////////////////////////////
// TYPE
////////////////////////////////////////////////////////////////////////////////

interface PerformanceStatistics {
	minimum: Velocity,
	firstQuartile: Velocity,
	lowerQuartile: Velocity,
	secondQuartile: Velocity,
	middleQuartile: Velocity,
	thirdQuartile: Velocity,
	upperQuartile: Velocity,
	maximum: Velocity,
	median: Velocity,
	mean: Velocity
}

export class Performance {
	velocities: Array<Velocity>
	
	constructor(velocities: Array<Velocity>) {
		this.velocities = velocities
	}
	
	// GETTERS
	
	get randomVelocity(): Velocity { // get a random velocity
		let velocities = [...this.velocities]
		if (velocities.length < Performance.defaultProbabilities.length) { // if there are too few historical velocities to pull from
			velocities = velocities.concat(Performance.defaultProbabilities.slice(0, Performance.defaultProbabilities.length - velocities.length))
		}
		return velocities[Math.floor(Math.random() * velocities.length)]
	}
	
	get statistics(): PerformanceStatistics | undefined {
		const sortedVelocities = [...this.velocities].sort((a, b) => a - b) // work with a sorted copy
		
		if (sortedVelocities.length == 0) { // if there are no values
			return undefined
		} else {
			const minimum = sortedVelocities[0]
			const maximum = sortedVelocities[sortedVelocities.length - 1]
			const median = (sortedVelocities[Math.floor((sortedVelocities.length - 1) / 2)] + sortedVelocities[Math.ceil((sortedVelocities.length - 1) / 2)]) / 2 // average between the 2 middle ones, or the middle one if it exists
			const firstHalf = sortedVelocities.slice(0, Math.ceil(sortedVelocities.length / 2)) // first half of the values, inclusive of the middle element if there is one
			const secondHalf = sortedVelocities.slice(Math.floor(sortedVelocities.length / 2)) // second half of the values, inclusive of the middle element if there is one
			const lowerQuartile = (firstHalf[Math.floor((firstHalf.length - 1) / 2)] + firstHalf[Math.ceil((firstHalf.length - 1) / 2)]) / 2 // average between the 2 middle ones of the first half of the array, or the middle one if it exists
			const upperQuartile = (secondHalf[Math.floor((secondHalf.length - 1) / 2)] + secondHalf[Math.ceil((secondHalf.length - 1) / 2)]) / 2 // average between the 2 middle ones of the second half of the array, or the middle one if it exists
			const mean = sortedVelocities.reduce((sum, velocity) => sum + velocity, 0) / sortedVelocities.length
			
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
	
	// STATIC
	
	static defaultProbabilities = [1.0, 1.1, 0.9, 1.0, 1.2, 0.8, 1.0, 1.1, 0.9, 1.0] // the default probabilities to fill when there isn't enough historical data (its length is also the amount that determines how much that is)
}