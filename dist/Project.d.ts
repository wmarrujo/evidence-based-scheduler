import { DateTime } from "luxon";
import { ResourceIdentifier, ISODateString, ScheduleRuleString, Accuracy, Probability, TaskIdentifier, ISODateTimeString } from "./types";
import { Task, Group } from "./Task";
import { Schedule, Period } from "./Schedule";
import { Performance } from "./Performance";
export declare class Project {
    name: string;
    private _start;
    tasks: Array<Task>;
    private _tasks;
    groups: Array<Group>;
    private _schedules;
    private _performances;
    snapshots: Record<ISODateString, Record<Probability, ISODateString>>;
    private _simulations;
    private _taskSchedule;
    constructor(name: string, start: string, tasks: Array<Task>, groups: Array<Group>, schedules: Record<ResourceIdentifier, Array<ScheduleRuleString>>, accuracies?: Record<ResourceIdentifier, Array<Accuracy>>, snapshots?: Record<ISODateString, Record<Probability, ISODateString>>);
    get start(): string;
    get taskSchedule(): Array<{
        task: Task;
        begin: ISODateTimeString;
        end: ISODateTimeString;
    }>;
    set start(date: string);
    probabilityOfEndingOnDate(dateString: ISODateString): Probability;
    scheduleInRangeForResource(resource: ResourceIdentifier, fromString: ISODateString, toString: ISODateString): Array<Period>;
}
export declare function monteCarloSimulations(tasks: Array<Task>, performances: Record<ResourceIdentifier, Performance>, schedules: Record<ResourceIdentifier, Schedule>, iterations: number): Array<DateTime>;
export declare function simulateTaskList(tasks: Array<Task>, performances: Record<ResourceIdentifier, Performance>, schedules: Record<ResourceIdentifier, Schedule>): DateTime;
export interface ScheduledTask {
    task: TaskIdentifier;
    begin: DateTime;
    end: DateTime;
}
export declare function scheduleTasks(tasks: Array<Task>, from: DateTime, schedules: Record<ResourceIdentifier, Schedule>, accuracies?: Record<TaskIdentifier, Accuracy>): Array<ScheduledTask>;
