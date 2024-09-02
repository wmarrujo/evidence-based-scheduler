import type {DateTime, Duration} from "luxon"

////////////////////////////////////////////////////////////////////////////////

export type Schedule = Array<Rule>

export type Rule = {
	name?: string
	description?: string
	effect: "enabling" | "disabling"
} & ({
		zone: string // what time zone is this in? // must be a valid IANA zone
		trigger: Trigger // what individual dates start the effect
		duration: Duration // how long after the trigger it's effect is for (can use both date and time math) // FIXME: durations will also be calendar-specific :(
	} | {
		components: Array<Rule>
	}
)

export type Trigger = DateTime | Array<DateTime> | Repeat<Calendar>

export type Repeat<Calendar> = {
	calendar: Calendar
	every: SingularUnit<Calendar> | SpecialUnit<Calendar>
	instructions: Array<Instruction<Calendar>>
}

// static parse(s: string): Repeat<Calendar>

// getNext(after: DateTime): DateTime
// getPrevious(before: DateTime): DateTime

////////////////////////////////////////////////////////////////////////////////
// CALENDARS
////////////////////////////////////////////////////////////////////////////////

export type Calendar = "gregorian" //| "iso" | "4-4-5" | "julian" | "hebrew" | "minguo" | "japanese" | "lunar islamic" | "solar islamic" | "ethiopian" | "thai" | "indian" | "burmese" | "bengali" | "nepalese" ...

type SingularUnit<Calendar> =
	Calendar extends "gregorian" ? ("year" | "decade" | "century" | "millenium" | "month" | "quarter" | "day" | "week" | "second" | "minute" | "hour")
	// : Calendar extends "iso" ? ("year" | "decade" | "century" | "millenium" | "month" | "quarter" | "day" | "week" | "second" | "minute" | "hour")
	: never

type PluralUnit<Calendar> =
	Calendar extends "gregorian" ? ("years" | "decades" | "centuries" | "millenia" | "months" | "quarters" | "days" | "weeks" | "seconds" | "minutes" | "hours")
	// : Calendar extends "iso" ? ("years" | "decades" | "centuries" | "millenia" | "months" | "quarters" | "days" | "weeks" | "seconds" | "minutes" | "hours")
	: never

type SpecialUnit<Calendar> =
	Calendar extends "gregorian" ? ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" | "leap_day" | "easter")
	// : Calendar extends "iso" ? ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" | "leap_day")
	: never

type Instruction<Calendar>
	= `${"plus" | "minus"} ${number} ${SingularUnit<Calendar> | PluralUnit<Calendar>}`
	| `${"start_of" | "end_of"} ${SingularUnit<Calendar>}`
	| `${"next" | "previous"} ${SingularUnit<Calendar> | SpecialUnit<Calendar>}`
