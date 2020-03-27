import {scheduleTasks} from "@/Project"
import {Task} from "@/Task"
import {DateTime} from "luxon"
import {Schedule} from "@/Schedule"

describe("Task Scheduling", () => {
	const tasks = [ // tasks
		new Task("T1", "Task 1", "Person", 2, []),
		new Task("T2", "Task 2", "Person", 2, ["T1"]),
		new Task("T3", "Task 2", "Person", 8, ["T3"])
	]
	const friday = DateTime.fromISO("2020-03-27") // start date
	const monday = DateTime.fromISO("2020-03-30") // the monday after
	const schedule = new Schedule(["include from 09:00 to 17:00 every weekday"]) // regular 9-5
	
	const scheduledTasks = scheduleTasks(tasks, friday, {"Person": schedule}) // schedule tasks assuming 100% accuracy
	
	test("Task Sequencing", () => {
		expect(scheduledTasks[0].begin.hasSame(friday.set({hour: 9}), "minute")).toBeTruthy() // T1 begin, first opportunity
		expect(scheduledTasks[0].end.hasSame(friday.set({hour: 11}), "minute")).toBeTruthy() // T1 end, 2 hours later
		expect(scheduledTasks[1].begin.hasSame(friday.set({hour: 11}), "minute")).toBeTruthy() // T2 begin, immediately after
		expect(scheduledTasks[1].end.hasSame(friday.set({hour: 13}), "minute")).toBeTruthy() // T2 end, 2 hours later
		expect(scheduledTasks[2].begin.hasSame(friday.set({hour: 13}), "minute")).toBeTruthy() // T3 begin, immediately after
		expect(scheduledTasks[2].end.hasSame(monday.set({hour: 13}), "minute")).toBeTruthy() // T3 end, the same time on the next work day
	})
})