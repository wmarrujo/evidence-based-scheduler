import { ResourceIdentifier, TaskIdentifier, Accuracy } from "./types/aliases";
import { DateTime } from "luxon";
import { Task } from "./Task";
import { Schedule } from "./Schedule";
import { Performance } from "./Performance";
/**
 * run many monte carlo simulations of the tasks, getting a list of end dates back
 * so they can be analyzed later
 */
export declare function monteCarloSimulations(tasks: Array<Task>, performances: Record<ResourceIdentifier, Performance>, schedules: Record<ResourceIdentifier, Schedule>, iterations: number): Promise<Array<DateTime>>;
/**
 * simulates a task list by applying random accuracies to the task predictions based
 * on the performance data supplied
 */
export declare function simulateTaskList(tasks: Array<Task>, performances: Record<ResourceIdentifier, Performance>, schedules: Record<ResourceIdentifier, Schedule>): DateTime;
export interface ScheduledTask {
    task: TaskIdentifier;
    begin: DateTime;
    end: DateTime;
}
/**
 * Turn the tasks list into a list of tasks with begin and end times.
 *
 * this function ensures that task dependencies are held, and sequences the tasks
 * such that no resource is doing two tasks at once.
 */
export declare function scheduleTasks(tasks: Array<Task>, from: DateTime, schedules: Record<ResourceIdentifier, Schedule>, accuracies?: Record<TaskIdentifier, Accuracy>): Array<ScheduledTask>;
