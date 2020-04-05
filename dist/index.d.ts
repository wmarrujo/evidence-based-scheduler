import { DateTime } from "luxon";
import { ResourceIdentifier, TaskIdentifier, ISODateString, ISODateTimeString, Probability } from "./types/aliases";
import { ProjectObject } from "./types/convenience";
import { Task } from "./Task";
import { Schedule, Period } from "./Schedule";
import { Performance } from "./Performance";
export { ValidationError } from "./Error";
/**
 * The container for all the project information.
 *
 * {@link Project} objects are intended to be readonly, where the tasks are read
 * in once and the output is queried from it. Any changes made return deep copies
 * of the project object.
 *
 * Create new instances via the factory class methods.
 */
export declare class Project {
    private _start;
    private _tasks;
    private _schedules;
    private _performances;
    private _taskSchedule;
    private _simulations;
    constructor(start: DateTime, tasks: Array<Task>, schedules: Record<ResourceIdentifier, Schedule>, performances: Record<ResourceIdentifier, Performance>);
    /**
     * Create a Project from an object with tasks, schedules and such specified
     * with reasonable defaults.
     *
     * This function is intended to be forgiving. It will validate your input and
     * return a {@link ValidationError} on any issues.
     */
    static fromObject(projectObject: ProjectObject): Project;
    get start(): ISODateString;
    /**
     * This returns the tasks with begin and end dates assigned. It schedules them
     * according to the schedules specified
     */
    get schedule(): Array<{
        task: TaskIdentifier;
        begin: ISODateTimeString;
        end: ISODateTimeString;
    }>;
    /**
     * returns a this project, but with a different start date.
     */
    startOn(date: ISODateString): Project;
    /**
     * Gets the probability that the entire project will end on a specific date.
     * You can optionally specify how many simulations to do.
     */
    probabilityOfEndingOnDate(dateString: ISODateString, simulations?: number): Promise<Probability>;
    /**
     * Gets the scheduled times that a specifiedresource is working on the project
     * over a specified date range.
     */
    resourceScheduleInRange(resource: ResourceIdentifier, fromString: ISODateString, toString: ISODateString): Array<Period>;
}
