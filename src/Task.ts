import {TaskIdentifier, ResourceIdentifier} from "@/types"
import {ValidationError} from "@/Error"

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
	
	constructor(identifier: TaskIdentifier, name: string, resource: ResourceIdentifier, prediction: number, dependencies: Iterable<TaskIdentifier> = [], actual: number = 0, done = false, description: string = "") {
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
	tasks: Set<TaskIdentifier>
	
	constructor(identifier: TaskIdentifier, name: string, tasks: Iterable<TaskIdentifier>, description: string = "") {
		this.identifier = identifier
		this.name = name
		this.description = description
		this.tasks = new Set([...tasks])
	}
}

////////////////////////////////////////////////////////////////////////////////
// RE-ASSOCIATION
////////////////////////////////////////////////////////////////////////////////

export function internalizeTasks(tasks: Array<Task>, groups: Array<Group>): Array<Task> { // remove the group references in tasks
	// check if groups are self-consistent (not recursive)
	checkGroupList(groups)
	// replace all group identifiers in tasks with their group's tasks
	const groupDependencies = groups
		.reduce((ds: Record<TaskIdentifier, Set<TaskIdentifier>>, group) => {
			ds[group.identifier] = group.tasks
			return ds
		}, {})
	
	return tasks.map(task => {
		// replace all group dependencies with task ones
		let newDependencies: Array<string | Array<string>> = [...task.dependencies] // seed it with the old dependencies
		let replacement = false // set replacements
		do { // go through each dependency
			replacement = false // reset replacements
			newDependencies.forEach((dependency, index) => {
				if (groupDependencies[dependency as string]) { // if it's a group
					newDependencies[index] = [...groupDependencies[dependency as string]] // replace it with the group's dependency list
					replacement = true // there was a replacement
				}
			})
			newDependencies = newDependencies.flat() // flatten any arrays we just added
		} while (replacement) // end when it checked everything, and there were no
		// return a copy of the task with new, internally referencing dependencies
		return new Task(task.identifier, task.name, task.resource, task.prediction, newDependencies as Array<string>, task.actual, task.done, task.description)
	})
}

////////////////////////////////////////////////////////////////////////////////
// VALIDATION
////////////////////////////////////////////////////////////////////////////////

// TASKS

export function checkTaskList(tasks: Array<Task>): void { // make sure a list of tasks is self-consistent
	// assumes tasks are internalized
	checkNoDuplicateIdentifiersInTasks(tasks)
	checkNoGhostReferencesInTasks(tasks)
	checkNoCircularDependenciesInTasks(tasks)
}

export function checkNoDuplicateIdentifiersInTasks(tasks: Array<Task>): void { // check that there are no duplicate keys
	if (tasks.length != new Set(tasks.map(task => task.identifier)).size) { // if set and array are not the same
		const checked: Array<TaskIdentifier> = []
		tasks
			.map(task => task.identifier)
			.forEach(task => {
				if (checked.includes(task)) {
					throw new ValidationError(`Duplicate task found in task list: ${task}`)
				} else {
					checked.push(task)
				}
			})
	}
}

export function checkNoGhostReferencesInTasks(tasks: Array<Task>): void { // check that all the references are defined within the task list
	const taskSet = new Set(tasks.map(task => task.identifier)) // the set of tasks
	tasks.forEach(task => {
		task.dependencies.forEach(dependency => {
			if (!taskSet.has(dependency)) throw new ValidationError(`Dependency ${dependency} of task ${task.identifier} does not exist`)
		})
	})
}

export function checkNoCircularDependenciesInTasks(tasks: Array<Task>): void { // check whether there are any circular dependencies
	// assumes no duplicate identifiers in tasks
	// assumes all tasks have references that exist
	const dependencies = tasks
		.reduce((ds: Record<TaskIdentifier, Set<TaskIdentifier>>, task) => {
			ds[task.identifier] = task.dependencies
			return ds
		}, {})
	
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
							throw new ValidationError(`Circular Dependency in task: ${path.join(" -> ")} -> ${dependency}`) // then it's a circular dependency
						} else { // the path does not include the dependency
							return path.concat([dependency]) // add the dependency to the path
						}
					})
				})
				.flat() // put all paths back in the path list as samel-level things, also remove any paths that have finished
		}
	})
}

// GROUPS

export function checkGroupList(groups: Array<Group>): void {
	checkNoDuplicateIdentifiersInGroups(groups)
	checkNoCircularDependenciesInGroups(groups)
}

export function checkNoDuplicateIdentifiersInGroups(groups: Array<Group>): void {
	if (groups.length != new Set(groups.map(task => task.identifier)).size) { // if set and array are not the same
		const checked: Array<TaskIdentifier> = []
		groups
			.map(group => group.identifier)
			.forEach(group => {
				if (checked.includes(group)) {
					throw new ValidationError(`Duplicate group found in group list: ${group}`)
				} else {
					checked.push(group)
				}
			})
	}
}

export function checkNoCircularDependenciesInGroups(groups: Array<Group>): void {
	// assumes no duplicate identifiers in groups
	const dependencies = groups
		.reduce((ds: Record<TaskIdentifier, Set<TaskIdentifier>>, group) => {
			ds[group.identifier] = group.tasks
			return ds
		}, {})
	
	Object.keys(dependencies).forEach(group => { // per each group
		// the the list of dependency paths
		let paths = [...dependencies[group].values()].map(dependency => [dependency]) // seed the paths with the level-1 dependencies
		// go down the paths, checking that no new dependencies make any path circular
		while (paths.length != 0) { // continue until we've finished going down all the paths
			paths = paths // reset paths with the new dependencies
				.map(path => { // turn every path into a list of paths with the next dependencies on the end
					const nextDependencies = [...(dependencies[path[path.length-1]] || []).values()] // get the next dependencies
					return nextDependencies.map(dependency => {
						if (path.includes(dependency)) { // if the path already includes that dependency
							throw new ValidationError(`Circular Dependency in group: ${path.join(" -> ")} -> ${dependency}`) // then it's a circular dependency
						} else { // the path does not include the dependency
							return path.concat([dependency]) // add the dependency to the path
						}
					})
				})
				.flat() // put all paths back in the path list as samel-level things, also remove any paths that have finished
		}
	})
}