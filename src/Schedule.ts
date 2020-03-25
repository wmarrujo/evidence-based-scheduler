import {DateTime} from "luxon"
import {ScheduleRuleString, Hours, ISODateString} from "@/types"
import {ValidationError} from "@/Error"
const {str, sequenceOf, choice, char, digit, whitespace, optionalWhitespace, sepBy1, many1} = require("arcsecond") // TODO: wait for this library to add typescript support

////////////////////////////////////////////////////////////////////////////////
// CLASS
////////////////////////////////////////////////////////////////////////////////

export class Schedule { // schedule for a resource
	#generator: (date: DateTime) => Array<Period>
	
	constructor(rules: Array<ScheduleRuleString>) {
		const ruleEvaluators = rules.map(makeRule).reverse()
		// TODO: ensure that the task has at least some time when it is available (at least one include that isn't overridden)
		this.#generator = (date: DateTime): Array<Period> => {
			for (const ruleEvaluator of ruleEvaluators) { // for each rule in backwards order
				const periods = ruleEvaluator(date) // evaluate to either an periods amount or undefined
				if (periods) return periods // if it matched and gave back periods, return those & stop evaluating the rules
			}
			return [] // if none of the rules matched
		}
	}
	
	getNextBeginFrom(date: DateTime): DateTime { // get the next available begin date from a certain time, return the same date if possible, inclusive
		const todayPeriods = this.#generator(date)
		if (todayPeriods.length != 0) { // today has some periods
			const alreadyInPeriod = todayPeriods.find(period => period.begin < date && date < period.end) // try to find a period that it's already in
			if (alreadyInPeriod) { // it found that the date is currently in a work period
				return date // the date we already have works as a begin date
			} else { // it's not currently in a work period
				const laterPeriods = todayPeriods.filter(period => date < period.begin) // just get the periods with begin times after now
				if (laterPeriods.length != 0) { // a later period was found
					return laterPeriods[0].begin // return that period's begin date, since it's the next place it could start
				} // else, no more working periods were found this day, continue on to check the next day
			}
		} // no periods on this day, or if `date` didn't work out
		const nextWorkDay = getNextWorkDayFrom(date.plus({days: 1}), this.#generator) // get the next day with periods
		const periods = this.#generator(nextWorkDay) // get the periods from that day
		return periods[0].begin // get the beginning of the first period in that day
	}
	
	getNextEndFrom(date: DateTime): DateTime { // like `getNextBeginFrom` except finds the next working period ending time, return the same date if possible, inclusive
		const todayPeriods = this.#generator(date)
		if (todayPeriods.length != 0) { // today has some periods
			const periodsEndingLater = todayPeriods.filter(period => date < period.end) // all periods that are ending later than now
			if (periodsEndingLater.length != 0) { // it found a period ending later
				return periodsEndingLater[0].end // return that first ending date
			} // it didn't find a period ending later, keep looking
		} // no periods on this day, or if `date didn't work out`
		const nextWorkDay = getNextWorkDayFrom(date.plus({days: 1}), this.#generator) // get the next day with periods
		const periods = this.#generator(nextWorkDay) // get the periods from that day
		return periods[0].end // get the ending of the first period in that day
	}
}

function getNextWorkDayFrom(date: DateTime, generator: (date: DateTime) => Array<Period>): DateTime {
	let d = date.startOf("day")
	let periods = generator(d)
	while (periods.length == 0) { // check dates until it finds one with some work time scheduled
		d.plus({days: 1}) // increment to the next day
		periods = generator(d) // find the periods for that day
	}
	return d
}

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

const spacing = sequenceOf([whitespace, optionalWhitespace]) // at least one space
const ordinal = choice(["weekday", "weekend", "day", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(str))
const duration = choice(["year", "month", "week", "day"].map(str)) // TODO: add s appending

const float = choice([
	sequenceOf([many1(digit), char("."), many1(digit)]),
	many1(digit)
])
	.map((result: any) => Number(result.flat(Infinity).join("")))

const time = sequenceOf([digit, digit, char(";"), digit, digit])
	.map((result: any) => ({hour: Number(result.slice(0, 2).join("")), minute: Number(result.slice(3).join(""))}))

const date = sequenceOf([digit, digit, digit, digit, char("-"), digit, digit, char("-"), digit, digit])
	.map((result: any) => result.join("")) // turn it into a single date string

const times = sequenceOf([str("from"), spacing, time, spacing, str("to"), spacing, time])
	.map((result: any) => ({from: result[2], to: result[6]}))

const occurrence = choice([
	sequenceOf([str("on"), spacing, date])
		.map((result: any) => ({on: result[2]})),
	sequenceOf([str("from"), spacing, date, spacing, choice([
		sequenceOf([str("to"), spacing, date])
			.map((result: any) => ({to: result[2]})),
		sequenceOf([str("for"), spacing, float, spacing, duration, spacing, str("every"), spacing, float, spacing, duration])
			.map((result: any) => ({forValue: result[2], forUnit: result[4], repeatValue: result[8], repeatUnit: result[10]}))
	])
	])
		.map((result: any) => ({from: result[2], ...result[4]})),
	sequenceOf([str("every"), spacing, ordinal])
		.map((result: any) => ({every: result[2]}))
])

const rule = sequenceOf([
	choice([
		str("exclude")
			.map((_: any) => ({})),
		sequenceOf([str("include"), spacing, sepBy1(sequenceOf([spacing, str("and"), spacing]))(times)])
			.map((result: any) => ({times: result[2]}))
	]),
	spacing,
	occurrence
])
	.map((result: any) => ({...result[0], ...result[2]}))
	

// PARSING

export function parseRule(ruleString: ScheduleRuleString): ScheduleRuleParts {
	const result = rule.run(ruleString)
	// TODO: put in error handling
	return result.result
}

// INTERMEDIATE TYPES

type Time = {hour: number, minute: number}
type Times = Array<{from: Time, to: Time}>

interface ScheduleRuleParts {
	times: undefined | Times, // tells you include vs exclude
	on: undefined | ISODateString,
	from: undefined | ISODateString,
	to: undefined | ISODateString
	forValue: undefined | number
	forUnit: undefined | string,
	repeatValue: undefined | number,
	repeatUnit: undefined | string,
	every: undefined | string
}

function validateTimes(times: Times): void {
	times.forEach(time => {
		validateTime(time.from)
		validateTime(time.to)
		if (time.to.hour*60 + time.to.minute < time.from.hour*60 + time.from.minute) { // if the "to" is before the "from"
			throw new ValidationError(`From time is before end time: from "${("0" + time.from.hour).slice(-2)}:${("0" + time.from.minute).slice(-2)}" > to "${("0" + time.from.hour).slice(-2)}:${("0" + time.from.minute).slice(-2)}"`)
		}
	})
}

function validateTime(time: Time): void {
	if (24 < time.hour || (time.hour == 24 && 0 < time.minute) || 60 <= time.minute) { // if hour is > 24 (allowing 24:00), or minute is >= 60
		throw new ValidationError(`Time entered is not a valid time: "${("0" + time.hour).slice(-2)}:${("0" + time.minute).slice(-2)}"`)
	}
}

// RULE MAKING

export function makeRule(ruleString: ScheduleRuleString): ScheduleRule {
	const ruleParts = parseRule(ruleString.toLowerCase())
	
	const times = ruleParts.times || []
	validateTimes(times)
	times.sort((a, b) => a.from.hour*60 + a.from.minute < b.from.hour*60 + b.from.minute ? -1 : (a.from.hour*60 + a.from.minute > b.from.hour*60 + b.from.minute ? 1 : 0)) // sort the times in chronological order
	if (ruleParts.on) { // an "on" rule
		const on = DateTime.fromISO(ruleParts.on)
		if (!on.isValid) throw new ValidationError(`Date entered not a valid date: "${ruleParts.on}"`)
		return dateRule(on, times)
	} else if (ruleParts.from) { // a "from" rule
		const from = DateTime.fromISO(ruleParts.from)
		if (!from.isValid) throw new ValidationError(`Date entered not a valid date: "${ruleParts.from}"`)
		if (ruleParts.to) { // a "from to" rule
			const to = DateTime.fromISO(ruleParts.to)
			if (!to.isValid) throw new ValidationError(`Date entered not a valid date: "${ruleParts.to}"`)
			return fromToRule(from, to, times)
		} else if (ruleParts.forValue && ruleParts.forUnit && ruleParts.repeatValue && ruleParts.repeatUnit) { // an "from for every" rule
			return fromForRepeatRule(from, ruleParts.forValue, ruleParts.forUnit, ruleParts.repeatValue, ruleParts.repeatUnit, times)
		} else {
			throw new ValidationError("Expected \"to\" or \"for _ _ every _ _\" in rule declaration")
		}
	} else if (ruleParts.every) { // an "every" rule
		return everyRule(ruleParts.every, times)
	} else {
		throw new ValidationError("Expected \"on\", \"from\", or \"every\" in rule declaration")
	}
}

// POSSIBLE RULE FUNCTIONS (GENERATORS FOR THOSE RULES)

interface Period {
	begin: DateTime,
	end: DateTime
}

type ScheduleRule = (date: DateTime) => Array<Period> | undefined // a function which will either give you the periods of time on this day which are included (or if none are: []), or tell you that this rule doesn't apply (undefined)

function makePeriodsOnDate(date: DateTime, times: Times): Array<Period> {
	return times.map(time => {
		return {
			begin: date.set({hour: time.from.hour, minute: time.from.minute}),
			end: date.set({hour: time.to.hour, minute: time.to.minute})
		}
	})
}

function dateRule(on: DateTime, times: Times = []): ScheduleRule {
	return (date: DateTime) => date == on ? makePeriodsOnDate(date, times) : undefined
}

function fromToRule(from: DateTime, to: DateTime, times: Times = []): ScheduleRule {
	return (date: DateTime) => from <= date || date <= to ? makePeriodsOnDate(date, times) : undefined
}

function fromForRepeatRule(from: DateTime, forValue: number, forUnit: string, repeatValue: number, repeatUnit: string, times: Times = []): ScheduleRule {
	const forPluralUnit = forUnit.concat(forUnit.endsWith("s") ? "" : "s")
	const repeatPluralUnit = repeatUnit.concat(repeatUnit.endsWith("s") ? "" : "s") as "years" | "months" | "weeks" | "days"
	
	return (date: DateTime) => {
		const periodsAway = Math.floor(date.diff(from, repeatPluralUnit)[repeatPluralUnit] / repeatValue) * repeatValue // how many periods is the date away from the fromDate?
		const beginDate = from.plus({[repeatPluralUnit]: periodsAway}) // go to that many periods away, just before the date
		const endDate = beginDate.plus({[forPluralUnit]: forValue}) // that many periods away, just before the date to potentially just after
		
		return beginDate <= date && date <= endDate ? makePeriodsOnDate(date, times) : undefined
	}
}

function everyRule(every: string, times: Times = []): ScheduleRule {
	if (every == "day") {
		return (date: DateTime) => makePeriodsOnDate(date, times)
	} else if (every == "weekday") {
		return (date: DateTime) => date.weekday <= 5 ? makePeriodsOnDate(date, times) : undefined
	} else if (every == "weekend") {
		return (date: DateTime) => 5 < date.weekday ? makePeriodsOnDate(date, times) : undefined
	} else if (every == "monday") {
		return (date: DateTime) => date.weekday == 1 ? makePeriodsOnDate(date, times) : undefined
	} else if (every == "tuesday") {
		return (date: DateTime) => date.weekday == 2 ? makePeriodsOnDate(date, times) : undefined
	} else if (every == "wednesday") {
		return (date: DateTime) => date.weekday == 3 ? makePeriodsOnDate(date, times) : undefined
	} else if (every == "thursday") {
		return (date: DateTime) => date.weekday == 4 ? makePeriodsOnDate(date, times) : undefined
	} else if (every == "friday") {
		return (date: DateTime) => date.weekday == 5 ? makePeriodsOnDate(date, times) : undefined
	} else if (every == "saturday") {
		return (date: DateTime) => date.weekday == 6 ? makePeriodsOnDate(date, times) : undefined
	} else if (every == "sunday") {
		return (date: DateTime) => date.weekday == 7 ? makePeriodsOnDate(date, times) : undefined
	} else {
		throw new ValidationError("Expected one of \"day\", \"weekday\", \"weekend\", \"monday\", \"tuesday\", \"wednesday\", \"thursday\", \"friday\", \"saturday\", or \"sunday\" after \"every\"")
	}
}