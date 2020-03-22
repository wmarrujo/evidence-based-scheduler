import {DateTime} from "luxon"
import {ScheduleRuleString, Hours} from "@/types"
import {ParseError, ValidationError} from "@/Error"

////////////////////////////////////////////////////////////////////////////////
// CLASS
////////////////////////////////////////////////////////////////////////////////

type ScheduleGenerator = (date: DateTime) => Hours

export class Schedule { // schedule for a resource
	#generator: ScheduleGenerator // function that takes a date and gives the number of hours on that date
	
	constructor(rules: Array<ScheduleRuleString>) {
		const ruleEvaluators = rules.map(makeRule).reverse()
		this.#generator = (date: DateTime) => {
			for (const ruleEvaluator of ruleEvaluators) { // for each rule in backwards order
				const hours = ruleEvaluator(date) // evaluate to either an hours amount or undefined
				if (hours) return hours // if it matched and gave back hours, return those & stop evaluating the rules
			}
			return 0 // if none of the rules matched
		}
	}
	
	hoursOnDate(date: DateTime): Hours {
		return this.#generator(date)
	}
}

////////////////////////////////////////////////////////////////////////////////
// RULE PARSING
////////////////////////////////////////////////////////////////////////////////

// INTERMEDIATE TYPE

interface ScheduleRuleParts {
	hours: string | undefined, // tells you include vs exclude
	date: string | undefined,
	from: string | undefined,
	to: string | undefined,
	for: string | undefined,
	forUnit: string | undefined,
	repeat: string | undefined,
	repeatUnit: string | undefined,
	every: string | undefined
}

// PARSER

const matchNumber = "\\d+(?:\\.\\d+)?"
const matchISODate = "\\d{4}-\\d{2}-\\d{2}"
const matchOrdinal = "weekday|weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday|day"
const matchDuration = "years?|months?|weeks?|days?"

const matchDate = `(?<date>${matchISODate})`
const matchFrom = `from (?<from>${matchISODate})`
const matchTo = `to (?<to>${matchISODate})`
const matchFor = `for (?<for>${matchNumber}) (?<forUnit>${matchDuration})`
const matchRepeat = `every (?<repeat>${matchNumber}) (?<repeatUnit>${matchDuration})`
const matchEvery = `every (?<every>${matchOrdinal})`

function matchRule(rule: ScheduleRuleString): ScheduleRuleParts {
	let matchWay: RegExp | undefined = undefined
	
	// match the type of the rule
	const typeMatch = rule.match(/(include|exclude) (.*)/i) // parse the rule type out
	if (typeMatch == null) {
		throw new ParseError("Expected rule to start with \"include\" or \"exclude\"")
	} else if (typeMatch[1].toLowerCase() == "include") {
		matchWay = new RegExp(`(?<hours>${matchNumber}) hours (?:on ${matchDate}|${matchFrom} (?:${matchTo}|${matchFor} ${matchRepeat})|${matchEvery})`, "i")
	} else if (typeMatch[1].toLowerCase() == "exclude") {
		matchWay = new RegExp(`on ${matchDate}|${matchFrom} (?:${matchTo}|${matchFor} ${matchRepeat})|${matchEvery}`, "i")
	} else {
		throw new ParseError("Expected rule to start with \"include\" or \"exclude\"")
	}
	
	// match the way of the rule
	const wayMatch = typeMatch[2].match(matchWay) // parse the rule way out
	if (wayMatch == null) { // it couldn't parse
		throw new ParseError(`Expected rule to be of the form "${typeMatch[1].toLowerCase()} ${typeMatch[1].toLowerCase() == "include" ? "NUMBER hours ( on" : "( "} DATE | from DATE to DATE | from DATE for NUMBER DURATION every NUMBER DURATION | every ORDINAL)"`)
	} else {
		return JSON.parse(JSON.stringify(wayMatch.groups))
	}
}

// RULE MAKER

export function makeRule(rule: ScheduleRuleString): (date: DateTime) => Hours | undefined {
	// generate peices
	const ruleParts = matchRule(rule)
	// put peices to gether by composing functions
	if (ruleParts.hours) { // it's an include rule
		const hours = Number(ruleParts.hours)
		if (ruleParts.date) { // it's a date-specific rule
			// include 2020-02-10 5 hours
			const actualDate = DateTime.fromISO(ruleParts.date)
			if (!actualDate.isValid) throw new ValidationError(`Date ${actualDate} is invalid`)
			
			return (date: DateTime) => {
				return date.hasSame(actualDate, "day") ? hours : undefined
			}
		} else if (ruleParts.from) { // it's a rule with a from in it
			const fromDate = DateTime.fromISO(ruleParts.from)
			if (!fromDate.isValid) throw new ValidationError(`Date ${fromDate} is invalid`)
			
			if (ruleParts.to) { // it's a range
				// include from 2020-02-10 to 2020-02-15 5 hours
				const toDate = DateTime.fromISO(ruleParts.to)
				if (!toDate.isValid) throw new ValidationError(`Date ${toDate} is invalid`)
				
				return (date: DateTime) => {
					return fromDate <= date && date <= toDate ? hours : undefined
				}
			} else if (ruleParts.for && ruleParts.forUnit && ruleParts.repeat && ruleParts.repeatUnit) { // it's a repeating event
				// include from 2020-02-10 for 5 days every 1 month 5 hours
				const forAmount = Number(ruleParts.for)
				const forUnit = ruleParts.forUnit.toLowerCase().concat(ruleParts.forUnit.toLowerCase().endsWith("s") ? "" : "s") // DateTime formatted unit
				const repeatAmount = Number(ruleParts.repeat)
				const repeatUnit = ruleParts.repeatUnit.toLowerCase().concat(ruleParts.repeatUnit.toLowerCase().endsWith("s") ? "" : "s") as "years" | "months" | "weeks" | "days" // DateTime formatted unit
				
				return (date: DateTime) => {
					const periodsAway = Math.floor(date.diff(fromDate, repeatUnit)[repeatUnit] / repeatAmount) * repeatAmount // how many periods is the date away from the fromDate?
					const beginDate = fromDate.plus({[repeatUnit]: periodsAway}) // go to that many periods away, just before the date
					const endDate = beginDate.plus({[forUnit]: forAmount}) // that many periods away, just before the date to potentially just after
					return beginDate <= date && date <= endDate ? hours : undefined
				}
			} else {
				throw new ParseError(`Expected rule to have either "to DATE" or "for NUMBER DURATION every NUMBER DURATION" after the "include from ${fromDate}"`)
			}
		} else if (ruleParts.every) {
			const every = ruleParts.every.toLowerCase()
			if (every == "day") {
				// include every day 5 hours
				return (_date: DateTime) => {
					return hours
				}
			} else if (every == "weekday") {
				// include every weekday 5 hours
				return (date: DateTime) => {
					return date.weekday <= 5 ? hours : undefined
				}
			} else if (every == "weekend") {
				// include every weekend 5 hours
				return (date: DateTime) => {
					return 6 <= date.weekday ? hours : undefined
				}
			} else if (every == "monday") {
				// include every monday 5 hours
				return (date: DateTime) => {
					return date.weekday == 1 ? hours : undefined
				}
			} else if (every == "tuesday") {
				// include every tuesday 5 hours
				return (date: DateTime) => {
					return date.weekday == 2 ? hours : undefined
				}
			} else if (every == "wednesday") {
				// include every wednesday 5 hours
				return (date: DateTime) => {
					return date.weekday == 3 ? hours : undefined
				}
			} else if (every == "thursday") {
				// include every thursday 5 hours
				return (date: DateTime) => {
					return date.weekday == 4 ? hours : undefined
				}
			} else if (every == "friday") {
				// include every friday 5 hours
				return (date: DateTime) => {
					return date.weekday == 5 ? hours : undefined
				}
			} else if (every == "saturday") {
				// include every saturday 5 hours
				return (date: DateTime) => {
					return date.weekday == 6 ? hours : undefined
				}
			} else if (every == "sunday") {
				// include every sunday 5 hours
				return (date: DateTime) => {
					return date.weekday == 7 ? hours : undefined
				}
			} else {
				throw new ParseError("Expected rule to have one of \"day\", \"weekday\", \"weekend\", \"monday\", \"tuesday\", \"wednesday\", \"thursday\", \"friday\", \"saturday\", \"sunday\" after \"include NUMBER hours every\"")
			}
		} else {
			throw new ParseError("Expected rule to have \"DATE\", \"from DATE to DATE\", \"from DATE for NUMBER DURATION every NUMBER DURATION\", or \"every ORDINAL\" after \"include NUMBER hours\"")
		}
	} else { // it's an exclude rule
		if (ruleParts.date) { // it's a date-specific rule
			// exclude 2020-02-10
			const actualDate = DateTime.fromISO(ruleParts.date)
			if (!actualDate.isValid) throw new ValidationError(`Date ${actualDate} is invalid`)
			
			return (date: DateTime) => {
				return date.hasSame(actualDate, "day") ? 0 : undefined
			}
		} else if (ruleParts.from) { // it's a rule with a from in it
			const fromDate = DateTime.fromISO(ruleParts.from)
			if (!fromDate.isValid) throw new ValidationError(`Date ${fromDate} is invalid`)
			
			if (ruleParts.to) { // it's a range
				// exclude from 2020-02-10 to 2020-02-15
				const toDate = DateTime.fromISO(ruleParts.to)
				if (!toDate.isValid) throw new ValidationError(`Date ${toDate} is invalid`)
				
				return (date: DateTime) => {
					return fromDate <= date && date <= toDate ? 0 : undefined
				}
			} else if (ruleParts.for && ruleParts.forUnit && ruleParts.repeat && ruleParts.repeatUnit) { // it's a repeating event
				// exclude from 2020-02-10 for 5 days every 1 month
				const forAmount = Number(ruleParts.for)
				const forUnit = ruleParts.forUnit.toLowerCase().concat(ruleParts.forUnit.toLowerCase().endsWith("s") ? "" : "s") // DateTime formatted unit
				const repeatAmount = Number(ruleParts.repeat)
				const repeatUnit = ruleParts.repeatUnit.toLowerCase().concat(ruleParts.repeatUnit.toLowerCase().endsWith("s") ? "" : "s") as "years" | "months" | "weeks" | "days" // DateTime formatted unit
				
				return (date: DateTime) => {
					const periodsAway = Math.floor(date.diff(fromDate, repeatUnit)[repeatUnit] / repeatAmount) * repeatAmount // how many periods is the date away from the fromDate?
					const beginDate = fromDate.plus({[repeatUnit]: periodsAway}) // go to that many periods away, just before the date
					const endDate = beginDate.plus({[forUnit]: forAmount}) // that many periods away, just before the date to potentially just after
					return beginDate <= date && date <= endDate ? 0 : undefined
				}
			} else {
				throw new ParseError(`Expected rule to have either "to DATE" or "for NUMBER DURATION every NUMBER DURATION" after the "exclude from ${fromDate}"`)
			}
		} else if (ruleParts.every) {
			const every = ruleParts.every.toLowerCase()
			if (every == "day") {
				// exclude every day
				return (_date: DateTime) => {
					return 0
				}
			} else if (every == "weekday") {
				// exclude every weekday
				return (date: DateTime) => {
					return date.weekday <= 5 ? 0 : undefined
				}
			} else if (every == "weekend") {
				// exclude every weekend
				return (date: DateTime) => {
					return 6 <= date.weekday ? 0 : undefined
				}
			} else if (every == "monday") {
				// exclude every monday
				return (date: DateTime) => {
					return date.weekday == 1 ? 0 : undefined
				}
			} else if (every == "tuesday") {
				// exclude every tuesday
				return (date: DateTime) => {
					return date.weekday == 2 ? 0 : undefined
				}
			} else if (every == "wednesday") {
				// exclude every wednesday
				return (date: DateTime) => {
					return date.weekday == 3 ? 0 : undefined
				}
			} else if (every == "thursday") {
				// exclude every thursday
				return (date: DateTime) => {
					return date.weekday == 4 ? 0 : undefined
				}
			} else if (every == "friday") {
				// exclude every friday
				return (date: DateTime) => {
					return date.weekday == 5 ? 0 : undefined
				}
			} else if (every == "saturday") {
				// exclude every saturday
				return (date: DateTime) => {
					return date.weekday == 6 ? 0 : undefined
				}
			} else if (every == "sunday") {
				// exclude every sunday
				return (date: DateTime) => {
					return date.weekday == 7 ? 0 : undefined
				}
			} else {
				throw new ParseError("Expected rule to have one of \"day\", \"weekday\", \"weekend\", \"monday\", \"tuesday\", \"wednesday\", \"thursday\", \"friday\", \"saturday\", \"sunday\" after \"exclude every\"")
			}
		} else {
			throw new ParseError("Expected rule to have \"DATE\", \"from DATE to DATE\", \"from DATE for NUMBER DURATION every NUMBER DURATION\", or \"every ORDINAL\" after \"exclude\"")
		}
	}
}

////////////////////////////////////////////////////////////////////////////////
// VALIDATION
////////////////////////////////////////////////////////////////////////////////

