import {ValidationError} from "@/Error"
import {TaskIdentifier, ResourceIdentifier} from "@/types"

////////////////////////////////////////////////////////////////////////////////
// CLASS
////////////////////////////////////////////////////////////////////////////////

export class Task {
	identifier: TaskIdentifier
	name: string
	description: string
	resource: ResourceIdentifier
	dependencies: Set<TaskIdentifier>
	prediction: number
	actual: number
	done: boolean
	
	constructor(identifier: TaskIdentifier, name: string, resource: ResourceIdentifier, prediction: number, dependencies: Iterable<TaskIdentifier> = [], actual: number = 0, done = false, description: string = "" ) {
		this.identifier = identifier
		this.name = name
		this.description = description
		this.resource = resource
		this.dependencies = new Set([...dependencies])
		this.prediction = prediction
		this.actual = actual
		this.done = done
	}
	
	get velocity(): number | undefined {
		return this.actual ? this.actual / this.prediction : undefined
	}
}

export class Group {
	identifier: TaskIdentifier
	name: string
	description: string
	tasks: Array<Task>
	
	constructor() {
		
	}
	
	get resources(): Array<ResourceIdentifier> {
		
	}
}

////////////////////////////////////////////////////////////////////////////////
// RE-ASSOCIATION
////////////////////////////////////////////////////////////////////////////////

export function internalizeTasks(tasks: Array<Task>, groups: Array<Group>): Array<Task> { // remove the group references in tasks
	// TODO: remove task references to groups
}

////////////////////////////////////////////////////////////////////////////////
// VALIDATION
////////////////////////////////////////////////////////////////////////////////

export function checkTaskList(tasks: Array<Task>) { // make sure a list of tasks is self-consistent
	// assumes tasks are internalized
	checkNoDuplicateIdentifiers(tasks)
	checkNoGhostReferences(tasks)
	checkNoCircularDependencies(tasks)
}

export function checkNoDuplicateIdentifiers(tasks: Array<Task>) { // check that there are no duplicate keys
	if (tasks.length != new Set(tasks.map(task => task.identifier)).size) { // if set and array are not the same
		const checked: Array<TaskIdentifier> = []
		tasks
			.map(task => task.identifier)
			.forEach(task => {
				if (checked.includes(task)) {
					throw new ValidationError(`Validation Error: Duplicate task found in task list ${task}`)
				} else {
					checked.push(task)
				}
			})
	}
}

export function checkNoGhostReferences(tasks: Array<Task>) { // check that all the references are defined within the task list
	const taskSet = new Set(tasks.map(task => task.identifier)) // the set of tasks
	return tasks.every(task => [...task.dependencies.values()].every(dependency => taskSet.has(dependency))) // every dependency of every task is in the set of tasks
}

export function checkNoCircularDependencies(tasks: Array<Task>) { // check whether there are any circular dependencies
	// assumes no duplicate identifiers in tasks
	// assumes all tasks have references that exist
	const dependencies = tasks
		.reduce((ds: Record<TaskIdentifier, Set<TaskIdentifier>>, task) => {
			ds[task.identifier] = task.dependencies
			return ds
		}, {})
	
	try { // uses a throw to get out of nested functions
		Object.keys(dependencies).forEach(task => { // per each task
			// the the list of dependency paths
			let paths = [...dependencies[task].values()].map(dependency => [dependency]) // seed the paths with the level-1 dependencies
			// go down the paths, checking that no new dependencies make any path circular
			while (paths.length != 0) { // continue until we've finished going down all the paths
				paths = paths // reset paths with the new dependencies
					.map(path => { // turn every path into a list of paths with the next dependencies on the end
						const nextDependencies = [...dependencies[path[path.length-1]].values()] // get the next dependencies
						return nextDependencies.map(dependency => {
							if (path.includes(dependency)) { // if the path already includes that dependency
								throw Error("Circular Dependency") // then it's a circular dependency
							} else { // the path does not include the dependency
								return path.concat([dependency])
							}
						})
					})
					.flat() // put all paths back in the path list as samel-level things, also remove any paths that have finished
			}
		})
		return true // no duplicates were discovered
	} catch (error) {
		if (error.message == "Circular Dependency") { // it was a circular dependency error
			return false // there was a circular dependency
		} else {
			throw error // re-throw the error, something different happened wrong
		}
	}
}