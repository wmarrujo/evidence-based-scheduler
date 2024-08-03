import type {Task, TaskId, ResourceId, Velocity} from "$lib/db"
import {type Graph, idGraphFromArrayOfItemsWithBackLinks} from "$lib/graph"
import {transpose} from "$lib/utils"
import {randomInt, randomLogNormal} from "d3-random"

////////////////////////////////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////////////////////////////////

type Epoch = number // date, as a number of milliseconds since the start of the unix epoch
type Duration = number // number of milliseconds

////////////////////////////////////////////////////////////////////////////////
// SIMULATE
////////////////////////////////////////////////////////////////////////////////

/** Runs monte-carlo simulations of the goals to find when the likely end dates are.
 * @param goals - all of the goals, stated as sets of the tasks they depend on to schedule, in order of priority
 * @param tasks - all of the tasks in the system, for reference when scheduling
 * @param start - when to start simulating from
 * @param simulations - how many simulations to run
 * @returns each goals' simulation results, returned in the order of the original `goals` input
 */
export function simulate(goals: Array<Iterable<TaskId>>, start: Date, simulations: number, tasks: Array<Task>, velocities: Map<ResourceId, Array<Velocity>>): Array<Array<Date>> {
	const graph = idGraphFromArrayOfItemsWithBackLinks(tasks, task => task.id, task => task.dependsOn)
	
	const fullVelocities = new Map([...velocities.entries()].map(([resource, vs]) => {
		return [resource, vs.concat(Array.from({length: 250 - Math.max(0, vs.length)}, () => randomLogNormal(0.5, 0.2)()))] // some resources may not have enough historical data, fill these with randomly generated velocities
		// TODO: try gamma, (erlang), lognormal, weibull - whatever it is, it can't be able to return exactly 0
	}))
	
	return transpose(Array.from({length: simulations}, () => { // for however many simulations we want to run
		// TODO: seed the randomness for repeatable simulations
		
		const durations = new Map(tasks.map(task => [task.id, task.estimate * fullVelocities.get(task.doer)![randomInt(0, 250)()] * 60 * 60 * 1000]))
		const doers = new Map(tasks.map(task => [task.id, task.doer]))
		
		const starts = goals
			.reduce((acc, goal) => {
				const relevant = graph.ancestors(goal).union(new Set(goal)) // only the ancestors of the direct requirements of this goal are relevant
				const subgraph = graph.filter(relevant) // only consider the part of the graph that is for this goal
				return simulationRun(subgraph, start, acc, durations, doers)
			}, new Map<TaskId, Date>())
		
		return goals.map(tasks => new Date([...tasks].map(task => starts.get(task)!.getTime() + durations.get(task)!).max())) // the last end of all the tasks we care about for each goal is it's end
	}))
}

/** A single simulation run
 * @param goal - the goal to predict
 * @param locked - tasks that are locked from being moved, with their start dates
 * @returns the predicted date of the goal completing (the last end of the directly required tasks of the goal) along
 * with the starts per task that it used to get there (these will be locked for any simulation runs for future goals).
 * The starts returned include the `locked` starts that were passed in.
 */
function simulationRun(
	graph: Graph<TaskId>,
	start: Date,
	locked: Map<TaskId, Date>,
	durations: Map<TaskId, Duration>,
	doers: Map<TaskId, ResourceId>,
): Map<TaskId, Date> {
	const strata = graph.topologicalStrata()
	
	// LEFT-ALIGN
	
	const starts = strata.reduce((acc, stratum) => { // go through the tasks topologically, so that for each task we can be sure that we've already left-aligned all its ancestors
		for (const task of stratum) { // for all the tasks in this stratum
			const existing = locked.get(task)
			if (existing) { // if the start is already locked, keep it there (it will always have the same topological ordering, so we're good)
				acc.set(task, existing.getTime())
			} else {
				const parents = [...graph.parents(task)]
				const ends = parents.map(parent => acc.get(parent)! + durations.get(parent)!) // get the ends of all the parent dates (their starts + durations, in milliseconds)
				const max = 0 < ends.length ? ends.max() : start.getTime() // the max of all parent ends is our start
				acc.set(task, max)
			}
		}
		return acc
	}, new Map<TaskId, Epoch>())
	
	// SHIFT
	
	let now = start.getTime() // start the "now" date at the beginning
	const boundaries = new Map([...starts.entries()].map(([task, start]) => [task, {start, end: start + durations.get(task)!}])) // the ends of the tasks, just for easier referencing
	
	do {
		const intersectors: Map<ResourceId, Set<TaskId>> = [...boundaries.entries()] // the tasks that the now date intersects with, split by resources so we can find the conflicts
			.filter(([_, period]) => period.start <= now && now < period.end)
			.reduce((acc, [task, _]) => {
				const resource = doers.get(task)!
				acc.set(resource, (acc.get(resource) ?? new Set()).add(task))
				return acc
			}, new Map())
		
		// FIND CONFLICTS
		let nextNow = [...boundaries.values()].filter(({start}) => now < start)[0]?.start // get the first start that's strictly past the now date (not going to be a candidate)
		if (nextNow === undefined) nextNow = [...boundaries.values()].filter(({end}) => now < end)[0].end // if we didn't find a next now candidate, then we're almost done, but might still push some more to be next, so let's just give it the next end instead for now
		intersectors.forEach((tasks, _) => { // we can deal with 1 conflict per resource on each loop (we can because we have already pushed everything else that depends on these conflicts to a later time, so any that appear at the same time can't depend on each other, unless 0 time would be allowed, which it's not)
			if (2 <= tasks.size) { // if there are conflicts to address
				const lock = [...tasks.intersection(new Set(locked.keys()))][0]
				const winner = lock ? lock : [...tasks].sort()[randomInt(0, tasks.size)()] // if one of them is already locked, that one wins by default (multiple can't be, since we inherited a valid set of locked ones), otherwise pick a winner at random
				const losers = new Set(tasks); losers.delete(winner) // all the rest
				
				// RESOLVE CONFLICT
				
				locked.set(winner, new Date(now)) // add the winner to the locked list, so it can't be modified in future loops
				const winnerEnd = boundaries.get(winner)!.end
				losers.forEach(loser => { // push off all losers to go after the winner, and curse all their descendants too
					const pushOutLoserDescendants = (descendant: TaskId, newStart: Epoch) => {
						const farthestStart = Math.max(boundaries.get(descendant)!.start, newStart) // if it's already far away, leave it alone
						const newEnd = farthestStart + durations.get(descendant)!
						boundaries.set(descendant, {start: farthestStart, end: newEnd}) // push off all losers to go after the winner
						graph.children(descendant).forEach(child => pushOutLoserDescendants(child, newEnd))
					}
					pushOutLoserDescendants(loser, winnerEnd)
				})
				nextNow = Math.min(nextNow, winnerEnd) // if the winner is shorter than the next nearest task or winner's end, make the now jump to this winner's end instead
			} // if there are no conflicts to address, we don't need to deal with them
		})
		now = nextNow
	} while (now <= [...boundaries.values()].map(({start}) => start).max()) // stop if the now date has moved past all the starts, that means we've dealt with all conflicts
	
	return new Map([...locked.entries()].concat([...boundaries.entries()].map(([task, {start}]) => [task, new Date(start)]))) // we want to lock in what the starts became (and don't forget to return the original locked values)
}
