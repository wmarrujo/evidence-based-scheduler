import { ISODateString, TaskIdentifier, ResourceIdentifier, Hours, ScheduleRuleString, Accuracy } from "./aliases";
/**
 * An accessible project specification format. This is to be used to generate new
 * {@link Project} objects with the {@link Project.fromObject} factory function.
 */
export interface ProjectObject {
    start?: ISODateString;
    tasks?: Array<{
        identifier: TaskIdentifier;
        dependencies?: Array<TaskIdentifier>;
        resource: ResourceIdentifier;
        prediction: Hours;
        actual?: Hours;
        done?: boolean;
    }>;
    groups?: Array<{
        identifier: TaskIdentifier;
        tasks?: Array<TaskIdentifier>;
    }>;
    schedules: Record<ResourceIdentifier, Array<ScheduleRuleString>>;
    accuracies?: Record<ResourceIdentifier, Array<Accuracy>>;
}
