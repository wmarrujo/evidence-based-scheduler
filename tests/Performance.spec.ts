import {Performance} from "@/Performance"

describe("Performance Data", () => {
	test("Performance Statistics", () => {
		// Test undefined performance
		const undefinedPerformance = new Performance([])
		
		expect(undefinedPerformance.statistics).toBeUndefined()
		
		// Test trivial performance
		const trivialPerformance = new Performance([10])
		const trivialStatistics = trivialPerformance.statistics!
		
		expect(trivialStatistics.minimum).toBe(10)
		expect(trivialStatistics.firstQuartile).toBe(10)
		expect(trivialStatistics.secondQuartile).toBe(10)
		expect(trivialStatistics.thirdQuartile).toBe(10)
		expect(trivialStatistics.maximum).toBe(10)
		expect(trivialStatistics.median).toBe(10)
		expect(trivialStatistics.mean).toBe(10)
		
		// Test performance with odd number of entries
		const oddPerformance = new Performance([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
		const oddStatistics = oddPerformance.statistics!
		
		expect(oddStatistics.minimum).toBe(0)
		expect(oddStatistics.firstQuartile).toBe(2.5)
		expect(oddStatistics.secondQuartile).toBe(5)
		expect(oddStatistics.thirdQuartile).toBe(7.5)
		expect(oddStatistics.maximum).toBe(10)
		expect(oddStatistics.median).toBe(5)
		expect(oddStatistics.mean).toBe(5)
		
		// Test performance with even number of entries
		const evenPerformance = new Performance([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
		const evenStatistics = evenPerformance.statistics!
		
		expect(evenStatistics.minimum).toBe(1)
		expect(evenStatistics.firstQuartile).toBe(3)
		expect(evenStatistics.secondQuartile).toBe(5.5)
		expect(evenStatistics.thirdQuartile).toBe(8)
		expect(evenStatistics.maximum).toBe(10)
		expect(evenStatistics.median).toBe(5.5)
		expect(evenStatistics.mean).toBe(5.5)
	})
})