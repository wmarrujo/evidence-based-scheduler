import {DateTime, Interval} from "luxon"

////////////////////////////////////////////////////////////////////////////////
// SCHEDULE
////////////////////////////////////////////////////////////////////////////////

export class Schedule {
	rules: Array<Rule<Calendar> | Schedule>
	
	constructor(rules: Array<Rule<Calendar> | Schedule>) {
		this.rules = rules
	}
	
	// SERIALIZATION
	
	toJSON() {
		return this.rules // just return this whole thing as the array of rules that it is
	}
	
	// CALCULATIONS
	
	getNext(after: DateTime): Interval {
		return Interval.fromDateTimes(after, DateTime.now()) // TODO: implement
	}
	
	getPrevious(before: DateTime): Interval {
		return Interval.fromDateTimes(DateTime.now(), before) // TODO: implement
	}
	
	getNextStart(after: DateTime): DateTime {
		return DateTime.now() // TODO: implement
	}
	
	getNextEnd(after: DateTime): DateTime {
		return DateTime.now() // TODO: implement
	}
	
	getPreviousStart(before: DateTime): DateTime {
		return DateTime.now() // TODO: implement
	}
	
	getPreviousEnd(before: DateTime): DateTime {
		return DateTime.now() // TODO: implement
	}
}

////////////////////////////////////////////////////////////////////////////////
// RULE
////////////////////////////////////////////////////////////////////////////////

export class Rule<Calendar> {
	enabling: boolean // if the rule enables time or disables it
	calendar: Calendar // what calendar it's in
	trigger: Trigger // what individual dates start the effect
	duration: Period<Calendar> // how long after the trigger the rule's effect is for (can use both date and time math) // FIXME: durations will also be calendar-specific :(
	
	constructor(enabling: boolean, calendar: Calendar, trigger: Trigger, duration: Period<Calendar>) {
		this.enabling = enabling
		this.calendar = calendar
		this.trigger = trigger
		this.duration = duration
	}
	
	getNext(after: DateTime): Interval {
		return Interval.fromDateTimes(after, DateTime.now()) // TODO: implement
	}
	
	getPrevious(before: DateTime): Interval {
		return Interval.fromDateTimes(DateTime.now(), before) // TODO: implement
	}
}

////////////////////////////////////////////////////////////////////////////////
// TRIGGER
////////////////////////////////////////////////////////////////////////////////

export type Trigger = DateTime | Array<DateTime> | Repeat<Calendar>

export class Repeat<Calendar> {
	zone: string | undefined // what time zone is this in? // must be a valid IANA zone
	location: string | undefined // used for sunrise & sunset calculations
	every: Unit<Calendar> | Special<Calendar>
	instructions: Array<Instruction<Calendar>>
	
	constructor(zone: string | undefined, location: string | undefined, every: Unit<Calendar> | Special<Calendar>, instructions: Array<Instruction<Calendar>>) {
		this.zone = zone
		this.location = location
		this.every = every
		this.instructions = instructions
	}
	
	getNext(after: DateTime): DateTime {
		return DateTime.now() // TODO: implement
	}
	
	getPrevious(before: DateTime): DateTime {
		return DateTime.now() // TODO: implement
	}
}

////////////////////////////////////////////////////////////////////////////////
// INSTRUCTION
////////////////////////////////////////////////////////////////////////////////

export type Operator = "plus" | "minus" | "start_of" | "end_of" | "next" | "previous"

export class Instruction<Calendar> {
	operator: Operator
	number?: number // only positive integers
	unit: Unit<Calendar> | PluralUnit<Calendar> | Special<Calendar>
	
	constructor(operator: Operator, number: number | undefined, unit: Unit<Calendar> | PluralUnit<Calendar> | Special<Calendar>) {
		this.operator = operator
		this.number = number
		this.unit = unit
	}
	
	toJSON() {
		switch (this.operator) {
		case "plus": return `${0 < this.number! ? "+" : "-"} ${Math.abs(this.number!)} ${shorten<Calendar>(this.unit)}`
		case "minus": return `${0 < this.number! ? "-" : "+"} ${Math.abs(this.number!)} ${shorten(this.unit, this.calendar)}`
		case "start_of": return `|< ${this.unit}`
		case "end_of": return `>| ${this.unit}`
		case "next": return `>> ${this.unit}`
		case "previous": return `<< ${this.unit}`
		}
	}
	
	static fromString<Calendar>(string: string): Instruction<Calendar> {
		const tokens = string.split(" ")
		switch (tokens[0]) {
		case "+": return new Instruction<Calendar>("plus", Number(tokens[1]), tokens[2] as Unit<Calendar> | PluralUnit<Calendar> | Special<Calendar>)
		case "-": return new Instruction<Calendar>("minus", Number(tokens[1]), tokens[2] as Unit<Calendar> | PluralUnit<Calendar> | Special<Calendar>)
		case "|<": return new Instruction<Calendar>("start_of", undefined, tokens[1] as Unit<Calendar> | PluralUnit<Calendar> | Special<Calendar>)
		case ">|": return new Instruction<Calendar>("end_of", undefined, tokens[1] as Unit<Calendar> | PluralUnit<Calendar> | Special<Calendar>)
		case ">>": return new Instruction<Calendar>("next", undefined, tokens[1] as Unit<Calendar> | PluralUnit<Calendar> | Special<Calendar>)
		case "<<": return new Instruction<Calendar>("previous", undefined, tokens[1] as Unit<Calendar> | PluralUnit<Calendar> | Special<Calendar>)
		default: throw new Error(`Could not parse Instruction. Invalid operator of ${tokens[0]}`)
		}
	}
	
	apply(to: DateTime): DateTime {
		return DateTime.now()
	}
}

////////////////////////////////////////////////////////////////////////////////

export type Period<Calendar> = Array<{
	amount: number,
	unit: Unit<Calendar> | PluralUnit<Calendar>
	
	toString(): string {
		
	}
}>

////////////////////////////////////////////////////////////////////////////////
// CALENDARS
////////////////////////////////////////////////////////////////////////////////

export type Calendar = "gregorian" //| "iso" | "4-4-5" | "julian" | "hebrew" | "minguo" | "japanese" | "lunar islamic" | "solar islamic" | "ethiopian" | "thai" | "indian" | "burmese" | "bengali" | "nepalese" ... // TODO: implement other calendar systems

export type Unit<Calendar> =
	Calendar extends "gregorian" ? ("year" | "month" | "week" | "day" | "hour" | "minute" | "second")
	// : Calendar extends "iso" ? ("year" | "decade" | "century" | "millenium" | "month" | "quarter" | "day" | "week" | "second" | "minute" | "hour")
	: never

export type PluralUnit<Calendar> =
	Calendar extends "gregorian" ? ("years" | "decades" | "centuries" | "millenia" | "months" | "quarters" | "days" | "weeks" | "seconds" | "minutes" | "hours")
	: never

export type Special<Calendar> = // NOTE: these are useful for using with "next" and "previous" instructions
	Calendar extends "gregorian" ? ("decade" | "century" | "millenium" | "quarter" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" | "leap day" | "easter")
	: never

export type Solar = "astronomical dawn" | "nautical dawn" | "civil dawn" | "sunrise" | "solar noon" | "sunset" | "civil dusk" | "nautical dusk" | "astronomical dusk"
export type Lunar = "new moon" | "waxing crescent moon" | "first quarter moon" | "waxing gibbous moon" | "full moon" | "waning gibbous moon" | "last quarter moon" | "waning crescent moon"

// short values are used when serializing
function shorten<Calendar>(unit: string, calendar: Calendar) {
	switch (calendar) {
	case "gregorian": return {"year": "yr", "month": "mo", "week": "wk", "day": "d", "hour": "h", "minute": "m", "second": "s", "monday": "mon", "tuesday": "tue", "wednesday": "wed", "thursday": "thu", "friday": "fri", "saturday": "sat", "sunday": "sun", "leap day": "leap", "easter": "easter"}[unit]
	default: return unit
	}
}
function lengthen(unit: string, calendar: Calendar) {
	switch (calendar) {
	case "gregorian": return {"yr": "year", "mo": "month", "wk": "week", "d": "day", "h": "hour", "m": "minute", "s": "second", "mon": "monday", "tue": "tuesday", "wed": "wednesday", "thu": "thursday", "fri": "friday", "sat": "saturday", "sun": "sunday", "leap": "leap_day", "easter": "easter"}[unit]
	default: return unit
	}
}
