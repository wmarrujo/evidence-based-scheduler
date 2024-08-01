import type {Milestone, Project, Task, TaskId} from "$lib/db"
import {type Graph, idGraphFromArrayOfItemsWithBackLinks} from "$lib/graph"
import {transpose} from "$lib/utils"
import * as random from "d3-random"

////////////////////////////////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////////////////////////////////

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
	
	const tasksById = tasks.reduce((acc, task) => acc.set(task.id, task), new Map<TaskId, Task>())
	const graph = idGraphFromArrayOfItemsWithBackLinks(tasks, task => task.id, task => task.dependsOn)
	
	const actualGoals: Array<Goal> = goals.map(toGoal) // disambiguate the types
	
	return transpose(Array.from({length: simulations}, (_, seed) => {
		const randomGamma = random.randomGamma.source(random.randomLcg(seed)) // TODO: try gamma, lognormal, weibull
		return actualGoals
			.reduce((acc, goal) => {
				// TODO: modify tasksById for this run to set the actual times based on the estimate and the resource's estimating ability, for now taking their estimate as 100% accurate
				const {prediction, starts} = simulationRun(goal, acc.starts, tasksById, graph)
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
function simulationRun(goal: Goal, locked: Map<TaskId, Date>, tasksById: Map<TaskId, Task>, graph: Graph<TaskId>): {prediction: Date, starts: Map<TaskId, Date>} {
	console.log("graph", graph)
	const strata = graph.topologicalStrata()
	console.log("strata", strata)
	
	return {prediction: new Date(), starts: new Map()} // DEBUG: while building
}

////////////////////////////////////////////////////////////////////////////////
