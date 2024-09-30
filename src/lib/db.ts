import Dexie, {type EntityTable} from "dexie"
import {derived, type Readable} from "svelte/store"

////////////////////////////////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////////////////////////////////

export type Velocity = number
export type Hours = number

export type ResourceId = string
export type Resource = {
	id: ResourceId
	name: string
	// TODO: add schedules
	// TODO: add type, like "external" or "machine" which will have different estimate limit warnings
	velocities: Array<Velocity> // the last 250 velocities, used for sampling // TODO: allow how many are taken into account to be changed in settings
}

export type TagId = string
export type Tag = {
	id: TagId
	name: string
	description: string
	tags: Array<TagId> // the tag can "inherit" other tags
}

export type TaskId = string
export type Task = {
	id: TaskId
	name: string
	description: string
	doer: ResourceId
	estimate: Hours // the current estimate, in hours
	spent: Hours // the spent time spent, in hours
	done: boolean
	requirements: Array<TaskId> // the tasks this task depends on
	tags: Array<TagId>
}

export type MilestoneId = string
export type Milestone = {
	id: MilestoneId
	name: string
	description: string
	requirements: Array<TaskId> // the tasks, that when complete, mean this milestone is complete
}

////////////////////////////////////////////////////////////////////////////////
// DATABASE
////////////////////////////////////////////////////////////////////////////////

export const db = new Dexie("plan") as Dexie & {
	resources: EntityTable<Resource, "id">,
	tags: EntityTable<Tag, "id">,
	tasks: EntityTable<Task, "id">,
	milestones: EntityTable<Milestone, "id">,
}

db.version(1).stores({
	resources: "id, name",
	tags: "id, name",
	tasks: "id, name",
	milestones: "id, name",
})

// fix of: https://github.com/dexie/Dexie.js/issues/1907
export function liveQuery<T>(querier: () => T | Promise<T>): Readable<T> {
	const dexieObservable = Dexie.liveQuery(querier)
	return {subscribe(run, invalidate) { return dexieObservable.subscribe(run, invalidate).unsubscribe }}
}

export const resources = derived(liveQuery(() => db.resources.toArray()), rs => rs ?? [], [])
export const tags = derived(liveQuery(() => db.tags.toArray()), ts => ts ?? [], [])
export const tasks = derived(liveQuery(() => db.tasks.toArray()), ts => ts ?? [], [])
export const milestones = derived(liveQuery(() => db.milestones.toArray()), ms => ms ?? [], [])

export const resourcesById = derived(resources, rs => rs.reduce((acc, r) => acc.set(r.id, r), new Map<ResourceId, Resource>()), new Map<ResourceId, Resource>())
export const tagsById = derived(tags, ts => ts.reduce((acc, t) => acc.set(t.id, t), new Map<TagId, Tag>()), new Map<TagId, Tag>())
export const tasksById = derived(tasks, ts => ts.reduce((acc, t) => acc.set(t.id, t), new Map<TagId, Tag>()), new Map<TaskId, Task>())
export const milestonesById = derived(milestones, ms => ms.reduce((acc, m) => acc.set(m.id, m), new Map<MilestoneId, Milestone>()), new Map<MilestoneId, Milestone>())

/** All the tags that a tag inherits from (all tags on a tag, and all tags on those, etc.) including itself */
export const tagExpansions = derived(tagsById, ts => [...ts.keys()].reduce((acc, t) => {
	const getTags = (tag: TagId): Array<TagId> => [tag, ...ts.get(tag)!.tags.flatMap(getTags)]
	return acc.set(t, new Set(getTags(t)))
}, new Map<TagId, Set<TagId>>()), new Map<TagId, Set<TagId>>())
