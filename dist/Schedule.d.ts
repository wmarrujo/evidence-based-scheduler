import { DateTime } from "luxon";
import { ScheduleRuleString, ISODateString } from "@/types";
export declare class Schedule {
    #private;
    constructor(ruleStrings: Array<ScheduleRuleString>);
    periodsInRange(from: DateTime, to: DateTime): Array<Period>;
    getNextBeginFrom(date: DateTime): DateTime;
    getNextEndFrom(date: DateTime): DateTime;
}
export declare function getNextWorkDayFrom(date: DateTime, generator: (date: DateTime) => Array<Period>): DateTime;
export declare const spacing: any;
export declare const ordinal: any;
export declare const duration: any;
export declare const num: any;
export declare const time: any;
export declare const date: any;
export declare const times: any;
export declare const occurrence: any;
export declare const rule: any;
export declare function parseRule(ruleString: ScheduleRuleString): ScheduleRuleParts;
export declare type OrdinalUnit = "years" | "months" | "weeks" | "days";
export declare type Time = {
    hour: number;
    minute: number;
};
export declare type Times = Array<{
    from: Time;
    to: Time;
}>;
export interface ScheduleRuleParts {
    times: undefined | Times;
    on: undefined | ISODateString;
    from: undefined | ISODateString;
    to: undefined | ISODateString;
    forValue: undefined | number;
    forUnit: undefined | OrdinalUnit;
    repeatValue: undefined | number;
    repeatUnit: undefined | OrdinalUnit;
    every: undefined | string;
}
export declare function validateTimes(times: Times): void;
export declare function validateTime(time: Time): void;
export declare function makeRule(ruleString: ScheduleRuleString): ScheduleRule;
export interface Period {
    begin: DateTime;
    end: DateTime;
}
export declare type ScheduleRule = (date: DateTime) => Array<Period> | undefined;
export declare function makePeriodsOnDate(date: DateTime, times: Times): Array<Period>;
export declare function dateRule(on: DateTime, times?: Times): ScheduleRule;
export declare function fromToRule(from: DateTime, to: DateTime, times?: Times): ScheduleRule;
export declare function fromForRepeatRule(from: DateTime, forValue: number, forUnit: OrdinalUnit, repeatValue: number, repeatUnit: OrdinalUnit, times?: Times): ScheduleRule;
export declare function everyRule(every: string, times?: Times): ScheduleRule;
