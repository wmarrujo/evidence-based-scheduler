import {type Subscriber} from "svelte/store"
import {db, type Task} from "$lib/db"

const ticksPerHour = 60 * 60 * 10 // 10 ticks/second (100ms)
const updateInterval = 5 // seconds between database writes

export type Stopwatch = {
	task: Task | undefined,
	time: number | undefined,
	running: boolean,
}

function createStopwatchStore() {
	// VALUES
	
	const subscribers = new Set<Subscriber<Stopwatch>>()
	let ticks: number | undefined = undefined
	let task: Task | undefined = undefined
	let running = false
	
	// TIMER
	
	let interval: ReturnType<typeof setInterval> | undefined
	
	const begin = () => setInterval(() => {
		ticks! += 1 // update the store's value
		if ((ticks! / ticksPerHour * 60 * 60) % updateInterval == 0) db.tasks.update(task!.id, {spent: ticks! / ticksPerHour}) // TODO: update database ever x seconds
		subscribers.forEach(callback => callback({time: ticks! / ticksPerHour, task, running}))
	}, 1000 / (ticksPerHour / 60 / 60))
	
	// INTERFACE
	
	function subscribe(subscriber: Subscriber<Stopwatch>) {
		subscribers.add(subscriber)
		subscriber({time: ticks ? ticks / ticksPerHour : undefined, task, running})
		return () => subscribers.delete(subscriber)
	}
	
	function start(t: Task) {
		running = true
		task = t
		ticks = t.spent * ticksPerHour
		interval = begin()
	}
	
	function pause() {
		running = false
		clearTimeout(interval)
		if (task && ticks) db.tasks.update(task.id, {spent: ticks / ticksPerHour})
		subscribers.forEach(callback => callback({time: ticks ? ticks / ticksPerHour : undefined, task, running}))
	}
	
	function resume() {
		running = true
		interval = begin()
		subscribers.forEach(callback => callback({time: ticks ? ticks / ticksPerHour : undefined, task, running}))
	}
	
	function stop() {
		running = false
		if (task && ticks) db.tasks.update(task.id, {spent: ticks / ticksPerHour})
		clearTimeout(interval)
		task = undefined
		ticks = undefined
		subscribers.forEach(callback => callback({time: undefined, task, running}))
	}
	
	return {subscribe, start, pause, resume, stop}
}

export default createStopwatchStore()












// export const task = writable<Task | undefined>(undefined)

// /** Has the number of seconds it's been going */
// const stopwatch = writable(0, function start(set) {
// 	const beginning = new Date().getTime()
	
// 	const interval = setInterval(() => {
// 		const current = new Date().getTime()
// 		set(current - beginning)
// 	}, 200) // update every 200ms
	
// 	return function stop() {
// 		set(0)
// 		clearInterval(interval)
// 	}
// })

// /** Hours of spent time on the task */
// export const time = derived([task, stopwatch], ([task, time]) => (task?.spent ?? 0) + (time / 60), 0)

// let unsubscribeTask: Invalidator<Task | undefined> | undefined
// let unsubscribeStopwatch: Invalidator<number> | undefined

// export function start() {
// 	unsubscribeTask = task.subscribe(value => { if (value) stopwatch.set(value.spent) })
// 	unsubscribeStopwatch = stopwatch.subscribe(() => {})
// }

// export function stop(): number {
// 	const ta = get(task)
// 	const ti = get(time)
// 	if (ta) db.tasks.update(ta.id, {spent: ti})
// 	if (unsubscribeTask) { unsubscribeTask(); unsubscribeTask = undefined }
// 	if (unsubscribeStopwatch) { unsubscribeStopwatch(); unsubscribeStopwatch = undefined }
// 	return ti
// }
