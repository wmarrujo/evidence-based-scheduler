import {Project} from "@/index"

////////////////////////////////////////////////////////////////////////////////
// SET UP SCENARIO
////////////////////////////////////////////////////////////////////////////////

const project = Project.fromObject({
	start: "2020-03-23",
	tasks: [
		{identifier: "T1", name: "Design", resource: "Architect", prediction: 16},
		{identifier: "T2", name: "Lay Foundation", resource: "Carpenter", prediction: 16, dependencies: ["T1"]},
		{identifier: "T3", name: "Build Walls", resource: "Carpenter", prediction: 16, dependencies: ["T2"]},
		{identifier: "T4", name: "Build Roof", resource: "Carpenter", prediction: 16, dependencies: ["T3"]},
		{identifier: "T5", name: "Check Building Code", resource: "Inspector", prediction: 16, dependencies: ["T1"]},
		{identifier: "T6", name: "Design Interior", resource: "Decorator", prediction: 16, dependencies: ["T1"]},
		{identifier: "T7", name: "Paint Kitchen", resource: "Painter", prediction: 16, dependencies: ["T2"]},
		{identifier: "T8", name: "Paint Bathroom", resource: "Painter", prediction: 16, dependencies: ["T2"]},
		{identifier: "T9", name: "Paint Bedroom", resource: "Painter", prediction: 16, dependencies: ["T2"]},
		{identifier: "T10", name: "Furnish Kitchen", resource: "Decorator", prediction: 16, dependencies: ["T7", "G2"]},
		{identifier: "T11", name: "Furnish Bathroom", resource: "Decorator", prediction: 16, dependencies: ["T8", "G2"]},
		{identifier: "T12", name: "Furnish Bedroom", resource: "Decorator", prediction: 16, dependencies: ["T9", "G2"]},
		{identifier: "T13", name: "Final Inspection", resource: "Inspector", prediction: 16, dependencies: ["G4"]}
	],
	groups: [
		{identifier: "G1", tasks: ["T1", "T6"]},
		{identifier: "G2", tasks: ["T2", "T3", "T4"]},
		{identifier: "G3", tasks: ["T7", "T8", "T9"]},
		{identifier: "G4", tasks: ["T10", "T11", "T12"]}
	],
	schedules: {
		"Architect": ["include from 09:00 to 17:00 every weekday"],
		"Carpenter": ["include from 12:00 to 17:00 every weekday", "exclude every friday"],
		"Painter": ["include from 08:00 to 18:00 every weekday", "exclude every monday"],
		"Decorator": ["include from 09:00 to 17:00 every weekday"],
		"Inspector": ["include from 15:00 to 17:00 every thursday"]
	},
	accuracies: {
		"Architect": [0.9, 0.85, 1.1, 0.95, 0.9],
		"Carpenter": [1.3, 1.2, 0.9, 1.0, 1.1, 1.2, 1.2, 1.3, 1.1],
		"Painter": [1.2, 1.2, 1.1, 0.8, 1.0, 0.9, 0.9, 1.0],
		"Decorator": [1.0, 1.0, 0.6, 2.0],
		"Inspector": [0.7, 0.5, 0.9, 0.9]
	}
})

// DEBUG: show task actual dependencies
// import {internalizeTasks} from "@/Task"
// console.log(internalizeTasks(project.tasks, project.groups).map(task => task.identifier + " " + JSON.stringify([...task.dependencies])))
// console.log(project.tasks.map(task => task.identifier + " " + JSON.stringify([...task.dependencies])))

////////////////////////////////////////////////////////////////////////////////
// TEST STRUCTURE
////////////////////////////////////////////////////////////////////////////////

describe("Project Structure", () => {
	test("Project Definition", () => {
		expect(project.start).toBe("2020-03-23")
		// expect(project.tasks.length).toBe(13)
		// TODO: more tests
	})
})

////////////////////////////////////////////////////////////////////////////////
// TEST PREDICTIONS
////////////////////////////////////////////////////////////////////////////////

