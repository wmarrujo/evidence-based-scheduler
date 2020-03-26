import "module-alias/register";
import { ResourceIdentifier, ISODateString, ScheduleRuleString, Accuracy, Probability } from "@/types";
import { Task, Group } from "@/Task";
import { Period } from "@/Schedule";
export { Task, Group } from "@/Task";
export { ValidationError } from "@/Error";
export declare class Project {
    #private;
    name: string;
    tasks: Array<Task>;
    groups: Array<Group>;
    snapshots: Record<ISODateString, Record<Probability, ISODateString>>;
    constructor(name: string, start: string, tasks: Array<Task>, groups: Array<Group>, schedules: Record<ResourceIdentifier, Array<ScheduleRuleString>>, accuracies?: Record<ResourceIdentifier, Array<Accuracy>>, snapshots?: Record<ISODateString, Record<Probability, ISODateString>>);
    get start(): string;
    set start(date: string);
    probabilityOfEndingOnDate(dateString: ISODateString): Probability;
    scheduleInRangeForResource(resource: ResourceIdentifier, fromString: ISODateString, toString: ISODateString): Array<Period>;
}
