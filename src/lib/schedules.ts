import {DateTime, Duration, Interval} from "luxon"

export * from "luxon"

////////////////////////////////////////////////////////////////////////////////

export type EncodedSchedule = {
	id: number
	name?: string
	rules: Array<number>
	zone?: string
}

export type EncodedRule = {
	id: number
	name?: string
	enabling: boolean
	trigger: EncodedTrigger
	duration: string
	zone?: string
}

export type EncodedTrigger = string | Array<string> | EncodedRepeat

export type EncodedRepeat = {
	every: Frequency
	steps?: number
	reference?: string
	with?: Array<string> | string
}

////////////////////////////////////////////////////////////////////////////////
// SCHEDULE
////////////////////////////////////////////////////////////////////////////////

export class Schedule {
	id: number
	name?: string
	rules: Array<Rule | Schedule>
	zone?: string // TZ database time zone or UTC offset, inherits it from its container if it doesn't have one
	
	// CONSTRUCTORS
	
	constructor(id: number, name: string | undefined, rules: Array<Rule | Schedule>, zone: string | undefined) {
		this.id = id
		this.name = name
		this.rules = rules
		this.zone = zone
	}
	
	static fromEncoded(encoded: EncodedSchedule, reference: Map<number, Rule | Schedule>): Schedule {
		return new Schedule(encoded.id, encoded.name, encoded.rules.map(r => reference.get(r)!), encoded.zone)
	}
	
	// MATH
}

////////////////////////////////////////////////////////////////////////////////
// RULE
////////////////////////////////////////////////////////////////////////////////

export class Rule {
	id: number
	name?: string
	enabling: boolean // if the rule enables time or disables it
	trigger: Trigger // what individual dates start the effect (must be sorted when stored here)
	duration: Duration // how long after each trigger date the rule's effect is for (can use both date and time math)
	zone?: string // TZ database time zone or UTC offset, inherits it from its container if it doesn't have one
	
	// CONSTRUCTORS
	
	constructor(id: number, name: string | undefined, enabling: boolean, trigger: Trigger, duration: Duration, zone: string | undefined) {
		this.id = id
		this.name = name
		this.enabling = enabling
		this.trigger = Array.isArray(trigger) ? trigger.sort() : trigger
		this.duration = duration
		this.zone = zone
	}
	
	static fromEncoded(encoded: EncodedRule): Rule {
		const trigger = typeof encoded.trigger === "string" ? DateTime.fromISO(encoded.trigger) : Array.isArray(encoded.trigger) ? encoded.trigger.map(t => DateTime.fromISO(t)) : Repeat.fromEncoded(encoded.trigger)
		return new Rule(encoded.id, encoded.name, encoded.enabling, trigger, Duration.fromISO(encoded.duration), encoded.zone)
	}
	
	// MATH
	
	/** gets the next time an instance starts (not including the current one if it happens to be on one) */
	nextStart(after: DateTime): DateTime | null {
		if (Array.isArray(this.trigger)) {
			return this.trigger.find(t => after < t) ?? null
		} else if (this.trigger instanceof DateTime) {
			return after < this.trigger ? this.trigger : null
		} else {
			return (this.trigger as Repeat).next(after)
		}
	}
	// FIXME: debug this function next, many things aren't working - maybe make some unit tests (don't forget about time zones)
}

export type Trigger = DateTime | Array<DateTime> | Repeat

////////////////////////////////////////////////////////////////////////////////
// REPEAT
////////////////////////////////////////////////////////////////////////////////

export class Repeat {
	every: Frequency // sets the starting point for the repeat "every year" or "every monday" or "every hour"
	steps?: number // tells us whether to take more than 1 step, modifying the every to "every other year" or "every 3 thursdays" or "every 6 hours", default is 1
	reference?: DateTime // when we use steps, we need to know which one to start on, it starts on the next valid instance of the every after this date "every 3 thursdays after the 28th of Steptember in 2024", default is defined differently for different frequency values
	with?: Array<Instruction> | Instruction // how to modify the date once we have our starting point based on the frequency
	
	// CONSTRUCTORS
	
	constructor(every: Frequency, steps: number | undefined, reference: DateTime | undefined, with_: Array<Instruction> | Instruction | undefined) {
		this.every = every
		this.steps = steps
		this.reference = reference
		this.with = with_
	}
	
	static fromEncoded(encoded: EncodedRepeat): Repeat {
		const with_ = Array.isArray(encoded.with) ? encoded.with.map(w => Duration.fromISO(w).isValid ? Duration.fromISO(w) : w as Instruction)
			: Duration.fromISO(encoded.with!).isValid ? Duration.fromISO(encoded.with!) : encoded.with as Instruction
		
		return new Repeat(encoded.every, encoded.steps, encoded.reference ? DateTime.fromISO(encoded.reference) : undefined, with_)
	}
	
	// MATH
	
	snap(after: DateTime): DateTime {
		const move = stepsSince(snap(after, this.every), this.every, this.reference) % (this.steps ?? 1) // the number of steps since the last time this frequency happened
		const [unit, multiplier] = shifters(this.every)
		return snap(after, this.every).minus({[unit]: multiplier * move}) // move it the way back to the last instance of the stepped frequency
	}
	
	next(after: DateTime): DateTime {
		const move = stepsSince(snap(after, this.every), this.every, this.reference) % (this.steps ?? 1) // the number of steps since the last time this frequency happened
		const [unit, multiplier] = shifters(this.every)
		return snap(after, this.every).plus({[unit]: multiplier * (1 - move)}) // move it the rest of the way to the next stepped frequency
	}
}

export type Frequency
	= "year" | "month" | "week" | "day" | "hour" | "minute" | "second" // regular segments
	| "millenium" | "century" | "decade" | "quarter" // larger segments
	| "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" // days of the week

export type Instruction
	= Duration // adds the duration
	| `snap ${Frequency}` // finds the previous instance of the frequency, but stays the same if it is currently on one (strictly greater than)
	| `next ${Frequency}` // finds the next instance of the frequency, even if it is on one currently (less than or equal to)

////////////////////////////////////////////////////////////////////////////////

/** Snaps a date to the nearest frequency instance before it or keeps it the same if it's already on one. */
function snap(date: DateTime, frequency: Frequency): DateTime {
	switch (frequency) {
	case "millenium": return date.startOf("year").set({year: Math.floor(date.year / 1000) * 1000})
	case "century": return date.startOf("year").set({year: Math.floor(date.year / 100) * 100})
	case "decade": return date.startOf("year").set({year: Math.floor(date.year / 10) * 10})
	case "year": return date.startOf("year")
	case "quarter": return date.startOf("month").set({month: Math.floor((date.month - 1) / 3) * 3 + 1})
	case "month": return date.startOf("month")
	case "week": return date.startOf("week")
	case "day": return date.startOf("day")
	case "hour": return date.startOf("hour")
	case "minute": return date.startOf("minute")
	case "second": return date.startOf("second")
	case "monday": return date.startOf("week")
	case "tuesday": return (date.weekday < 2 ? date.minus({weeks: 1}) : date).startOf("week").plus({days: 2})
	case "wednesday": return (date.weekday < 3 ? date.minus({weeks: 1}) : date).startOf("week").plus({days: 3})
	case "thursday": return (date.weekday < 4 ? date.minus({weeks: 1}) : date).startOf("week").plus({days: 4})
	case "friday": return (date.weekday < 5 ? date.minus({weeks: 1}) : date).startOf("week").plus({days: 5})
	case "saturday": return (date.weekday < 6 ? date.minus({weeks: 1}) : date).startOf("week").plus({days: 6})
	case "sunday": return (date.weekday < 7 ? date.minus({weeks: 1}) : date).startOf("week").plus({days: 7})
	default: return date
	}
}

/** Snaps a date to the nearest frequency instance after it, even if it's already on one. */
function next(date: DateTime, frequency: Frequency): DateTime {
	switch (frequency) {
	case "millenium": return date.startOf("year").plus({years: 1000 - Math.abs((date.year % 1000))})
	case "century": return date.startOf("year").plus({years: 100 - Math.abs((date.year % 100))})
	case "decade": return date.startOf("year").plus({years: 10 - Math.abs((date.year % 10))})
	case "year": return date.startOf("year").plus({years: 1})
	case "quarter": return date.startOf("month").plus({months: 3 - ((date.month - 1) % 3)})
	case "month": return date.startOf("month").plus({months: 1})
	case "week": return date.startOf("week").plus({weeks: 1})
	case "day": return date.startOf("day").plus({days: 1})
	case "hour": return date.startOf("hour").plus({hours: 1})
	case "minute": return date.startOf("minute").plus({minutes: 1})
	case "second": return date.startOf("second").plus({seconds: 1})
	case "monday": return date.startOf("week").plus({weeks: 1})
	case "tuesday": return date.startOf("day").plus({days: (2 - date.weekday + 7) % 7})
	case "wednesday": return date.startOf("day").plus({days: (3 - date.weekday + 7) % 7})
	case "thursday": return date.startOf("day").plus({days: (4 - date.weekday + 7) % 7})
	case "friday": return date.startOf("day").plus({days: (5 - date.weekday + 7) % 7})
	case "saturday": return date.startOf("day").plus({days: (6 - date.weekday + 7) % 7})
	case "sunday": return date.startOf("day").plus({days: (7 - date.weekday + 7) % 7})
	default: return date
	}
}

/** gets the canonical reference date for a frequency (the date from which the default steps start when not specified) */
function canonical(frequency: Frequency): DateTime {
	switch (frequency) {
	case "millenium": return DateTime.fromISO("1000-01-01")
	case "century": return DateTime.fromISO("1900-01-01")
	case "decade": return DateTime.fromISO("1970-01-01")
	case "year": return DateTime.fromISO("1970-01-01")
	case "quarter": return DateTime.fromISO("1970-01-01")
	case "month": return DateTime.fromISO("1970-01-01")
	case "week": return DateTime.fromISO("1970-01-05")
	case "day": return DateTime.fromISO("1970-01-01")
	case "hour": return DateTime.fromISO("1970-01-01")
	case "minute": return DateTime.fromISO("1970-01-01")
	case "second": return DateTime.fromISO("1970-01-01")
	case "monday": return DateTime.fromISO("1970-01-05")
	case "tuesday": return DateTime.fromISO("1970-01-06")
	case "wednesday": return DateTime.fromISO("1970-01-07")
	case "thursday": return DateTime.fromISO("1970-01-01")
	case "friday": return DateTime.fromISO("1970-01-02")
	case "saturday": return DateTime.fromISO("1970-01-03")
	case "sunday": return DateTime.fromISO("1970-01-04")
	}
}

/** returns how many steps since the reference date using the frequency to count */
function stepsSince(from: DateTime, frequency: Frequency, reference?: DateTime): number {
	switch (frequency) {
	case "millenium": return from.diff(reference || canonical(frequency), "years").years / 1000
	case "century": return from.diff(reference || canonical(frequency), "years").years / 100
	case "decade": return from.diff(reference || canonical(frequency), "years").years / 10
	case "year": return from.diff(reference || canonical(frequency), "years").years
	case "quarter": return from.diff(reference || canonical(frequency), "months").months / 3
	case "month": return from.diff(reference || canonical(frequency), "months").months
	case "week": return from.diff(reference || canonical(frequency), "weeks").weeks
	case "day": return from.diff(reference || canonical(frequency), "days").days
	case "hour": return from.diff(reference || canonical(frequency), "hours").hours
	case "minute": return from.diff(reference || canonical(frequency), "minutes").minutes
	case "second": return from.diff(reference || canonical(frequency), "seconds").seconds
	case "monday": return from.diff(reference || canonical(frequency), "weeks").weeks
	case "tuesday": return from.diff(reference || canonical(frequency), "weeks").weeks
	case "wednesday": return from.diff(reference || canonical(frequency), "weeks").weeks
	case "thursday": return from.diff(reference || canonical(frequency), "weeks").weeks
	case "friday": return from.diff(reference || canonical(frequency), "weeks").weeks
	case "saturday": return from.diff(reference || canonical(frequency), "weeks").weeks
	case "sunday": return from.diff(reference || canonical(frequency), "weeks").weeks
	}
}

/** the units and values you'd need to shift by to do math sticking to the frequency */
function shifters(frequency: Frequency): [string, number] {
	switch (frequency) {
	case "millenium": return ["years", 1000]
	case "century": return ["years", 100]
	case "decade": return ["years", 10]
	case "year": return ["years", 1]
	case "quarter": return ["months", 3]
	case "month": return ["months", 1]
	case "week": return ["weeks", 1]
	case "day": return ["days", 1]
	case "hour": return ["hours", 1]
	case "minute": return ["minutes", 1]
	case "second": return ["seconds", 1]
	case "monday": return ["weeks", 1]
	case "tuesday": return ["weeks", 1]
	case "wednesday": return ["weeks", 1]
	case "thursday": return ["weeks", 1]
	case "friday": return ["weeks", 1]
	case "saturday": return ["weeks", 1]
	case "sunday": return ["weeks", 1]
	}
}
