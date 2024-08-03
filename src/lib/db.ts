import Dexie, {type EntityTable} from "dexie"
import type {Readable} from "svelte/store"

////////////////////////////////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////////////////////////////////

export type Velocity = number
export type Hours = number

export type ResourceId = number
export type Resource = {
	id: ResourceId
	name: string
	// TODO: add schedules
	// TODO: add type, like "external" or "machine" which will have different estimate limit warnings
	velocities: Array<Velocity> // the last 250 velocities, used for sampling // TODO: allow how many are taken into account to be changed in settings
}

export type TaskId = number
export type Task = {
	id: TaskId
	name: string
	description: string
	doer: ResourceId
	estimate: Hours // the current estimate, in hours
	spent: Hours // the spent time spent, in hours
	done: boolean
	dependsOn: Array<TaskId>
	// TODO: add priority
}

export type ProjectId = number
export type Project = {
	id: ProjectId
	name: string
	description: string
	tasks: Array<TaskId>
}

export type MilestoneId = number
export type Milestone = {
	id: MilestoneId
	name: string
	description: string
	dependsOn: Array<TaskId>
}

////////////////////////////////////////////////////////////////////////////////
// DATABASE
////////////////////////////////////////////////////////////////////////////////

export const db = new Dexie("plan") as Dexie & {
	resources: EntityTable<Resource, "id">,
	tasks: EntityTable<Task, "id">,
	projects: EntityTable<Project, "id">,
	milestones: EntityTable<Milestone, "id">,
}

db.version(1).stores({
	resources: "++id, name",
	tasks: "++id, name",
	projects: "++id, name",
	milestones: "++id, name",
})

// fix of: https://github.com/dexie/Dexie.js/issues/1907
export function liveQuery<T>(querier: () => T | Promise<T>): Readable<T> {
	const dexieObservable = Dexie.liveQuery(querier)
	return {subscribe(run, invalidate) { return dexieObservable.subscribe(run, invalidate).unsubscribe }}
}
