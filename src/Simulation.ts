import {ResourceIdentifier, TaskIdentifier, Accuracy} from "./types/aliases"
import {DateTime} from "luxon"
import {Task} from "./Task"
import {Schedule} from "./Schedule"
import {Performance} from "./Performance"

////////////////////////////////////////////////////////////////////////////////
// SIMULATION
////////////////////////////////////////////////////////////////////////////////

/**
 * run many monte carlo simulations of the tasks, getting a list of end dates back
 * so they can be analyzed later
 */
export async function monteCarloSimulations(tasks: Array<Task>, performances: Record<ResourceIdentifier, Performance>, schedules: Record<ResourceIdentifier, Schedule>, iterations: number): Promise<Array<DateTime>> { // get many simulated possible end dates for the task list
	const dates = []
	
	for (let i = 0; i <= iterations; i++) { // do 1000 simulations
		dates.push(simulateTaskList(tasks, performances, schedules)) // simulate one potential schedule
	}
	
	return dates
}

/**
 * simulates a task list by applying random accuracies to the task predictions based
 * on the performance data supplied
 */
export function simulateTaskList(tasks: Array<Task>, performances: Record<ResourceIdentifier, Performance>, schedules: Record<ResourceIdentifier, Schedule>): DateTime {
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

export interface ScheduledTask {
	task: TaskIdentifier,
	begin: DateTime,
	end: DateTime
}

/**
 * Turn the tasks list into a list of tasks with begin and end times.
 * 
 * this function ensures that task dependencies are held, and sequences the tasks
 * such that no resource is doing two tasks at once.
 */
export function scheduleTasks(tasks: Array<Task>, from: DateTime, schedules: Record<ResourceIdentifier, Schedule>, accuracies: Record<TaskIdentifier, Accuracy> = {}): Array<ScheduledTask> {
	// assumes tasks are internalized
	
	const taskReference = tasks
		.reduce((reference, task) => {
			reference[task.identifier] = task
			return reference
		}, {} as Record<TaskIdentifier, Task>)
	
	const scheduledTasks: Array<ScheduledTask> = [] // the tasks that have already been scheduled
	const unscheduledTasks: Array<ScheduledTask> = tasks // the tasks that have yet to be scheduled (with cached "as scheduled so far" information)
		.map(task => ({task: task.identifier, begin: from, end: from})) // haven't figured out when their end can be yet
	
	for (let i = 0; i < tasks.length; i++) { // for each task in internalized order
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
				t.end = schedules[task.resource].getNextBeginFrom(nextEnd) // set the next beginning as the new end count
			} else { // we finished the task before the next end
				t.end = t.end.plus({hours: hoursPotentiallyWorked}) // we worked `hoursPotentiallyWorked` since the last time we set the end time
			}
			hoursLeft -= hoursPotentiallyWorked // count these hours as having been worked
		}
		
		scheduledTasks.push(t) // add the scheduled task to the list of scheduled tasks
	}
	
	return scheduledTasks // return the list of scheduled tasks
}