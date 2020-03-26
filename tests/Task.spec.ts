import {Task, checkTaskList, checkNoDuplicateIdentifiersInTasks, checkNoGhostReferencesInTasks, checkNoCircularDependenciesInTasks, Group, checkGroupList, checkNoDuplicateIdentifiersInGroups, checkNoCircularDependenciesInGroups, internalizeTasks, fullReferenceTasks} from "@/Task"
import {ValidationError} from "@/Error"

describe("Task & Group Structure", () => {
	test("Task Definition", () => {
		// Test task defaults
		const defaultTask = new Task("T1", "Task 1", "Person 1", 3)
		
		expect(defaultTask.identifier).toBe("T1")
		expect(defaultTask.name).toBe("Task 1")
		expect(defaultTask.description).toBe("")
		expect(defaultTask.resource).toBe("Person 1")
		expect(defaultTask.dependencies.size).toBe(0)
		expect(defaultTask.prediction).toBe(3)
		expect(defaultTask.actual).toBe(0)
		expect(defaultTask.done).toBe(false)
		expect(defaultTask.accuracy).toBeUndefined()
		
		// Test task specifics
		const specificTask = new Task("T2", "Task 2", "Person 2", 4, [defaultTask.identifier], 3, true, "description")
		
		expect(specificTask.identifier).toBe("T2")
		expect(specificTask.name).toBe("Task 2")
		expect(specificTask.description).toBe("description")
		expect(specificTask.resource).toBe("Person 2")
		expect(specificTask.dependencies).toContain("T1")
		expect(specificTask.prediction).toBe(4)
		expect(specificTask.actual).toBe(3)
		expect(specificTask.done).toBe(true)
		expect(specificTask.accuracy).toBe(3/4)
	})
	
	test("Group Definition", () => {
		// Test group defaults
		const defaultGroup = new Group("G1", "Group 1", ["T1"])
		
		expect(defaultGroup.identifier).toBe("G1")
		expect(defaultGroup.name).toBe("Group 1")
		expect(defaultGroup.description).toBe("")
		expect(defaultGroup.tasks).toContain("T1")
		
		// Test group specifics
		const specificGroup = new Group("G2", "Group 2", ["T1"], "description")
		
		expect(specificGroup.identifier).toBe("G2")
		expect(specificGroup.name).toBe("Group 2")
		expect(specificGroup.description).toBe("description")
		expect(specificGroup.tasks).toContain("T1")
	})
})

describe("Task & Group Validation", () => {
	test("Task List Validation", () => {
		// set up tasks
		const task1 = new Task("T1", "Task 1", "Person", 1, [])
		const task2 = new Task("T2", "Task 2", "Person", 2, [])
		const task3 = new Task("T3", "Task 3", "Person", 3, ["T1"])
		const task4 = new Task("T4", "Task 4", "Person", 4, ["T1"])
		const task5 = new Task("T5", "Task 5", "Person", 5, ["T6"])
		const task6 = new Task("T6", "Task 6", "Person", 6, ["T5"]) // will lead to circular dependency
		
		// test duplicate identifier finding
		expect(() => checkNoDuplicateIdentifiersInTasks([task1, task2, task3, task4, task5, task6])).not.toThrow()
		expect(() => checkNoDuplicateIdentifiersInTasks([task1, task2, task3, task4, task5, task6, task5])).toThrow(ValidationError) // task 5 is in there twice
		
		// test ghost references
		expect(() => checkNoGhostReferencesInTasks([task1, task2, task3, task4, task5, task6])).not.toThrow()
		expect(() => checkNoGhostReferencesInTasks([task1, task2, task3, task4, task6])).toThrow(ValidationError) // task 5 is not in there for 6 to reference
		
		// test circular dependencies
		expect(() => checkNoCircularDependenciesInTasks([task1, task2, task3, task4])).not.toThrow()
		expect(() => checkNoCircularDependenciesInTasks([task1, task2, task3, task4, task5, task6])).toThrow(ValidationError) // task 5 and 6 reference each other
		
		// all together now
		expect(() => checkTaskList([task1, task2, task3, task4])).not.toThrow()
		expect(() => checkTaskList([task1, task2, task3, task4, task3])).toThrow(ValidationError) // will fail on no duplicate identifiers
		expect(() => checkTaskList([task1, task2, task3, task4, task5])).toThrow(ValidationError) // will fail on no ghost references
		expect(() => checkTaskList([task1, task2, task3, task4, task5, task6])).toThrow(ValidationError) // will fail on no circular dependencies
	})
	
	test("Group List Validation", () => {
		// set up groups
		const group1 = new Group("G1", "Group 1", ["T1", "T2", "G3"])
		const group2 = new Group("G2", "Group 2", ["T2", "T3"])
		const group3 = new Group("G3", "Group 3", ["T3", "G4"])
		const group4 = new Group("G4", "Group 4", ["T4", "T5"])
		const group5 = new Group("G5", "Group 5", ["T2", "G6"])
		const group6 = new Group("G6", "Group 6", ["T3", "G5"])
		
		// test duplicate identifier finding
		expect(() => checkNoDuplicateIdentifiersInGroups([group1, group2, group3, group4])).not.toThrow()
		expect(() => checkNoDuplicateIdentifiersInGroups([group1, group2, group3, group4, group2])).toThrow(ValidationError)
		
		// test circular dependencies
		expect(() => checkNoCircularDependenciesInGroups([group1, group2, group3, group4])).not.toThrow()
		expect(() => checkNoCircularDependenciesInGroups([group1, group2, group3, group4, group5, group6])).toThrow(ValidationError)
		
		// all together now
		expect(() => checkGroupList([group1, group2, group3, group4])).not.toThrow()
		expect(() => checkGroupList([group1, group2, group3, group4, group2])).toThrow(ValidationError) // will fail on duplicate identifier
		expect(() => checkGroupList([group1, group2, group3, group4, group5, group6])).toThrow(ValidationError) // will fail on circular dependency
	})
})

describe("Task Transformation", () => { // set up tasks & groups
	const task1 = new Task("T1", "Task 1", "Person", 1, [])
	const task2 = new Task("T2", "Task 2", "Person", 2, ["T1"])
	const task3 = new Task("T3", "Task 3", "Person", 3, ["T1"])
	const task4 = new Task("T4", "Task 4", "Person", 4, [])
	const task5 = new Task("T5", "Task 5", "Person", 5, ["T4"])
	const task6 = new Task("T6", "Task 6", "Person", 6, ["T5"])
	const task7 = new Task("T7", "Task 7", "Person", 7, ["G1"])

	const group1 = new Group("G1", "Group 1", ["T1", "T2", "G2"])
	const group2 = new Group("G2", "Group 2", ["T1", "T4"])
	
	test("Task Full Referencing", () => {
		expect(fullReferenceTasks([task1, task2, task3, task4, task5, task6])[5].dependencies).toContain("T4") // task 6 depends on task 4 but doesn't say so directly
	})
	
	test("Task Internalization", () => {
		const internalizedTasks = internalizeTasks([task1, task2, task3, task4, task5, task6, task7], [group1, group2])
		// TODO: check sorting too
		// FIXME: not guaranteed to be index 6 here (below)
		expect(internalizedTasks[6].dependencies).toContain("T1") // test that groups got replaced
		expect(internalizedTasks[6].dependencies).toContain("T4") // test that groups got replaced recursively
	})
})