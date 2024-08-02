import type {Milestone, Project, Task, TaskId, ResourceId} from "$lib/db"
import {type Graph, idGraphFromArrayOfItemsWithBackLinks} from "$lib/graph"
import {transpose} from "$lib/utils"
import * as random from "d3-random"

////////////////////////////////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////////////////////////////////

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
	
	return transpose(Array.from({length: simulations}, (_, seed) => { // for however many simulations we want to run
		const randomGamma = random.randomGamma.source(random.randomLcg(seed)) // TODO: try gamma, lognormal, weibull
		// TODO: modify tasksById for this run to set the actual times based on the estimate and the resource's estimating ability
		const durations = new Map(tasks.map(task => [task.id, task.estimate * 60 * 60 * 1000])) // DEBUG: for now taking their estimate as 100% accurate
		const doers = new Map(tasks.map(task => [task.id, task.doer])) // DEBUG: for now taking their estimate as 100% accurate
		
		return actualGoals
			.reduce((acc, goal) => {
				const relevant = graph.ancestors(goal.direct).union(new Set(goal.direct)) // only the ancestors of the direct requirements of this goal are relevant
				const subgraph = graph.filter(relevant) // only consider the part of the graph that is for this goal
				
				const {prediction, starts} = simulationRun(subgraph, start, acc.starts, durations, doers)
				
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
	
	const times = strata.reduce((acc, stratum) => { // go through the tasks topologically, so that for each task we can be sure that we've already left-aligned all its ancestors
		for (const task of stratum) { // for all the tasks in this stratum
			const existing = locked.get(task)
			if (existing) { // if the start is already locked, keep it there (it will always have the same topological ordering, so we're good)
				acc.set(task, existing)
			} else {
				const parents = [...graph.parents(task)]
				const ends = parents.map(parent => acc.get(parent)!.getTime() + durations.get(parent)!) // get the ends of all the parent dates (their starts + durations, in milliseconds)
				const max = 0 < ends.length ? new Date(Math.max.apply(null, ends)) : start // the max of all parent ends is our start
				acc.set(task, max)
			}
		}
		return acc
	}, new Map<TaskId, Date>())
	
	// SHIFT
	
	const now = start // start the "now" date at the beginning
	
	// TODO: shifting algorithm
	
	return {prediction: new Date(), starts: new Map()} // DEBUG: while building
}

////////////////////////////////////////////////////////////////////////////////
