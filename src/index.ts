import {DateTime} from "luxon"
import {ResourceIdentifier, ISODateString, ScheduleRuleString, Accuracy, Probability, TaskIdentifier, Hours} from "@/types"
import {Task, Group, internalizeTasks} from "@/Task"
import {Schedule} from "@/Schedule"
import {Performance} from "@/Performance"
import {cumulativeProbability} from "@/Probability"

// RE-EXPORTS

export {Task, Group} from "@/Task" // so the user can make tasks & groups to add to the project
export {ValidationError, ParseError} from "@/Error" // so the user can check for the proper error type

////////////////////////////////////////////////////////////////////////////////
// PROJECT OBJECT
////////////////////////////////////////////////////////////////////////////////

export class Project {
	name: string
	#start: DateTime
	tasks: Array<Task> // store tasks with group references for later viewing
	#tasks: Array<Task> // store the corresponding internalized tasks list
	groups: Array<Group> // store for later viewing
	#schedules: Record<ResourceIdentifier, Schedule>
	#performances: Record<ResourceIdentifier, Performance>
	snapshots: Record<ISODateString, Record<Probability, ISODateString>>
	#simulations: Array<DateTime> | undefined // cached last simulation
	
	constructor(name: string, start: string, tasks: Array<Task>, groups: Array<Group>, schedules: Record<ResourceIdentifier, Array<ScheduleRuleString>>, accuracies: Record<ResourceIdentifier, Array<Accuracy>> = {}, snapshots: Record<ISODateString, Record<Probability, ISODateString>> = {}) {
		this.name = name
		this.#start = DateTime.fromISO(start)
		this.tasks = tasks
		this.#tasks = internalizeTasks(tasks, groups)
		this.groups = groups
		// TODO: ensure there are schedules for each resource
		this.#schedules = Object.keys(schedules).reduce((newSchedules, resource) => {
			newSchedules[resource] = new Schedule(schedules[resource])
			return newSchedules
		}, {} as Record<ResourceIdentifier, Schedule>)
		// TODO: ensure there are performances for each resource
		this.#performances = Object.keys(accuracies).reduce((newPerformances, resource) => {
			newPerformances[resource] = new Performance(accuracies[resource])
			return newPerformances
		}, {} as Record<ResourceIdentifier, Performance>)
		this.snapshots = snapshots
	}
	
	// GETTERS
	
	get start(): string { // get the start date as an ISO string
		return this.#start.toISODate()
	}
	
	// TODO: don't allow access directly to tasks & groups, instead have getters & setters that reset the simulations & re-check the resources & stuff
	
	// SETTERS
	
	set start(date: string) {
		this.#start = DateTime.fromISO(date)
	}
	
	// MODIFIERS
	
	// TODO: add & remove tasks
	// TODO: add & remove groups
	// TODO: include more performance information
	// etc.
	
	// reset 
	
	// METHODS
	
	probabilityOfEndingOnDate(dateString: ISODateString): Probability { // returns a function that when asked about ending on a certain date it gives a certain probability
		const date = DateTime.fromISO(dateString)
		
		if (!this.#simulations) { // if simulations have been done
			// run simulations
			const simulationDates = monteCarloSimulations(this.#tasks, this.#performances, this.#schedules, 1000)
			
			// cache simulation
			this.#simulations = simulationDates
		}
		
		return cumulativeProbability(this.#simulations, date)
	}
}

////////////////////////////////////////////////////////////////////////////////
// SIMULATION
////////////////////////////////////////////////////////////////////////////////

function monteCarloSimulations(tasks: Array<Task>, performances: Record<ResourceIdentifier, Performance>, schedules: Record<ResourceIdentifier, Schedule>, iterations: number): Array<DateTime> { // get many simulated possible end dates for the task list
	const dates = []
	for (let i = 0; i <= iterations; i++) { // do 1000 simulations
		dates.push(simulateTaskList(tasks, performances, schedules)) // simulate one potential schedule
	}
	return dates
}

function simulateTaskList(tasks: Array<Task>, performances: Record<ResourceIdentifier, Performance>, schedules: Record<ResourceIdentifier, Schedule>): DateTime {
	// assumes there is a performance for each resource
	// assumes tasks are internalized
	const taskAccuracies = tasks.reduce((accuracies, task) => {
		accuracies[task.identifier] = performances[task.resource].randomAccuracy()
		return accuracies
	}, {} as Record<TaskIdentifier, Accuracy>)
	
	// TODO: give each task a begin and end date based on the schedule for each resource
	// TODO: see how far out the last one is, return that date
}