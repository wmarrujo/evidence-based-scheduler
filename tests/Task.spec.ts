import {Task, validateTaskList, noDuplicateIdentifiers, noGhostReferences, noCircularDependencies} from "../src/Task"

describe("Structure", () => {
	test("Task Definition", () => {
		// Test task defaults
		let defaultTask = new Task("1", "Task 1", "Person 1", 3)
		
		expect(defaultTask.identifier).toBe("1")
		expect(defaultTask.name).toBe("Task 1")
		expect(defaultTask.description).toBe("")
		expect(defaultTask.resource).toBe("Person 1")
		expect(defaultTask.dependencies.size).toBe(0)
		expect(defaultTask.prediction).toBe(3)
		expect(defaultTask.actual).toBeUndefined()
		expect(defaultTask.velocity).toBeUndefined()
		
		// Test task specifics
		let specificTask = new Task("2", "Task 2", "Person 2", 4, [defaultTask.identifier], "description", 3)
		
		expect(specificTask.identifier).toBe("2")
		expect(specificTask.name).toBe("Task 2")
		expect(specificTask.description).toBe("description")
		expect(specificTask.resource).toBe("Person 2")
		expect(specificTask.dependencies).toContain("1")
		expect(specificTask.prediction).toBe(4)
		expect(specificTask.actual).toBe(3)
		expect(specificTask.velocity).toBe(3/4)
	})
	
	test("Task List Validation", () => {
		// set up tasks
		let task1 = new Task("1", "Task 1", "Person", 1, [])
		let task2 = new Task("2", "Task 2", "Person", 2, [])
		let task3 = new Task("3", "Task 3", "Person", 3, ["1"])
		let task4 = new Task("4", "Task 4", "Person", 4, ["1"])
		let task5 = new Task("5", "Task 5", "Person", 5, ["6"])
		let task6 = new Task("6", "Task 6", "Person", 6, ["5"]) // will lead to circular dependency
		
		// test duplicate identifier finding
		expect(noDuplicateIdentifiers([task1, task2, task3, task4, task5, task6])).toBe(true)
		expect(noDuplicateIdentifiers([task1, task2, task3, task4, task5, task6, task5])).toBe(false) // task 5 is in there twice
		
		// test ghost references
		expect(noGhostReferences([task1, task2, task3, task4, task5, task6])).toBe(true)
		expect(noGhostReferences([task1, task2, task3, task4, task6])).toBe(false) // task 5 is not in there for 6 to reference
		
		// test circular dependencies
		expect(noCircularDependencies([task1, task2, task3, task4])).toBe(true)
		expect(noCircularDependencies([task1, task2, task3, task4, task5, task6])).toBe(false) // task 5 and 6 reference each other
		
		// all together now
		expect(validateTaskList([task1, task2, task3, task4])).toBe(true)
		expect(validateTaskList([task1, task2, task3, task4, task3])).toBe(false) // will fail on no duplicate identifiers
		expect(validateTaskList([task1, task2, task3, task4, task5])).toBe(false) // will fail on no ghost references
		expect(validateTaskList([task1, task2, task3, task4, task5, task6])).toBe(false) // will fail on no circular dependencies
	})
})