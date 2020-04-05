"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const Error_1 = require("./Error");
const { str, sequenceOf, choice, char, digit, whitespace, optionalWhitespace, sepBy1, many1, possibly, fail } = require("arcsecond"); // TODO: wait for this library to add typescript support
////////////////////////////////////////////////////////////////////////////////
// CLASS
////////////////////////////////////////////////////////////////////////////////
class Schedule {
    constructor(ruleStrings) {
        // make rules
        const rulesParts = []; // placeholder for the rule components
        const rules = ruleStrings
            .map(ruleString => {
            let ruleParts = undefined;
            try {
                ruleParts = parseRule(ruleString); // parse the rule
                rulesParts.push(ruleParts); // keep track of this for validation later
            }
            catch (error) {
                if (error instanceof Error_1.ValidationError) {
                    Error_1.rethrowValidationError(error, "parsing rule", ruleString);
                }
                else {
                    throw error;
                }
            }
            try {
                return makeRule(ruleParts);
            }
            catch (error) {
                if (error instanceof Error_1.ValidationError) {
                    Error_1.rethrowValidationError(error, "resolving groups", "groups");
                }
                else {
                    throw error;
                }
            }
        })
            .reverse();
        rulesParts.reverse(); // reverse this too
        // check that rules will have at least some time that can be found
        checkRules(rulesParts);
        // turn rules into a generator function for this schedule
        this._generator = (date) => {
            for (const rule of rules) { // for each rule in backwards order
                const periods = rule(date); // evaluate to either an periods amount or undefined
                if (periods)
                    return periods; // if it matched and gave back periods, return those & stop evaluating the rules
            }
            return []; // if none of the rules matched
        };
    }
    periodsInRange(from, to) {
        const periods = [];
        for (let d = from; d < to; d = d.plus({ days: 1 })) {
            periods.push(this._generator(d));
        }
        return periods.flat();
    }
    getNextBeginFrom(date) {
        const todayPeriods = this._generator(date);
        if (todayPeriods.length != 0) { // today has some periods
            const alreadyInPeriod = todayPeriods.find(period => period.begin < date && date < period.end); // try to find a period that it's already in
            if (alreadyInPeriod) { // it found that the date is currently in a work period
                return date; // the date we already have works as a begin date
            }
            else { // it's not currently in a work period
                const laterPeriods = todayPeriods.filter(period => date < period.begin); // just get the periods with begin times after now
                if (laterPeriods.length != 0) { // a later period was found
                    return laterPeriods[0].begin; // return that period's begin date, since it's the next place it could start
                } // else, no more working periods were found this day, continue on to check the next day
            }
        } // no periods on this day, or if `date` didn't work out
        const nextWorkDay = getNextWorkDayFrom(date.plus({ days: 1 }), this._generator); // get the next day with periods
        const periods = this._generator(nextWorkDay); // get the periods from that day
        return periods[0].begin; // get the beginning of the first period in that day
    }
    getNextEndFrom(date) {
        const todayPeriods = this._generator(date);
        if (todayPeriods.length != 0) { // today has some periods
            const periodsEndingLater = todayPeriods.filter(period => date < period.end); // all periods that are ending later than now
            if (periodsEndingLater.length != 0) { // it found a period ending later
                return periodsEndingLater[0].end; // return that first ending date
            } // it didn't find a period ending later, keep looking
        } // no periods on this day, or if `date didn't work out`
        const nextWorkDay = getNextWorkDayFrom(date.plus({ days: 1 }), this._generator); // get the next day with periods
        const periods = this._generator(nextWorkDay); // get the periods from that day
        return periods[0].end; // get the ending of the first period in that day
    }
}
exports.Schedule = Schedule;
function getNextWorkDayFrom(date, generator) {
    let d = date.startOf("day");
    let periods = generator(d);
    while (periods.length == 0) { // check dates until it finds one with some work time scheduled
        d = d.plus({ days: 1 }); // increment to the next day
        periods = generator(d); // find the periods for that day
    }
    return d;
}
exports.getNextWorkDayFrom = getNextWorkDayFrom;
////////////////////////////////////////////////////////////////////////////////
// VALIDATION
////////////////////////////////////////////////////////////////////////////////
function checkRules(rulesParts) {
    const repeatingRules = rulesParts
        .map((ruleParts, index) => ({ parts: ruleParts, index: index })); // keep track of the index
    // make sure that there is at least one repeating include statement
    const repeatingIncludes = repeatingRules
        .filter(rule => rule.parts.times && (rule.parts.forValue || rule.parts.every)); // find all repeating include rules
    if (repeatingIncludes.length == 0) { // if it did not find such a rule
        throw new Error_1.ValidationError("no repeating \"include\" rule found", "parsed schedule rules", "");
    }
    // make sure that isn't overruled with a repeating exclude statement that covers the same time
    const repeatingExcludes = repeatingRules
        .filter(rule => rule.parts.times == undefined && (rule.parts.forValue || rule.parts.every)); // find all repeating exclude rules
    repeatingIncludes
        .map(includeRule => {
        return repeatingExcludes //  for all exclude rules
            .filter(excludeRule => excludeRule.index < includeRule.index) // which have a higher precedence
            .map(_excludeRule => {
            // TODO: check if the exclude rule will always encompass the include rule
            return true;
        });
    })
        .every(x => x); // make sure there is at least one
}
exports.checkRules = checkRules;
////////////////////////////////////////////////////////////////////////////////
// RULE PARSING
////////////////////////////////////////////////////////////////////////////////
// EBNF
/*

RULE = ( "include" _ HOURS | "exclude") _ OCCURENCE

OCCURENCE = "on" _ DATE | "from" _ DATE _ ( "to" _ DATE | "for" _ NUMBER _ DURATION "every" _ NUMBER _ DURATION) | every _ ORDINAL
HOURS = ( "from" TIME "to" TIME )+

DATE = DIGIT DIGIT DIGIT DIGIT "-" DIGIT DIGIT "-" DIGIT DIGIT
TIME = DIGIT DIGIT ":" DIGIT DIGIT
NUMBER = DIGIT+ ( "." DIGIT+ )

DURATION = ( "year" | "month" | "week" | "day" ) "s"?
ORDINAL = "weekday" | "weekend" | "day" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
DIGIT = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
_ = ( " " | "\n" | "\t" | "\r" )+

*/
// PARSER
exports.spacing = sequenceOf([whitespace, optionalWhitespace]) // at least one space
    .errorChain(() => fail("expected whitespace"));
exports.ordinal = choice(["weekday", "weekend", "day", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(str))
    .errorChain(() => fail("expected one of \"weekday\", \"weekend\", \"day\", \"monday\", \"tuesday\", \"wednesday\", \"thursday\", \"friday\", \"saturday\", or \"sunday\""));
exports.duration = sequenceOf([choice(["year", "month", "week", "day"].map(str)), possibly(char("s"))])
    .map((result) => result[0].concat(result[1] ? "s" : "")) // make it plural if it's not
    .errorChain(() => fail("expected one of \"year(s)\", \"month(s)\", \"week(s)\", or \"day(s)\""));
exports.num = sequenceOf([many1(digit), possibly(sequenceOf([char("."), many1(digit)]))])
    .map((result) => Number(result.flat(Infinity).filter((s) => s != null).join("")))
    .errorChain(() => fail("expected a number"));
exports.time = sequenceOf([digit, digit, char(":"), digit, digit])
    .map((result) => ({ hour: Number(result.slice(0, 2).join("")), minute: Number(result.slice(3).join("")) }))
    .errorChain(() => fail("expected a time in the form \"hh:mm\""));
exports.date = sequenceOf([digit, digit, digit, digit, char("-"), digit, digit, char("-"), digit, digit])
    .map((result) => result.join("")) // turn it into a single date string
    .errorChain(() => fail("expected a date in the form \"YYYY-MM-DD\""));
exports.times = sequenceOf([str("from"), exports.spacing, exports.time, exports.spacing, str("to"), exports.spacing, exports.time])
    .map((result) => ({ from: result[2], to: result[6] }));
exports.occurrence = choice([
    sequenceOf([str("on"), exports.spacing, exports.date])
        .map((result) => ({ on: result[2] })),
    sequenceOf([str("from"), exports.spacing, exports.date, exports.spacing, choice([
            sequenceOf([str("to"), exports.spacing, exports.date])
                .map((result) => ({ to: result[2] })),
            sequenceOf([str("for"), exports.spacing, exports.num, exports.spacing, exports.duration, exports.spacing, str("every"), exports.spacing, exports.num, exports.spacing, exports.duration])
                .map((result) => ({ forValue: result[2], forUnit: result[4], repeatValue: result[8], repeatUnit: result[10] }))
        ])
    ])
        .map((result) => ({ from: result[2], ...result[4] })),
    sequenceOf([str("every"), exports.spacing, exports.ordinal])
        .map((result) => ({ every: result[2] }))
]);
exports.rule = sequenceOf([
    choice([
        str("exclude")
            .map((_) => ({})),
        sequenceOf([str("include"), exports.spacing, sepBy1(sequenceOf([exports.spacing, str("and"), exports.spacing]))(exports.times)])
            .map((result) => ({ times: result[2] }))
    ]),
    exports.spacing,
    exports.occurrence
])
    .map((result) => ({ ...result[0], ...result[2] }));
// PARSING
function parseRule(ruleString) {
    const result = exports.rule.run(ruleString.toLowerCase());
    if (result.isError) { // an error occurred
        throw new Error_1.ValidationError(result.error, ruleString, result.index); // return error information
    }
    return result.result;
}
exports.parseRule = parseRule;
function showTime(time) {
    return ("0" + time.hour).slice(-2) + ":" + ("0" + time.minute).slice(-2);
}
function validateTimes(times) {
    times.forEach(time => {
        validateTime(time.from);
        validateTime(time.to);
        if (time.to.hour * 60 + time.to.minute < time.from.hour * 60 + time.from.minute) { // if the "to" is before the "from"
            throw new Error_1.ValidationError(`From time is before end time: "from ${showTime(time.from)} > to ${showTime(time.to)}"`, "checking times", `"from ${showTime(time.from)} > to ${showTime(time.to)}"`);
        }
    });
}
exports.validateTimes = validateTimes;
function validateTime(time) {
    if (24 < time.hour || (time.hour == 24 && 0 < time.minute) || 60 <= time.minute) { // if hour is > 24 (allowing 24:00), or minute is >= 60
        throw new Error_1.ValidationError(`Time entered is not a valid time: "${showTime(time)}"`, "checking time", showTime(time));
    }
}
exports.validateTime = validateTime;
// RULE MAKING
function makeRule(ruleParts) {
    const times = ruleParts.times || [];
    validateTimes(times);
    times.sort((a, b) => a.from.hour * 60 + a.from.minute < b.from.hour * 60 + b.from.minute ? -1 : (a.from.hour * 60 + a.from.minute > b.from.hour * 60 + b.from.minute ? 1 : 0)); // sort the times in chronological order
    if (ruleParts.on) { // an "on" rule
        const on = luxon_1.DateTime.fromISO(ruleParts.on);
        if (!on.isValid)
            throw new Error_1.ValidationError("Invalid date", ruleParts.on);
        return dateRule(on, times);
    }
    else if (ruleParts.from) { // a "from" rule
        const from = luxon_1.DateTime.fromISO(ruleParts.from);
        if (!from.isValid)
            throw new Error_1.ValidationError("Invalid date", ruleParts.from);
        if (ruleParts.to) { // a "from to" rule
            const to = luxon_1.DateTime.fromISO(ruleParts.to);
            if (!to.isValid)
                throw new Error_1.ValidationError("Invalid date", ruleParts.to);
            return fromToRule(from, to, times);
        }
        else if (ruleParts.forValue && ruleParts.forUnit && ruleParts.repeatValue && ruleParts.repeatUnit) { // an "from for every" rule
            return fromForRepeatRule(from, ruleParts.forValue, ruleParts.forUnit, ruleParts.repeatValue, ruleParts.repeatUnit, times);
        }
        else { // should never happen
            throw new Error_1.ValidationError("Expected \"to\" or \"for _ _ every _ _\" in rule declaration", "\"from\" clause");
        }
    }
    else if (ruleParts.every) { // an "every" rule
        return everyRule(ruleParts.every, times);
    }
    else { // should never happen
        throw new Error_1.ValidationError("Expected \"on\", \"from\", or \"every\" in rule declaration", "rule main clause");
    }
}
exports.makeRule = makeRule;
function makePeriodsOnDate(date, times) {
    return times.map(time => {
        return {
            begin: date.set({ hour: time.from.hour, minute: time.from.minute }),
            end: date.set({ hour: time.to.hour, minute: time.to.minute })
        };
    });
}
exports.makePeriodsOnDate = makePeriodsOnDate;
function dateRule(on, times = []) {
    return (date) => date.hasSame(on, "day") ? makePeriodsOnDate(date, times) : undefined;
}
exports.dateRule = dateRule;
function fromToRule(from, to, times = []) {
    return (date) => from <= date.startOf("day") && date.startOf("day") <= to ? makePeriodsOnDate(date, times) : undefined;
}
exports.fromToRule = fromToRule;
function fromForRepeatRule(from, forValue, forUnit, repeatValue, repeatUnit, times = []) {
    return (date) => {
        const periodsAway = Math.floor(date.diff(from, repeatUnit)[repeatUnit] / repeatValue) * repeatValue; // how many periods is the date away from the fromDate?
        const beginDate = from.plus({ [repeatUnit]: periodsAway }).startOf("day"); // go to that many periods away, just before the date
        const endDate = beginDate.plus({ [forUnit]: forValue }).startOf("day"); // that many periods away, just before the date to potentially just after
        return beginDate <= date.startOf("day") && date.startOf("day") <= endDate ? makePeriodsOnDate(date, times) : undefined;
    };
}
exports.fromForRepeatRule = fromForRepeatRule;
function everyRule(every, times = []) {
    if (every == "day") {
        return (date) => makePeriodsOnDate(date, times);
    }
    else if (every == "weekday") {
        return (date) => date.weekday <= 5 ? makePeriodsOnDate(date, times) : undefined;
    }
    else if (every == "weekend") {
        return (date) => 5 < date.weekday ? makePeriodsOnDate(date, times) : undefined;
    }
    else if (every == "monday") {
        return (date) => date.weekday == 1 ? makePeriodsOnDate(date, times) : undefined;
    }
    else if (every == "tuesday") {
        return (date) => date.weekday == 2 ? makePeriodsOnDate(date, times) : undefined;
    }
    else if (every == "wednesday") {
        return (date) => date.weekday == 3 ? makePeriodsOnDate(date, times) : undefined;
    }
    else if (every == "thursday") {
        return (date) => date.weekday == 4 ? makePeriodsOnDate(date, times) : undefined;
    }
    else if (every == "friday") {
        return (date) => date.weekday == 5 ? makePeriodsOnDate(date, times) : undefined;
    }
    else if (every == "saturday") {
        return (date) => date.weekday == 6 ? makePeriodsOnDate(date, times) : undefined;
    }
    else if (every == "sunday") {
        return (date) => date.weekday == 7 ? makePeriodsOnDate(date, times) : undefined;
    }
    else { // should never happen
        throw new Error_1.ValidationError("Expected one of \"day\", \"weekday\", \"weekend\", \"monday\", \"tuesday\", \"wednesday\", \"thursday\", \"friday\", \"saturday\", or \"sunday\" after \"every\"", "\"every\" clause", every);
    }
}
exports.everyRule = everyRule;
//# sourceMappingURL=Schedule.js.map