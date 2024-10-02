import Dexie, {type EntityTable} from "dexie"
import {derived, type Readable} from "svelte/store"
import * as yaml from "yaml"
import download from "downloadjs"

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

export type TagId = number
export type Tag = {
	id: TagId
	name: string
	description: string
	tags: Array<TagId> // the tag can "inherit" other tags
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
	requirements: Array<TaskId> // the tasks this task depends on
	tags: Array<TagId>
}

export type MilestoneId = number
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
	resources: "++id, name",
	tags: "++id, name",
	tasks: "++id, name",
	milestones: "++id, name",
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
export const tasksById = derived(tasks, ts => ts.reduce((acc, t) => acc.set(t.id, t), new Map<TaskId, Task>()), new Map<TaskId, Task>())
export const milestonesById = derived(milestones, ms => ms.reduce((acc, m) => acc.set(m.id, m), new Map<MilestoneId, Milestone>()), new Map<MilestoneId, Milestone>())

// These copies are undefined until they are populated. This lets us tell when they are truly empty vs that they just haven't loaded yet.
export const populatedResources = derived(liveQuery(() => db.resources.toArray()), rs => rs, null)
export const populatedTags = derived(liveQuery(() => db.tags.toArray()), ts => ts, null)
export const populatedTasks = derived(liveQuery(() => db.tasks.toArray()), ts => ts, null)
export const populatedMilestones = derived(liveQuery(() => db.milestones.toArray()), ms => ms, null)

export const populatedResourcesById = derived(populatedResources, rs => rs ? rs.reduce((acc, r) => acc.set(r.id, r), new Map<ResourceId, Resource>()) : null, null)
export const populatedTagsById = derived(populatedTags, ts => ts ? ts.reduce((acc, t) => acc.set(t.id, t), new Map<TagId, Tag>()) : null, null)
export const populatedTasksById = derived(populatedTasks, ts => ts ? ts.reduce((acc, t) => acc.set(t.id, t), new Map<TaskId, Task>()) : null, null)
export const populatedMilestonesById = derived(populatedMilestones, ms => ms ? ms.reduce((acc, m) => acc.set(m.id, m), new Map<MilestoneId, Milestone>()) : null, null)

/** All the tags that a tag inherits from (all tags on a tag, and all tags on those, etc.) including itself */
export const tagExpansions = derived(tagsById, ts => [...ts.keys()].reduce((acc, t) => {
	const getTags = (tag: TagId): Array<TagId> => [tag, ...ts.get(tag)!.tags.flatMap(getTags)]
	return acc.set(t, new Set(getTags(t)))
}, new Map<TagId, Set<TagId>>()), new Map<TagId, Set<TagId>>())

////////////////////////////////////////////////////////////////////////////////
// SAVING & LOADING
////////////////////////////////////////////////////////////////////////////////

const defaultResourceFiller = {
	velocities: [],
}
const defaultTagFiller = {
	description: "",
	tags: [],
}
const defaultTaskFiller = {
	description: "",
	spent: 0,
	done: false,
	requirements: [],
	tags: [],
}
const defaultMilestoneFiller = {
	description: "",
	requirements: [],
}

export async function save() {
	const document = yaml.parseDocument(localStorage.getItem("yaml") ?? "")
	
	const resources = (await db.resources.toArray()).sort((a, b) => a.id - b.id)
	const tags = (await db.tags.toArray()).sort((a, b) => a.id - b.id)
	const tasks = (await db.tasks.toArray()).sort((a, b) => a.id - b.id)
	const milestones = (await db.milestones.toArray()).sort((a, b) => a.id - b.id)
	
	// fill & update with current values
	// NOTE: do it this way so that it doesn't change what it doesn't have to change, in particular, it will keep comments where they are, and won't change the order if entries already exist
	
	/* eslint-disable @typescript-eslint/no-explicit-any */
	function fill<T extends Resource | Tag | Task | Milestone>(section: string, item: T, default_: object) {
		Object.keys(item).filter(key => key != "id").forEach(key => { // for all keys except for the id (since that one is used as the item's overall key)
			const value = (item as any)[key]
			const d = (default_ as any)[key]
			if (value == d || (Array.isArray(value) && value.length == 0)) document.deleteIn([section, String(item.id), key]) // if it's the default, remove it if it exists (will get filled with the default when read)
			else document.setIn([section, String(item.id), key], value) // if it's not the default, write or overwrite the value
		})
	}
	/* eslint-enable @typescript-eslint/no-explicit-any */
	
	resources.forEach(resource => fill("resources", resource, defaultResourceFiller))
	tags.forEach(tag => fill("tags", tag, defaultTagFiller))
	tasks.forEach(task => fill("tasks", task, defaultTaskFiller))
	milestones.forEach(milestone => fill("milestones", milestone, defaultMilestoneFiller))
	
	// remove any unused values
	const data = document.toJS();
	(new Set(Object.keys(data.resources ?? {}))).difference(new Set(resources.map(r => String(r.id)))).forEach(resource => document.deleteIn(["resources", resource]));
	(new Set(Object.keys(data.tags ?? {}))).difference(new Set(tags.map(t => String(t.id)))).forEach(tag => document.deleteIn(["tags", tag]));
	(new Set(Object.keys(data.tasks ?? {}))).difference(new Set(tasks.map(t => String(t.id)))).forEach(task => document.deleteIn(["tasks", task]));
	(new Set(Object.keys(data.milestones ?? {}))).difference(new Set(milestones.map(m => String(m.id)))).forEach(milestone => document.deleteIn(["milestones", milestone]))
	
	const s = document.toString({
		collectionStyle: "block", // do this to make sure git diffs are just one line when adding and removing (will make the file longer though)
		blockQuote: "literal", // do this so markdown is preserved correctly (don't strip out interior line breaks) // FIXME: this option doesn't seem to be doing anything
	})
	download(s, "plan.yaml", "application/yaml") // TODO: maybe save the filename somewhere so it can be downloaded the same as it came
}

export async function load(file: Blob) {
	const contents = await file.text()
	const document = yaml.parseDocument(contents)
	localStorage.setItem("yaml", contents)
	
	const data = document.toJS()
	
	await db.delete({disableAutoOpen: false}) // wipe the database, and allow it to be recreated
	localStorage.setItem("selected-goals", "[]") // remove local storage
	
	db.resources.bulkAdd(Object.keys(data.resources ?? {}).map(id => ({id: Number(id), ...defaultResourceFiller, ...data.resources[id]})))
	db.tags.bulkAdd(Object.keys(data.tags ?? {}).map(id => ({id: Number(id), ...defaultTagFiller, ...data.tags[id]})))
	db.tasks.bulkAdd(Object.keys(data.tasks ?? {}).map(id => ({id: Number(id), ...defaultTaskFiller, ...data.tasks[id]})))
	db.milestones.bulkAdd(Object.keys(data.milestones ?? {}).map(id => ({id: Number(id), ...defaultMilestoneFiller, ...data.milestones[id]})))
}
