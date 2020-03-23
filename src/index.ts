import {DateTime} from "luxon"
import {ResourceIdentifier, ISODateString, ScheduleRuleString, Velocity, Probability} from "@/types"
import {Task, Group, internalizeTasks, checkTaskList} from "@/Task"
import {Schedule} from "@/Schedule"
import {Performance} from "@/Performance"

// RE-EXPORTS

export {Task, Group} from "@/Task" // so the user can make tasks & groups to add to the project
export {ValidationError, ParseError} from "@/Error" // so the user can check for the proper error type

////////////////////////////////////////////////////////////////////////////////
// PROJECT OBJECT
////////////////////////////////////////////////////////////////////////////////

export class Project {
	name: string
	#start: DateTime
	tasks: Array<Task> // story only internally referencing tasks
	groups: Array<Group> // store for later viewing
	#schedules: Record<ResourceIdentifier, Schedule>
	#performances: Record<ResourceIdentifier, Performance>
	snapshots: Record<ISODateString, Record<Probability, ISODateString>>
	
	constructor(name: string, start: string, tasks: Array<Task>, groups: Array<Group>, schedules: Record<ResourceIdentifier, Array<ScheduleRuleString>>, velocities: Record<ResourceIdentifier, Array<Velocity>> = {}, snapshots: Record<ISODateString, Record<Probability, ISODateString>> = {}) {
		this.name = name
		this.#start = DateTime.fromISO(start)
		this.tasks = internalizeTasks(tasks, groups)
		checkTaskList(this.tasks) // fail if tasks aren't self-consistent
		this.groups = groups
		this.#schedules = Object.keys(schedules).reduce((newSchedules, resource) => {
			newSchedules[resource] = new Schedule(schedules[resource])
			return newSchedules
		}, {} as Record<ResourceIdentifier, Schedule>)
		this.#performances = Object.keys(velocities).reduce((newPerformances, resource) => {
			newPerformances[resource] = new Performance(velocities[resource])
			return newPerformances
		}, {} as Record<ResourceIdentifier, Performance>)
		this.snapshots = snapshots
	}
	
	// GETTERS
	
	get start(): string { // get the start date as an ISO string
		return this.#start.toISODate()
	}
	
	// SETTERS
	
	set start(date: string) {
		this.#start = DateTime.fromISO(date)
	}
	
	// MODIFIERS
	
	// TODO: add & remove tasks
	// TODO: add & remove groups
	// TODO: include more performance information
	// etc.
	
	// METHODS
	
	// probabilityOfEndingOnDate(dateString: ISODateString): Probability { // returns a function that when asked about ending on a certain date it gives a certain probability
	// 	const date = DateTime.fromISO(dateString)
	// 
	// 
	// }
}

////////////////////////////////////////////////////////////////////////////////
// SIMULATION
////////////////////////////////////////////////////////////////////////////////

// TODO: schedule things