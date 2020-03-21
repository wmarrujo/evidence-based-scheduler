////////////////////////////////////////////////////////////////////////////////
// CLASS
////////////////////////////////////////////////////////////////////////////////

export class Task {
	identifier: string
	name: string
	description: string
	resource: string
	dependencies: Set<string>
	prediction: number
	actual: number | undefined = undefined
	
	constructor(identifier: string, name: string, resource: string, prediction: number, dependencies: Iterable<string> = [], description: string = "", actual: number | undefined = undefined) {
		this.identifier = identifier
		this.name = name
		this.description = description
		this.resource = resource
		this.dependencies = new Set([...dependencies])
		this.prediction = prediction
		this.actual = actual
	}
	
	get velocity(): number | undefined {
		return this.actual ? this.actual / this.prediction : undefined
	}
}

////////////////////////////////////////////////////////////////////////////////
// VALIDATION
////////////////////////////////////////////////////////////////////////////////

export function validateTaskList(tasks: Array<Task>): boolean { // make sure a list of tasks is self-consistent
	return noDuplicateIdentifiers(tasks)
		|| noGhostReferences(tasks)
		|| noCircularDependencies(tasks)
}

export function noDuplicateIdentifiers(tasks: Array<Task>): boolean { // check that there are no duplicate keys
	return tasks.length == new Set(tasks.map(task => task.identifier)).size // size of set and array should be the same, if not, then there are duplicates
}

export function noGhostReferences(tasks: Array<Task>): boolean { // check that all the references are defined within the task list
	const taskSet = new Set(tasks.map(task => task.identifier)) // the set of tasks
	return tasks.every(task => [...task.dependencies.values()].every(dependency => taskSet.has(dependency))) // every dependency of every task is in the set of tasks
}

export function noCircularDependencies(tasks: Array<Task>): boolean { // check whether there are any circular dependencies
	// assumes no duplicate identifiers in tasks
	// assumes all tasks have references that exist
	const dependencies = tasks
		.reduce((ds: Record<string, Set<string>>, task) => {
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