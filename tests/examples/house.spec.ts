import {Project, Task, Group} from "@/index"

////////////////////////////////////////////////////////////////////////////////
// SET UP SCENARIO
////////////////////////////////////////////////////////////////////////////////

const project = new Project(
	"Small House", // project name
	"2020-03-23", // start date
	[ // task list
		new Task("T1", "Design", "Architect", 16),
		new Task("T2", "Lay Foundation", "Carpenter", 16, ["T1"]),
		new Task("T3", "Build Walls", "Carpenter", 16, ["T2"]),
		new Task("T4", "Build Roof", "Carpenter", 16, ["T3"]),
		new Task("T5", "Check Building Code", "Inspector", 4, ["T1"]),
		new Task("T6", "Design Interior", "Decorator", 4, ["T1"]),
		new Task("T7", "Paint Kitchen", "Painter", 5, ["T2"]),
		new Task("T8", "Paint Bathroom", "Painter", 3, ["T2"]),
		new Task("T9", "Paint Bedroom", "Painter", 5, ["T2"]),
		new Task("T10", "Furnish Kitchen", "Painter", 4, ["T7", "G2"]),
		new Task("T11", "Furnish Bathroom", "Painter", 3, ["T8", "G2"]),
		new Task("T12", "Furnish Bedroom", "Painter", 4, ["T9", "G2"]),
		new Task("T13", "Final Inspection", "Inspector", 5, ["G4"])
	],
	[ // groups list
		new Group("G1", "Design", ["T1"]),
		new Group("G2", "Build Structure", ["T2", "T3", "T4"]),
		new Group("G3", "Painting", ["T7", "T8", "T9"]),
		new Group("G4", "Furnishing", ["T10", "T11", "T12"])
	],
	{ // schedules
		"Architect": ["include from 09:00 to 17:00 every weekday"],
		"Carpenter": ["include from 12:00 to 17:00 every weekday", "exclude every friday"],
		"Painter": ["include from 08:00 to 18:00 every weekday", "exclude every monday"],
		"Decorator": ["include from 09:00 to 17:00 every weekday"],
		"Inspector": ["include from 15:00 to 17:00 every thursday"]
	},
	{ // velocities
		"Architect": [0.9, 0.85, 1.1, 0.95, 0.9],
		"Carpenter": [1.3, 1.2, 0.9, 1.0, 1.1, 1.2, 1.2, 1.3, 1.1],
		"Painter": [1.2, 1.2, 1.1, 0.8, 1.0, 0.9, 0.9, 1.0],
		"Decorator": [1.0, 1.0, 0.6, 2.0],
		"Inspector": [0.7, 0.5, 0.9, 0.9]
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
		expect(project.name).toBe("Small House")
		expect(project.start).toBe("2020-03-23")
		expect(project.tasks.length).toBe(13)
		expect(project.groups.length).toBe(4)
	})
})

////////////////////////////////////////////////////////////////////////////////
// TEST PREDICTIONS
////////////////////////////////////////////////////////////////////////////////

