import Dexie, {type EntityTable} from "dexie"

////////////////////////////////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////////////////////////////////

export type ResourceId = number
export type Resource = {
	id: ResourceId
	name: string
}

export type TaskId = number
export type Task = {
	id: TaskId
	name: string
	description: string | undefined
	doer: ResourceId | undefined
	originalEstimate: number // the original estimate, in hours
	estimate: number // the current estimate, in hours
	actual: number // the actual time spent, in hours
	dependsOn: Array<TaskId>
	
	// graph (cache these so it shows up how you left it when you load it the next time)
	x?: number | undefined
	y?: number | undefined
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
