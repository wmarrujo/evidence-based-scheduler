import type {Milestone, Project, Task, TaskId, ResourceId} from "$lib/db"
import {type Graph, idGraphFromArrayOfItemsWithBackLinks} from "$lib/graph"
import {transpose} from "$lib/utils"
import {randomInt} from "d3-random"

////////////////////////////////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////////////////////////////////

type Epoch = number // date, as a number of milliseconds since the start of the unix epoch
type Duration = number // number of milliseconds

enum GoalType {
	MILESTONE,
	PROJECT,
	TASK,
}

type Goal = {
	type: GoalType
	id: number
	direct: Array<TaskId> // the tasks that are directly required by the goal
}

function isTask(obj: any): obj is Task { return obj.estimate !== undefined } // eslint-disable-line @typescript-eslint/no-explicit-any
function isProject(obj: any): obj is Project { return obj.tasks !== undefined } // eslint-disable-line @typescript-eslint/no-explicit-any
function isMilestone(obj: any): obj is Milestone { return obj.dependsOn !== undefined } // eslint-disable-line @typescript-eslint/no-explicit-any

function toGoal(goal: Milestone | Project | Task) {
	if (isTask(goal)) return {type: GoalType.TASK, id: goal.id, direct: [goal.id]}
	else if (isProject(goal)) return {type: GoalType.PROJECT, id: goal.id, direct: goal.tasks}
	else if (isMilestone(goal)) return {type: GoalType.MILESTONE, id: goal.id, direct: goal.dependsOn}
	else throw new Error("tried to run a simulation with an unknown type")
}

////////////////////////////////////////////////////////////////////////////////
// SIMULATE
////////////////////////////////////////////////////////////////////////////////

/** Runs monte-carlo simulations of the goals to find when the likely end dates are.
 * @param goals - all of the goals (milestones, projects, or tasks) to schedule, in order of priority
 * @param tasks - all of the tasks in the system, for reference when scheduling
 * @param start - when to start simulating from
 * @param simulations - how many simulations to run
 * @returns each goals' simulation results, returned in the order of the original `goals` input
 */
// export function simulate(goals: Array<Milestone | Project | Task>, tasks: Array<Task>, start: Date, simulations: number = 100): Array<Array<Date>> { // DEBUG
export function simulate(goals: Array<Milestone | Project | Task>, tasks: Array<Task>, start: Date, simulations: number = 1): Array<Array<Date>> {
	// TODO: get all milestone tasks
	
	const graph = idGraphFromArrayOfItemsWithBackLinks(tasks, task => task.id, task => task.dependsOn)
	
	const actualGoals: Array<Goal> = goals.map(toGoal) // disambiguate the types
	
	return transpose(Array.from({length: simulations}, () => { // for however many simulations we want to run
		// TODO: seed the randomness for repeatable simulations
		
		// TODO: modify tasksById for this run to set the actual times based on the estimate and the resource's estimating ability
		const durations = new Map(tasks.map(task => [task.id, task.estimate * 60 * 60 * 1000])) // DEBUG: for now taking their estimate as 100% accurate
		// TODO: try gamma, lognormal, weibull - whatever it is, it can't be able to return exactly 0
		const doers = new Map(tasks.map(task => [task.id, task.doer])) // DEBUG: for now taking their estimate as 100% accurate
		
		return actualGoals
			.reduce((acc, goal) => {
				const relevant = graph.ancestors(goal.direct).union(new Set(goal.direct)) // only the ancestors of the direct requirements of this goal are relevant
				const subgraph = graph.filter(relevant) // only consider the part of the graph that is for this goal
				
				const {prediction, starts} = simulationRun(subgraph, start, acc.starts, durations, doers)
				console.log("DONE", prediction, starts)
				
				acc.predictions.push(prediction)
				return {predictions: acc.predictions, starts: starts}
			}, {predictions: [] as Array<Date>, starts: new Map<TaskId, Date>()})
			.predictions
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
): {prediction: Date, starts: Map<TaskId, Date>} {
	// TODO: only consider the part of the graph that is for the goal
	
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
	console.log("left-aligned", new Map([...starts.entries()].map(([task, start]) => [task, new Date(start)])))
	
	// SHIFT
	
	let now = start.getTime() // start the "now" date at the beginning
	const boundaries = new Map([...starts.entries()].map(([task, start]) => [task, {start, end: start + durations.get(task)!}])) // the ends of the tasks, just for easier referencing
	
	const findIntersectorsByResource = () => {
		return [...boundaries.entries()] // the tasks that the now date intersects with, split by resources so we can find the conflicts
			.filter(([_, period]) => period.start <= now && now < period.end)
			.reduce((acc, [task, _]) => {
				const resource = doers.get(task)!
				acc.set(resource, (acc.get(resource) ?? new Set()).add(task))
				return acc
			}, new Map())
	}
	
	do {
		const intersectors: Map<ResourceId, Set<TaskId>> = findIntersectorsByResource() // find the intersectors now that we've moved the now date
		console.log("now", now)
		console.log("boundaries", boundaries)
		console.log("intersectors", intersectors)
		
		// FIND CONFLICTS
		let nextNow = [...boundaries.values()].filter(({start}) => now < start)[0].start // get the first start that's strictly past the now date (not going to be a candidate)
		if (nextNow === undefined) nextNow = [...boundaries.values()].filter(({end}) => now < end)[0].end // if we didn't find a next now candidate, then we're almost done, but might still push some more to be next, so let's just give it the next end instead for now
		intersectors.forEach((tasks, _) => { // we can deal with 1 conflict per resource on each loop (we can because we have already pushed everything else that depends on these conflicts to a later time, so any that appear at the same time can't depend on each other, unless 0 time would be allowed, which it's not)
			if (2 <= tasks.size) { // if there are conflicts to address
				console.log("conflicts", tasks)
				const lock = [...tasks.intersection(new Set(locked.keys()))][0]
				const winner = lock ? lock : [...tasks].sort()[randomInt(0, tasks.size)()] // if one of them is already locked, that one wins by default (multiple can't be, since we inherited a valid set of locked ones), otherwise pick a winner at random
				const losers = new Set(tasks); losers.delete(winner) // all the rest
				
				// RESOLVE CONFLICT
				
				locked.set(winner, new Date(now)) // add the winner to the locked list, so it can't be modified in future loops
				const winnerEnd = boundaries.get(winner)!.end
				losers.forEach(loser => boundaries.set(loser, {start: winnerEnd, end: winnerEnd + durations.get(loser)!})) // push off all losers to go after the winner
				nextNow = Math.min(nextNow, winnerEnd) // if the winner is shorter than the next nearest task or winner's end, make the now jump to this winner's end instead
			} // if there are no conflicts to address, we don't need to deal with them
		})
		now = nextNow
	} while ([...boundaries.values()].map(period => period.start).max() < now) // stop if the now date has moved past all the starts, that means we've dealt with all conflicts
	
	return {
		prediction: new Date(now), // the now date will be at the end of the last task
		starts: new Map([...boundaries.entries()].map(([task, {start}]) => [task, new Date(start)])), // we want to lock in what the starts became
	}
}

////////////////////////////////////////////////////////////////////////////////
