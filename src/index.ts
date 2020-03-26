import "module-alias/register"

import {DateTime} from "luxon"
import {ResourceIdentifier, ISODateString, ScheduleRuleString, Accuracy, Probability, TaskIdentifier, ISODateTimeString} from "@/types"
import {Task, Group, internalizeTasks} from "@/Task"
import {Schedule, Period} from "@/Schedule"
import {Performance} from "@/Performance"
import {cumulativeProbability} from "@/Probability"

// RE-EXPORTS

export {Task, Group} from "@/Task" // so the user can make tasks & groups to add to the project
export {ValidationError} from "@/Error" // so the user can check for the proper error type

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
	#taskSchedule: Array<ScheduledTask> | undefined // chached last schedule build
	
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
	
	get taskSchedule(): Array<{task: Task, begin: ISODateTimeString, end: ISODateTimeString}> {
		if (!this.#taskSchedule) { // if task schedule hasn't been generated yet
			this.#taskSchedule = scheduleTasks(this.#tasks, this.#start, this.#schedules) // generate schedule assuming prediction accuracy = 1
		}
		return this.#taskSchedule
			.map(scheduledTask => {
				return {
					task: this.tasks.find(task => task.identifier == scheduledTask.task)!, // get the actual task
					begin: scheduledTask.begin.toISO(),
					end: scheduledTask.end.toISO()
				}
			})
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
	
	scheduleInRangeForResource(resource: ResourceIdentifier, fromString: ISODateString, toString: ISODateString): Array<Period> { // returns the list of events
		const schedule = this.#schedules[resource]
		
		const from = DateTime.fromISO(fromString)
		const to = DateTime.fromISO(toString)
		// TODO: date validation
		
		return schedule.periodsInRange(from, to)
	}
}

////////////////////////////////////////////////////////////////////////////////
// SIMULATION
////////////////////////////////////////////////////////////////////////////////

function monteCarloSimulations(tasks: Array<Task>, performances: Record<ResourceIdentifier, Performance>, schedules: Record<ResourceIdentifier, Schedule>, iterations: number): Array<DateTime> { // get many simulated possible end dates for the task list
	const dates = []
	process.stdout.write("\rsimulations: 0")
	for (let i = 0; i <= iterations; i++) { // do 1000 simulations
		dates.push(simulateTaskList(tasks, performances, schedules)) // simulate one potential schedule
		process.stdout.write(`\rsimulations: ${i}`)
	}
	process.stdout.write("\n")
	return dates
}

function simulateTaskList(tasks: Array<Task>, performances: Record<ResourceIdentifier, Performance>, schedules: Record<ResourceIdentifier, Schedule>): DateTime {
	// assumes there is a performance for each resource
	// assumes tasks are internalized
	
	const today = DateTime.local()
	
	// get accuracies
	const taskAccuracies = tasks.reduce((accuracies, task) => {
		accuracies[task.identifier] = performances[task.resource].randomAccuracy()
		return accuracies
	}, {} as Record<TaskIdentifier, Accuracy>)
	
	// get schedules with new accuracies
	const scheduledTasks = scheduleTasks(tasks, today, schedules, taskAccuracies)
	
	return scheduledTasks.reduce((latestEnd, scheduledTask) => latestEnd < scheduledTask.end ? scheduledTask.end : latestEnd, today) // find the latest task end date
}

////////////////////////////////////////////////////////////////////////////////
// TASK SCHEDULING
////////////////////////////////////////////////////////////////////////////////

interface ScheduledTask {
	task: TaskIdentifier,
	begin: DateTime,
	end: DateTime
}

function scheduleTasks(tasks: Array<Task>, from: DateTime, schedules: Record<ResourceIdentifier, Schedule>, accuracies: Record<TaskIdentifier, Accuracy> = {}): Array<ScheduledTask> {
	// assumes tasks are internalized
	
	const taskReference = tasks
		.reduce((reference, task) => {
			reference[task.identifier] = task
			return reference
		}, {} as Record<TaskIdentifier, Task>)
	
	const scheduledTasks: Array<ScheduledTask> = [] // the tasks that have already been scheduled
	const unscheduledTasks: Array<ScheduledTask> = tasks // the tasks that have yet to be scheduled (with cached "as scheduled so far" information)
		.map(task => ({task: task.identifier, begin: from, end: from})) // haven't figured out when their end can be yet
	
	for (let i = 0; i < tasks.length; i++) {
		const task = tasks[i] // a reference to the actual task
		let t = unscheduledTasks.shift()! // pop off the stack the task we're scheduling (modify this object)
		
		// find task begin date
		t.begin = schedules[task.resource].getNextBeginFrom(t.begin) // set the begin date to the next available from the current date
		for (let s = 0; s < scheduledTasks.length; s++) { // go through list of already scheduled tasks
			const st = scheduledTasks[s]
			const scheduledTask = taskReference[st.task]
			if (scheduledTask.resource == task.resource && st.begin <= t.begin && t.begin < st.end) { // if the task will overlap on the resource with a previously scheduled task
				t.begin = st.end // set the task to start after the end of the conflicting task
				t.begin = schedules[task.resource].getNextBeginFrom(t.begin) // check if this is valid, if not move to the next valid time & check again with other scheduled tasks
				s = 0 // check them all again, since scheduling might be weird
			}
		}
		
		// find task end date
		t.end = t.begin // set the end to at least be >= the begin date
		let hoursLeft = task.done ? task.actual : (task.prediction * (accuracies[task.identifier] || 1)) // how many hours do we have to do work on
		while (hoursLeft != 0) { // until we've worked all hours
			const nextEnd = schedules[task.resource].getNextEndFrom(t.end) // find the next time we'll have to stop working on this task
			const hoursUntilNextEnd = nextEnd.diff(t.end, "hours").hours // get the hours until the next time work ends
			const hoursPotentiallyWorked = Math.min(hoursLeft, hoursUntilNextEnd) // get the maximum hours it can add by that time
			if (hoursPotentiallyWorked == hoursUntilNextEnd) { // if we worked until the next end
				t.end = nextEnd // set that as the new end
			} else { // we finished the task before the next end
				t.end = t.end.plus({hours: hoursPotentiallyWorked}) // we worked `hoursPotentiallyWorked` since the last time we set the end time
			}
			hoursLeft -= hoursPotentiallyWorked // count these hours as having been worked
		}
		
		scheduledTasks.push(t) // add the scheduled task to the list of scheduled tasks
	}
	
	return scheduledTasks // return the list of scheduled tasks
}