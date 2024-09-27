import {DateTime, Duration, Interval} from "luxon"

export * from "luxon"

////////////////////////////////////////////////////////////////////////////////

export type Schedule = {
	rules: Array<Rule | Schedule>
	zone?: string // TZ database time zone or UTC offset, inherits it from its container if it doesn't have one
}

export type Rule = {
	enabling: boolean // if the rule enables time or disables it
	trigger: Trigger // what individual dates start the effect
	duration: Duration // how long after each trigger date the rule's effect is for (can use both date and time math)
	zone?: string // TZ database time zone or UTC offset, inherits it from its container if it doesn't have one
}

export type Trigger = DateTime | Array<DateTime> | Repeat

export type Repeat = {
	every: Frequency // sets the starting point for the repeat "every year" or "every monday" or "every hour"
	steps?: number, // tells us whether to take more than 1 step, modifying the every to "every other year" or "every 3 thursdays" or "every 6 hours", default is 1
	snap?: DateTime, // when we use steps, we need to know which one to start on, it starts on the next valid instance of the every after this date "every 3 thursdays after the 28th of Steptember in 2024", default is defined differently for different frequency values
	with?: Array<Instruction> | Instruction // how to modify the date once we have our starting point based on the frequency
}

export type Frequency
	= "year" | "month" | "week" | "day" | "hour" | "minute" | "second" // regular segments
	| "millenium" | "century" | "decade" | "quarter" // larger segments
	| "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" // days of the week

export type Instruction
	= Duration // adds the duration
	| `snap ${Frequency}` // finds the previous instance of the frequency, but stays the same if it is currently on one
	| `next ${Frequency}` // finds the next instance of the frequency, even if it is on one currently

////////////////////////////////////////////////////////////////////////////////

function applyInstruction(date: DateTime, instruction: Instruction): DateTime {
	switch (instruction) {
	case "snap millenium": return date.startOf("year").set({year: Math.floor(date.year / 1000) * 1000})
	case "snap century": return date.startOf("year").set({year: Math.floor(date.year / 100) * 100})
	case "snap decade": return date.startOf("year").set({year: Math.floor(date.year / 10) * 10})
	case "snap year": return date.startOf("year")
	case "snap quarter": return date.startOf("month").set({month: Math.floor((date.month - 1) / 3) * 3 + 1})
	case "snap month": return date.startOf("month")
	case "snap week": return date.startOf("week")
	case "snap day": return date.startOf("day")
	case "snap hour": return date.startOf("hour")
	case "snap minute": return date.startOf("minute")
	case "snap second": return date.startOf("second")
	case "snap monday": return date.startOf("week")
	case "snap tuesday": return (date.weekday < 2 ? date.minus({weeks: 1}) : date).startOf("week").plus({days: 2})
	case "snap wednesday": return (date.weekday < 3 ? date.minus({weeks: 1}) : date).startOf("week").plus({days: 3})
	case "snap thursday": return (date.weekday < 4 ? date.minus({weeks: 1}) : date).startOf("week").plus({days: 4})
	case "snap friday": return (date.weekday < 5 ? date.minus({weeks: 1}) : date).startOf("week").plus({days: 5})
	case "snap saturday": return (date.weekday < 6 ? date.minus({weeks: 1}) : date).startOf("week").plus({days: 6})
	case "snap sunday": return (date.weekday < 7 ? date.minus({weeks: 1}) : date).startOf("week").plus({days: 7})
	case "next millenium": return date.startOf("year").plus({years: 1000 - Math.abs((date.year % 1000))})
	case "next century": return date.startOf("year").plus({years: 100 - Math.abs((date.year % 100))})
	case "next decade": return date.startOf("year").plus({years: 10 - Math.abs((date.year % 10))})
	case "next year": return date.startOf("year").plus({years: 1})
	case "next quarter": return date.startOf("month").plus({months: 3 - ((date.month - 1) % 3)})
	case "next month": return date.startOf("month").plus({months: 1})
	case "next week": return date.startOf("week").plus({weeks: 1})
	case "next day": return date.startOf("day").plus({days: 1})
	case "next hour": return date.startOf("hour").plus({hours: 1})
	case "next minute": return date.startOf("minute").plus({minutes: 1})
	case "next second": return date.startOf("second").plus({seconds: 1})
	case "next monday": return date.startOf("week").plus({weeks: 1})
	case "next tuesday": return date.startOf("day").plus({days: (2 - date.weekday + 7) % 7})
	case "next wednesday": return date.startOf("day").plus({days: (3 - date.weekday + 7) % 7})
	case "next thursday": return date.startOf("day").plus({days: (4 - date.weekday + 7) % 7})
	case "next friday": return date.startOf("day").plus({days: (5 - date.weekday + 7) % 7})
	case "next saturday": return date.startOf("day").plus({days: (6 - date.weekday + 7) % 7})
	case "next sunday": return date.startOf("day").plus({days: (7 - date.weekday + 7) % 7})
	default: return date.plus(instruction)
	}
}

function applyInstructions(date: DateTime, instructions: Array<Instruction>): DateTime {
	return instructions.reduce(applyInstruction, date)
}
