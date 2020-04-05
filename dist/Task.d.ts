import { TaskIdentifier, ResourceIdentifier } from "./types/aliases";
export declare class Task {
    identifier: TaskIdentifier;
    resource: ResourceIdentifier;
    dependencies: Set<TaskIdentifier>;
    prediction: number;
    actual: number;
    done: boolean;
    constructor(identifier: TaskIdentifier, resource: ResourceIdentifier, prediction: number, dependencies?: Iterable<TaskIdentifier>, actual?: number, done?: boolean);
    get accuracy(): number | undefined;
}
export declare class Group {
    identifier: TaskIdentifier;
    tasks: Set<TaskIdentifier>;
    constructor(identifier: TaskIdentifier, tasks: Iterable<TaskIdentifier>);
}
export declare function internalizeTasks(tasks: Array<Task>, groups: Array<Group>): Array<Task>;
export declare function fullReferenceTasks(tasks: Array<Task>): Array<Task>;
export declare function checkTaskList(tasks: Array<Task>): void;
export declare function checkNoDuplicateIdentifiersInTasks(tasks: Array<Task>): void;
export declare function checkNoGhostReferencesInTasks(tasks: Array<Task>): void;
export declare function checkNoCircularDependenciesInTasks(tasks: Array<Task>): void;
export declare function checkGroupList(groups: Array<Group>): void;
export declare function checkNoDuplicateIdentifiersInGroups(groups: Array<Group>): void;
export declare function checkNoCircularDependenciesInGroups(groups: Array<Group>): void;
