import {discreteStatistics, cumulativeProbability, percentile} from "@/Probability"

describe("Performance Data", () => {
	test("Performance Statistics", () => {
		// Test undefined performance
		const undefinedStatistics = discreteStatistics([])
		
		expect(undefinedStatistics).toBeUndefined()
		
		// Test trivial performance
		const trivialStatistics = discreteStatistics([10])!
		
		expect(trivialStatistics.minimum).toBe(10)
		expect(trivialStatistics.firstQuartile).toBe(10)
		expect(trivialStatistics.secondQuartile).toBe(10)
		expect(trivialStatistics.thirdQuartile).toBe(10)
		expect(trivialStatistics.maximum).toBe(10)
		expect(trivialStatistics.median).toBe(10)
		expect(trivialStatistics.mean).toBe(10)
		
		// Test performance with odd number of entries
		const oddStatistics = discreteStatistics([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])!
		
		expect(oddStatistics.minimum).toBe(0)
		expect(oddStatistics.firstQuartile).toBe(2.5)
		expect(oddStatistics.secondQuartile).toBe(5)
		expect(oddStatistics.thirdQuartile).toBe(7.5)
		expect(oddStatistics.maximum).toBe(10)
		expect(oddStatistics.median).toBe(5)
		expect(oddStatistics.mean).toBe(5)
		
		// Test performance with even number of entries
		const evenStatistics = discreteStatistics([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])!
		
		expect(evenStatistics.minimum).toBe(1)
		expect(evenStatistics.firstQuartile).toBe(3)
		expect(evenStatistics.secondQuartile).toBe(5.5)
		expect(evenStatistics.thirdQuartile).toBe(8)
		expect(evenStatistics.maximum).toBe(10)
		expect(evenStatistics.median).toBe(5.5)
		expect(evenStatistics.mean).toBe(5.5)
	})
})

describe("Algorithms", () => {
	test("Cumulative Probability", () => {
		const values = [1, 2, 1, 3, 3, 5, 5, 5, 7, 8]
		
		expect(cumulativeProbability(values, -1)).toBe(0.0)
		expect(cumulativeProbability(values, 0)).toBe(0.0)
		expect(cumulativeProbability(values, 1)).toBe(0.2)
		expect(cumulativeProbability(values, 2)).toBe(0.3)
		expect(cumulativeProbability(values, 3)).toBe(0.5)
		expect(cumulativeProbability(values, 4)).toBe(0.5)
		expect(cumulativeProbability(values, 5)).toBe(0.8)
		expect(cumulativeProbability(values, 6)).toBe(0.8)
		expect(cumulativeProbability(values, 7)).toBe(0.9)
		expect(cumulativeProbability(values, 7.5)).toBe(0.9)
		expect(cumulativeProbability(values, 8)).toBe(1.0)
		expect(cumulativeProbability(values, 9)).toBe(1.0)
	})
	
	test("Percentile", () => {
		const values = ["a", "b", "b", "b", "c", "c", "d", "e", "e", "f"]
		
		expect(percentile(values, 0.00)).toBe("a")
		expect(percentile(values, 0.05)).toBe("a")
		expect(percentile(values, 0.10)).toBe("b")
		expect(percentile(values, 0.90)).toBe("e")
		expect(percentile(values, 0.95)).toBe("f")
		expect(percentile(values, 1.00)).toBe("f")
	})
})