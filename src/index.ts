import {DateTime} from "luxon"
import {ResourceIdentifier, TaskIdentifier, ISODateString, ISODateTimeString} from "./types/aliases"
import {ProjectObject} from "./types/convenience"
import {ValidationError, rethrowValidationError} from "./Error"
import {Task, Group, internalizeTasks} from "./Task"
import {Schedule} from "./Schedule"
import {Performance} from "./Performance"
import {scheduleTasks} from "./Simulation"

// RE-EXPORTS

export {ValidationError} from "./Error"

////////////////////////////////////////////////////////////////////////////////
// PROJECT OBJECT
////////////////////////////////////////////////////////////////////////////////

/**
 * The container for all the project information.
 * 
 * {@link Project} objects are intended to be readonly, where the tasks are read 
 * in once and the output is queried from it. Any changes made return deep copies 
 * of the project object.
 *
 * Create new instances via the factory class methods.
 */
export class Project {
	// INSTANCE VARIABLES
	
	// set by constructor
	private _start: DateTime // internal representation
	private _tasks: Array<Task> // internal saving of tasks list
	private _schedules: Record<ResourceIdentifier, Schedule> // internal saving of schedules
	private _performances: Record<ResourceIdentifier, Performance> // internal saving of performances
	
	// caches
	private _taskSchedule: Array<{task: TaskIdentifier, begin: ISODateTimeString, end: ISODateTimeString}> | undefined = undefined // a cache of the generated schedule
	
	// CONSTRUCTOR
	
	constructor(start: DateTime, tasks: Array<Task>, schedules: Record<ResourceIdentifier, Schedule>, performances: Record<ResourceIdentifier, Performance>) {
		this._start = start
		this._tasks = tasks
		this._schedules = schedules
		this._performances = performances
	}
	
	// FACTORY FUNCTIONS
	
	/**
	 * Create a Project from an object with tasks, schedules and such specified 
	 * with reasonable defaults.
	 * 
	 * This function is intended to be forgiving. It will validate your input and
	 * return a {@link ValidationError} on any issues.
	 */
	static fromObject(projectObject: ProjectObject) {
		// start date
		
		let start = DateTime.local() // set to a default
		
		if (projectObject.start) { // if start is specified
			start = DateTime.fromISO(projectObject.start)
		}
		
		if (!start.isValid) {
			throw new ValidationError(start.invalidExplanation!, "invalid start date specified", "start")
		}
		
		// tasks
		
		let rawTasks = projectObject.tasks || [] // default is no tasks
		let rawGroups = projectObject.groups || [] // default is no groups
		
		// validate tasks
		try {
			rawTasks.forEach((task, index) => {
				if (!task.identifier) throw new ValidationError("no identifier for task", "project task", index)
				if (!task.resource) throw new ValidationError("no resource for task", "project task", index)
				if (!task.prediction) throw new ValidationError("no prediction for task duration", "project task", index)
			})
		} catch (error) {
			if (error instanceof ValidationError) { rethrowValidationError(error, "project task list", "tasks") } else { throw error }
		}
		
		// turn projectObject tasks into actual task objects
		const originalTasks = rawTasks.map(task => {
			return new Task(task.identifier, task.resource, task.prediction, task.dependencies, task.actual, task.done)
		})
		
		// validate groups
		try {
			rawGroups.forEach((group, index) => {
				if (!group.identifier) throw new ValidationError("no identifier for group", "project group", index)
			})
		} catch (error) {
			if (error instanceof ValidationError) { rethrowValidationError(error, "project group list", "groups") } else { throw error }
		}
		
		// turn projectObject groups into actual group objects
		const originalGroups = rawGroups.map(group => {
			return new Group(group.identifier, group.tasks || [])
		})
		
		// internalize tasks
		let tasks: Array<Task> = []
		try {
			tasks = internalizeTasks(originalTasks, originalGroups)
		} catch (error) {
			if (error instanceof ValidationError) { rethrowValidationError(error, "resolving groups", "groups") } else { throw error }
		}
		
		// get resources from tasks
		const resources = new Set(tasks.map(task => task.resource))
		
		// schedules
		
		// validate that there are schedules for each resource in the tasks
		resources.forEach(resource => {
			if (!new Set(Object.keys(projectObject.schedules)).has(resource)) throw new ValidationError("resource missing schedule", "checking that all resources have a schedule", resource)
		})
		
		let schedules = {}
		
		try {
			schedules = Object.keys(projectObject.schedules)
				.reduce((all, resource) => {
					try {
						all[resource] = new Schedule(projectObject.schedules[resource])
					} catch (error) {
						if (error instanceof ValidationError) { rethrowValidationError(error, "making schedule for a resource", resource) } else { throw error }
					}
					
					return all
				}, {} as Record<ResourceIdentifier, Schedule>)
		} catch (error) {
			if (error instanceof ValidationError) { rethrowValidationError(error, "making schedules", "schedules") } else { throw error }
		}
		
		// performances
		
		const performances = [...resources]
			.reduce((all, resource) => {
				// Record<ResourceIdentifier, Array<Accuracy>> | undefined
				let accuracies = tasks // include accuracies from finished tasks in this project
					.filter(task => task.done && task.resource == resource) // tasks which are done and for this resource
					.map(task => task.actual / task.prediction) // calculate the accuracies
				
				if (projectObject.accuracies && projectObject.accuracies[resource]) { // if performances was specified for this resource
					accuracies = accuracies.concat(projectObject.accuracies[resource]) // include the historical accuracies specified
				}
				
				all[resource] = new Performance(accuracies)
				return all
			}, {} as Record<ResourceIdentifier, Performance>)
		
		// output
		
		return new Project(start, tasks, schedules, performances)
	}
	
	// GETTERS
	
	get start(): ISODateString {
		return this._start.toISODate()
	}
	
	get schedule(): Array<{task: TaskIdentifier, begin: ISODateTimeString, end: ISODateTimeString}> {
		if (!this._taskSchedule) { // if the task schedule has not been calculated yet
			this._taskSchedule = scheduleTasks(this._tasks, this._start, this._schedules) // calculate it
				.map(scheduledTask => { // for each result
					return { // convert it into an exportable format
						task: scheduledTask.task,
						begin: scheduledTask.begin.toISO(),
						end: scheduledTask.end.toISO()
					}
				})
		}
		return this._taskSchedule
	}
	
	// SETTERS
	
	startOn(date: ISODateString): Project {
		const parsed = DateTime.fromISO(date)
		if (parsed.isValid) { // if it could parse the date
			return new Project(DateTime.fromISO(date), this._tasks, this._schedules, this._performances)
		} else { // if it could not parse the date
			throw new ValidationError(parsed.invalidExplanation!, "invalid date", date)
		}
	}
	
	// COMPUTED INSTANCE VARIABLES
	
	
	
	// INSTANCE FUNCTIONS
	
	
	
	// CLASS FUNCTIONS
}