import Dexie, {type EntityTable} from "dexie"

////////////////////////////////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////////////////////////////////

export type ResourceId = number
export type Resource = {
	id: ResourceId
	name: string
	// TODO: add schedules
	// TODO: add type, like "external" or "machine" which will have different estimate limit warnings
}

export type TaskId = number
export type Task = {
	id: TaskId
	name: string
	description: string | undefined
	doer: ResourceId | undefined // TODO: make this required, or at least give a prominent warning
	original: number // the original estimate, in hours // TODO: remove this
	estimate: number // the current estimate, in hours
	spent: number // the spent time spent, in hours
	done: boolean
	abandoned: boolean
	dependsOn: Array<TaskId>
	// TODO: add priority
}

export type ProjectId = number
export type Project = {
	id: ProjectId
	name: string
	description: string | undefined
	tasks: Array<TaskId>
}

export type MilestoneId = number
export type Milestone = {
	id: MilestoneId
	name: string
	description: string | undefined
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
