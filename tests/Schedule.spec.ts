import {makeRule, makePeriodsOnDate, Schedule, getNextWorkDayFrom} from "@/Schedule"
import {DateTime} from "luxon"

describe("Schedule Rule Evaluation", () => {
	describe("Rule Evaluation", () => {
		const times = [{from: {hour: 9, minute: 0}, to: {hour: 17, minute: 0}}]
		
		test("include date rule", () => {
			const rule = makeRule("include from 09:00 to 17:00 on 2020-02-20")
			expect(rule(DateTime.fromISO("2020-02-19"))).toBeUndefined() // before
			expect(rule(DateTime.fromISO("2020-02-20"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-20"), times)) // during
			expect(rule(DateTime.fromISO("2020-02-21"))).toBeUndefined() // after
		})
		
		test("include from to rule", () => {
			const rule = makeRule("include from 09:00 to 17:00 from 2020-02-10 to 2020-02-20")
			expect(rule(DateTime.fromISO("2020-02-05"))).toBeUndefined() // before
			expect(rule(DateTime.fromISO("2020-02-10"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-10"), times)) // on leading edge
			expect(rule(DateTime.fromISO("2020-02-15"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-15"), times)) // during
			expect(rule(DateTime.fromISO("2020-02-20"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-20"), times)) // on trailing edge
			expect(rule(DateTime.fromISO("2020-02-25"))).toBeUndefined() // after
		})
		
		test("include from for repeat rule", () => {
			const rule = makeRule("include from 09:00 to 17:00 from 2020-02-10 for 5 days every 2 weeks")
			expect(rule(DateTime.fromISO("2020-02-05"))).toBeUndefined() // before date
			expect(rule(DateTime.fromISO("2020-02-12"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-12"), times)) // on first occurrance
			expect(rule(DateTime.fromISO("2020-02-19"))).toBeUndefined() // between occurrances
			expect(rule(DateTime.fromISO("2020-02-24"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-24"), times)) // on second occurrance leding edge
			expect(rule(DateTime.fromISO("2020-02-26"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-26"), times)) // on second occurrance
			expect(rule(DateTime.fromISO("2020-02-28"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-28"), times)) // on second occurrance trailing edge
			expect(rule(DateTime.fromISO("2020-03-04"))).toBeUndefined() // after second occurrance
		})
		
		test("include every rule", () => {
			const dayRule = makeRule("include from 09:00 to 17:00 every day")
			expect(dayRule(DateTime.fromISO("2020-02-10"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-10"), times)) // monday
			expect(dayRule(DateTime.fromISO("2020-02-11"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-11"), times)) // tuesday
			expect(dayRule(DateTime.fromISO("2020-02-12"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-12"), times)) // wednesday
			expect(dayRule(DateTime.fromISO("2020-02-13"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-13"), times)) // thursday
			expect(dayRule(DateTime.fromISO("2020-02-14"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-14"), times)) // friday
			expect(dayRule(DateTime.fromISO("2020-02-15"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-15"), times)) // saturday
			expect(dayRule(DateTime.fromISO("2020-02-16"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-16"), times)) // sunday
			
			const weekdayRule = makeRule("include from 09:00 to 17:00 every weekday")
			expect(weekdayRule(DateTime.fromISO("2020-02-10"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-10"), times)) // monday
			expect(weekdayRule(DateTime.fromISO("2020-02-11"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-11"), times)) // tuesday
			expect(weekdayRule(DateTime.fromISO("2020-02-12"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-12"), times)) // wednesday
			expect(weekdayRule(DateTime.fromISO("2020-02-13"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-13"), times)) // thursday
			expect(weekdayRule(DateTime.fromISO("2020-02-14"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-14"), times)) // friday
			expect(weekdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(weekdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const weekendRule = makeRule("include from 09:00 to 17:00 every weekend")
			expect(weekendRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(weekendRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(weekendRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(weekendRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(weekendRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(weekendRule(DateTime.fromISO("2020-02-15"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-15"), times)) // saturday
			expect(weekendRule(DateTime.fromISO("2020-02-16"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-16"), times)) // sunday
			
			const mondayRule = makeRule("include from 09:00 to 17:00 every monday")
			expect(mondayRule(DateTime.fromISO("2020-02-10"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-10"), times)) // monday
			expect(mondayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(mondayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(mondayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(mondayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(mondayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(mondayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const tuesdayRule = makeRule("include from 09:00 to 17:00 every tuesday")
			expect(tuesdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(tuesdayRule(DateTime.fromISO("2020-02-11"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-11"), times)) // tuesday
			expect(tuesdayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(tuesdayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(tuesdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(tuesdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(tuesdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const wednesdayRule = makeRule("include from 09:00 to 17:00 every wednesday")
			expect(wednesdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(wednesdayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(wednesdayRule(DateTime.fromISO("2020-02-12"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-12"), times)) // wednesday
			expect(wednesdayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(wednesdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(wednesdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(wednesdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const thursdayRule = makeRule("include from 09:00 to 17:00 every thursday")
			expect(thursdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(thursdayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(thursdayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(thursdayRule(DateTime.fromISO("2020-02-13"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-13"), times)) // thursday
			expect(thursdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(thursdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(thursdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const fridayRule = makeRule("include from 09:00 to 17:00 every friday")
			expect(fridayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(fridayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(fridayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(fridayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(fridayRule(DateTime.fromISO("2020-02-14"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-14"), times)) // friday
			expect(fridayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(fridayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const saturdayRule = makeRule("include from 09:00 to 17:00 every saturday")
			expect(saturdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(saturdayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(saturdayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(saturdayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(saturdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(saturdayRule(DateTime.fromISO("2020-02-15"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-15"), times)) // saturday
			expect(saturdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const sundayRule = makeRule("include from 09:00 to 17:00 every sunday")
			expect(sundayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(sundayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(sundayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(sundayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(sundayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(sundayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(sundayRule(DateTime.fromISO("2020-02-16"))).toEqual(makePeriodsOnDate(DateTime.fromISO("2020-02-16"), times)) // sunday
		})
		
		// EXCLUDE FORMS
		
		test("exclude date rule", () => {
			const rule = makeRule("exclude on 2020-02-20")
			expect(rule(DateTime.fromISO("2020-02-19"))).toBeUndefined() // before
			expect(rule(DateTime.fromISO("2020-02-20"))).toEqual([]) // during
			expect(rule(DateTime.fromISO("2020-02-21"))).toBeUndefined() // after
		})
		
		test("exclude from to rule", () => {
			const rule = makeRule("exclude from 2020-02-10 to 2020-02-20")
			expect(rule(DateTime.fromISO("2020-02-05"))).toBeUndefined() // before
			expect(rule(DateTime.fromISO("2020-02-10"))).toEqual([]) // on leading edge
			expect(rule(DateTime.fromISO("2020-02-15"))).toEqual([]) // during
			expect(rule(DateTime.fromISO("2020-02-20"))).toEqual([]) // on trailing edge
			expect(rule(DateTime.fromISO("2020-02-25"))).toBeUndefined() // after
		})
		
		test("exclude from for repeat rule", () => {
			const rule = makeRule("exclude from 2020-02-10 for 5 days every 2 weeks")
			expect(rule(DateTime.fromISO("2020-02-05"))).toBeUndefined() // before date
			expect(rule(DateTime.fromISO("2020-02-12"))).toEqual([]) // on first occurrance
			expect(rule(DateTime.fromISO("2020-02-19"))).toBeUndefined() // between occurrances
			expect(rule(DateTime.fromISO("2020-02-24"))).toEqual([]) // on second occurrance leding edge
			expect(rule(DateTime.fromISO("2020-02-26"))).toEqual([]) // on second occurrance
			expect(rule(DateTime.fromISO("2020-02-28"))).toEqual([]) // on second occurrance trailing edge
			expect(rule(DateTime.fromISO("2020-03-04"))).toBeUndefined() // after second occurrance
		})
		
		test("exclude every rule", () => {
			const dayRule = makeRule("exclude every day")
			expect(dayRule(DateTime.fromISO("2020-02-10"))).toEqual([]) // monday
			expect(dayRule(DateTime.fromISO("2020-02-11"))).toEqual([]) // tuesday
			expect(dayRule(DateTime.fromISO("2020-02-12"))).toEqual([]) // wednesday
			expect(dayRule(DateTime.fromISO("2020-02-13"))).toEqual([]) // thursday
			expect(dayRule(DateTime.fromISO("2020-02-14"))).toEqual([]) // friday
			expect(dayRule(DateTime.fromISO("2020-02-15"))).toEqual([]) // saturday
			expect(dayRule(DateTime.fromISO("2020-02-16"))).toEqual([]) // sunday
			
			const weekdayRule = makeRule("exclude every weekday")
			expect(weekdayRule(DateTime.fromISO("2020-02-10"))).toEqual([]) // monday
			expect(weekdayRule(DateTime.fromISO("2020-02-11"))).toEqual([]) // tuesday
			expect(weekdayRule(DateTime.fromISO("2020-02-12"))).toEqual([]) // wednesday
			expect(weekdayRule(DateTime.fromISO("2020-02-13"))).toEqual([]) // thursday
			expect(weekdayRule(DateTime.fromISO("2020-02-14"))).toEqual([]) // friday
			expect(weekdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(weekdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const weekendRule = makeRule("exclude every weekend")
			expect(weekendRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(weekendRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(weekendRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(weekendRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(weekendRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(weekendRule(DateTime.fromISO("2020-02-15"))).toEqual([]) // saturday
			expect(weekendRule(DateTime.fromISO("2020-02-16"))).toEqual([]) // sunday
			
			const mondayRule = makeRule("exclude every monday")
			expect(mondayRule(DateTime.fromISO("2020-02-10"))).toEqual([]) // monday
			expect(mondayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(mondayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(mondayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(mondayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(mondayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(mondayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const tuesdayRule = makeRule("exclude every tuesday")
			expect(tuesdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(tuesdayRule(DateTime.fromISO("2020-02-11"))).toEqual([]) // tuesday
			expect(tuesdayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(tuesdayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(tuesdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(tuesdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(tuesdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const wednesdayRule = makeRule("exclude every wednesday")
			expect(wednesdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(wednesdayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(wednesdayRule(DateTime.fromISO("2020-02-12"))).toEqual([]) // wednesday
			expect(wednesdayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(wednesdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(wednesdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(wednesdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const thursdayRule = makeRule("exclude every thursday")
			expect(thursdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(thursdayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(thursdayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(thursdayRule(DateTime.fromISO("2020-02-13"))).toEqual([]) // thursday
			expect(thursdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(thursdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(thursdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const fridayRule = makeRule("exclude every friday")
			expect(fridayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(fridayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(fridayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(fridayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(fridayRule(DateTime.fromISO("2020-02-14"))).toEqual([]) // friday
			expect(fridayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(fridayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const saturdayRule = makeRule("exclude every saturday")
			expect(saturdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(saturdayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(saturdayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(saturdayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(saturdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(saturdayRule(DateTime.fromISO("2020-02-15"))).toEqual([]) // saturday
			expect(saturdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const sundayRule = makeRule("exclude every sunday")
			expect(sundayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(sundayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(sundayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(sundayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(sundayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(sundayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(sundayRule(DateTime.fromISO("2020-02-16"))).toEqual([]) // sunday
		})
	})
})

describe("Schedule Evaluation", () => {
	const schedule = new Schedule(["include from 09:00 to 17:00 every monday"])
	
	test("Schedule Output", () => {
		const from = DateTime.fromISO("2020-03-25") // a wednesday
		const to = DateTime.fromISO("2020-04-08") // two wednesdays later
		
		const monday1 = DateTime.fromISO("2020-03-30") // the next monday after the from date
		const monday2 = DateTime.fromISO("2020-04-06") // the monday after that
		
		expect(schedule.periodsInRange(from, to)).toEqual([{begin: monday1.set({hour: 9}), end: monday1.set({hour: 17})}, {begin: monday2.set({hour: 9}), end: monday2.set({hour: 17})}])
	})
	
	test("Next begin date", () => {
		const monday = DateTime.fromISO("2020-03-30")
		const wednesday = DateTime.fromISO("2020-04-01")
		const nextMonday = DateTime.fromISO("2020-04-06")
		
		// if it is already in a period
		expect(schedule.getNextBeginFrom(monday.set({hour: 12})).hasSame(monday.set({hour: 12}), "minute")).toBeTruthy() // should just return the same thing
		
		// if it is on a day, but before a period
		expect(schedule.getNextBeginFrom(monday.set({hour: 5})).hasSame(monday.set({hour: 9}), "minute")).toBeTruthy() // should match that date on the beginning of the period
		
		// if it is on a day, but after a period
		expect(schedule.getNextBeginFrom(monday.set({hour: 19})).hasSame(nextMonday.set({hour: 9}), "minute")).toBeTruthy() // should match the next work day's first period
		
		// if it has to find the next day
		expect(schedule.getNextBeginFrom(wednesday).hasSame(nextMonday.set({hour: 9}), "minute")).toBeTruthy() // should match the next work day's first period
	})
	
	test("Next end date", () => {
		const monday = DateTime.fromISO("2020-03-30")
		const wednesday = DateTime.fromISO("2020-04-01")
		const nextMonday = DateTime.fromISO("2020-04-06")
		
		// if it is already in a period
		expect(schedule.getNextEndFrom(monday.set({hour: 12})).hasSame(monday.set({hour: 17}), "minute")).toBeTruthy() // should just return the end of that period
		
		// if it is on a day, but before a period
		expect(schedule.getNextEndFrom(monday.set({hour: 5})).hasSame(monday.set({hour: 17}), "minute")).toBeTruthy() // should match the end of the next period that day
		
		// if it is on a day, but after a period
		expect(schedule.getNextEndFrom(monday.set({hour: 19})).hasSame(nextMonday.set({hour: 17}), "minute")).toBeTruthy() // should match the next work day's first period end
		
		// if it has to find the next day
		expect(schedule.getNextEndFrom(wednesday).hasSame(nextMonday.set({hour: 17}), "minute")).toBeTruthy() // should match the next work day's first period end
	})
})