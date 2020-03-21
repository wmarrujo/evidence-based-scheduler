import {Task} from "../src/index"

describe("Structure", () => {
	test("Task Definition", () => {
		// Test task defaults
		let defaultTask = new Task("1", "Task 1", 3)
		
		expect(defaultTask.identifier).toBe("1")
		expect(defaultTask.name).toBe("Task 1")
		expect(defaultTask.description).toBe("")
		expect(defaultTask.dependencies.length).toBe(0)
		expect(defaultTask.prediction).toBe(3)
		expect(defaultTask.actual).toBeUndefined()
		expect(defaultTask.velocity).toBeUndefined()
		
		// Test task specifics
		let specificTask = new Task("2", "Task 2", 4, "description", [defaultTask.identifier], 3)
		
		expect(specificTask.identifier).toBe("2")
		expect(specificTask.name).toBe("Task 2")
		expect(specificTask.description).toBe("description")
		expect(specificTask.dependencies).toContain("1")
		expect(specificTask.prediction).toBe(4)
		expect(specificTask.actual).toBe(3)
		expect(specificTask.velocity).toBe(4/3)
	})
})