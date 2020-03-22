import {makeRule} from "@/Schedule"
import {ParseError, ValidationError} from "@/Error"
import {DateTime} from "luxon"

describe("Schedule Rule Making", () => {
	describe("Rule Forms", () => {
		// INCLUDE FORMS
		
		test("include NUMBER hours on DATE", () => {
			expect(() => makeRule("include 8 hours on 2020-02-10")).not.toThrow() // should be fine
			expect(() => makeRule("include 8 hours on 2019-02-29")).toThrow(ValidationError) // fail on date validation
			expect(() => makeRule("include hours 2020-02-10")).toThrow(ParseError) // needs a number
			expect(() => makeRule("include 8 2020-02-10")).toThrow(ParseError) // needs hours
			expect(() => makeRule("include 8 hours 2020-02-10")).toThrow(ParseError) // needs an on
			expect(() => makeRule("include 8 hours on")).toThrow(ParseError) // needs a date
		})
		
		test("include NUMBER hours from DATE to DATE", () => {
			expect(() => makeRule("include 8 hours from 2020-02-10 to 2020-02-20")).not.toThrow() // should be fine
			expect(() => makeRule("include 8 hours from 2019-02-29 to 2019-03-10")).toThrow(ValidationError) // fail on first date validation
			expect(() => makeRule("include 8 hours from 2019-02-20 to 2019-02-29")).toThrow(ValidationError) // fail on second date validation
			expect(() => makeRule("include hours from 2020-02-10 to 2020-02-20")).toThrow(ParseError) // needs a number
			expect(() => makeRule("include 8 from 2020-02-10 to 2020-02-20")).toThrow(ParseError) // needs hours
			expect(() => makeRule("include 8 hours 2020-02-10 to 2020-02-20")).toThrow(ParseError) // needs a from
			expect(() => makeRule("include 8 hours from to 2020-02-20")).toThrow(ParseError) // needs a from date
			expect(() => makeRule("include 8 hours from 2020-02-10 2020-02-20")).toThrow(ParseError) // needs a to
			expect(() => makeRule("include 8 hours from 2020-02-10 to")).toThrow(ParseError) // needs a to date
		})
		
		test("include NUMBER hours from DATE for NUMBER DURATION every NUMBER DURATION", () => {
			expect(() => makeRule("include 8 hours from 2020-02-20 for 5 days every 2 weeks")).not.toThrow() // should be fine
			expect(() => makeRule("include 8 hours from 2019-02-29 for 5 days every 2 weeks")).toThrow(ValidationError) // fail on first date validation
			expect(() => makeRule("include hours from 2020-02-20 for 5 days every 2 weeks")).toThrow(ParseError) // needs a number
			expect(() => makeRule("include 8 from 2020-02-20 for 5 days every 2 weeks")).toThrow(ParseError) // needs hours
			expect(() => makeRule("include 8 hours 2020-02-20 for 5 days every 2 weeks")).toThrow(ParseError) // needs a from
			expect(() => makeRule("include 8 hours from for 5 days every 2 weeks")).toThrow(ParseError) // needs a from date
			expect(() => makeRule("include 8 hours from 2020-02-20 5 days every 2 weeks")).toThrow(ParseError) // needs a for
			expect(() => makeRule("include 8 hours from 2020-02-20 for days every 2 weeks")).toThrow(ParseError) // needs a for number
			expect(() => makeRule("include 8 hours from 2020-02-20 for 5 every 2 weeks")).toThrow(ParseError) // needs a for unit
			expect(() => makeRule("include 8 hours from 2020-02-20 for 5 days 2 weeks")).toThrow(ParseError) // needs an every
			expect(() => makeRule("include 8 hours from 2020-02-20 for 5 days every weeks")).toThrow(ParseError) // needs an every number
			expect(() => makeRule("include 8 hours from 2020-02-20 for 5 days every 2")).toThrow(ParseError) // needs an every unit
		})
		
		test("include NUMBER hours every ORDINAL", () => {
			expect(() => makeRule("include 8 hours every tuesday")).not.toThrow() // should be fine
			expect(() => makeRule("include hours every tuesday")).toThrow(ParseError) // needs a number
			expect(() => makeRule("include 8 every tuesday")).toThrow(ParseError) // needs hours
			expect(() => makeRule("include 8 hours tuesday")).toThrow(ParseError) // needs an every
			expect(() => makeRule("include 8 hours every")).toThrow(ParseError) // needs an ordinal
		})
		
		// EXCLUDE FORMS
		
		test("exclude on DATE", () => {
			expect(() => makeRule("exclude on 2020-02-10")).not.toThrow() // should be fine
			expect(() => makeRule("exclude on 2019-02-29")).toThrow(ValidationError) // fail on date validation
			expect(() => makeRule("exclude 2020-02-10")).toThrow(ParseError) // needs an on
			expect(() => makeRule("exclude on")).toThrow(ParseError) // needs a date
		})
		
		test("exclude from DATE to DATE", () => {
			expect(() => makeRule("exclude from 2020-02-10 to 2020-02-20")).not.toThrow() // should be fine
			expect(() => makeRule("exclude from 2019-02-29 to 2019-03-10")).toThrow(ValidationError) // fail on first date validation
			expect(() => makeRule("exclude from 2019-02-20 to 2019-02-29")).toThrow(ValidationError) // fail on second date validation
			expect(() => makeRule("exclude 2020-02-10 to 2020-02-20")).toThrow(ParseError) // needs a from
			expect(() => makeRule("exclude from to 2020-02-20")).toThrow(ParseError) // needs a from date
			expect(() => makeRule("exclude from 2020-02-10 2020-02-20")).toThrow(ParseError) // needs a to
			expect(() => makeRule("exclude from 2020-02-10 to")).toThrow(ParseError) // needs a to date
		})
		
		test("exclude from DATE for NUMBER DURATION every NUMBER DURATION", () => {
			expect(() => makeRule("exclude from 2020-02-20 for 5 days every 2 weeks")).not.toThrow() // should be fine
			expect(() => makeRule("exclude from 2019-02-29 for 5 days every 2 weeks")).toThrow(ValidationError) // fail on first date validation
			expect(() => makeRule("exclude 2020-02-20 for 5 days every 2 weeks")).toThrow(ParseError) // needs a from
			expect(() => makeRule("exclude from for 5 days every 2 weeks")).toThrow(ParseError) // needs a from date
			expect(() => makeRule("exclude from 2020-02-20 5 days every 2 weeks")).toThrow(ParseError) // needs a for
			expect(() => makeRule("exclude from 2020-02-20 for days every 2 weeks")).toThrow(ParseError) // needs a for number
			expect(() => makeRule("exclude from 2020-02-20 for 5 every 2 weeks")).toThrow(ParseError) // needs a for unit
			expect(() => makeRule("exclude from 2020-02-20 for 5 days 2 weeks")).toThrow(ParseError) // needs an every
			expect(() => makeRule("exclude from 2020-02-20 for 5 days every weeks")).toThrow(ParseError) // needs an every number
			expect(() => makeRule("exclude from 2020-02-20 for 5 days every 2")).toThrow(ParseError) // needs an every unit
		})
		
		test("exclude every ORDINAL", () => {
			expect(() => makeRule("exclude every tuesday")).not.toThrow() // should be fine
			expect(() => makeRule("exclude tuesday")).toThrow(ParseError) // needs an every
			expect(() => makeRule("exclude every")).toThrow(ParseError) // needs an ordinal
		})
	})
	
	describe("Parser Allowances", () => {
		test("Case Insensitivity", () => {
			expect(() => makeRule("iNcLuDe 8 HoUrS eVeRy DaY")).not.toThrow() // should be fine
		})
		
		test("Floating-point numbers", () => {
			expect(() => makeRule("include 8.75 hours from 2020-02-20 for 5.6 days every 2.3 weeks")).not.toThrow() // should be fine
		})
	})
	
	describe("Rule Evaluation", () => {
		// INCLUDE FORMS
		
		test("include NUMBER hours on DATE", () => {
			const rule = makeRule("include 8 hours on 2020-02-20")
			expect(rule(DateTime.fromISO("2020-02-19"))).toBeUndefined() // before
			expect(rule(DateTime.fromISO("2020-02-20"))).toBe(8) // during
			expect(rule(DateTime.fromISO("2020-02-21"))).toBeUndefined() // after
		})
		
		test("include NUMBER hours from DATE to DATE", () => {
			const rule = makeRule("include 8 hours from 2020-02-10 to 2020-02-20")
			expect(rule(DateTime.fromISO("2020-02-05"))).toBeUndefined() // before
			expect(rule(DateTime.fromISO("2020-02-10"))).toBe(8) // on leading edge
			expect(rule(DateTime.fromISO("2020-02-15"))).toBe(8) // during
			expect(rule(DateTime.fromISO("2020-02-20"))).toBe(8) // on trailing edge
			expect(rule(DateTime.fromISO("2020-02-25"))).toBeUndefined() // after
		})
		
		test("include NUMBER hours from DATE for NUMBER DURATION every NUMBER DURATION", () => {
			const rule = makeRule("include 8 hours from 2020-02-10 for 5 days every 2 weeks")
			expect(rule(DateTime.fromISO("2020-02-05"))).toBeUndefined() // before date
			expect(rule(DateTime.fromISO("2020-02-12"))).toBe(8) // on first occurrance
			expect(rule(DateTime.fromISO("2020-02-19"))).toBeUndefined() // between occurrances
			expect(rule(DateTime.fromISO("2020-02-24"))).toBe(8) // on second occurrance leding edge
			expect(rule(DateTime.fromISO("2020-02-26"))).toBe(8) // on second occurrance
			expect(rule(DateTime.fromISO("2020-02-28"))).toBe(8) // on second occurrance trailing edge
			expect(rule(DateTime.fromISO("2020-03-04"))).toBeUndefined() // after second occurrance
		})
		
		test("include NUMBER hours every ORDINAL", () => {
			const dayRule = makeRule("include 8 hours every day")
			expect(dayRule(DateTime.fromISO("2020-02-10"))).toBe(8) // monday
			expect(dayRule(DateTime.fromISO("2020-02-11"))).toBe(8) // tuesday
			expect(dayRule(DateTime.fromISO("2020-02-12"))).toBe(8) // wednesday
			expect(dayRule(DateTime.fromISO("2020-02-13"))).toBe(8) // thursday
			expect(dayRule(DateTime.fromISO("2020-02-14"))).toBe(8) // friday
			expect(dayRule(DateTime.fromISO("2020-02-15"))).toBe(8) // saturday
			expect(dayRule(DateTime.fromISO("2020-02-16"))).toBe(8) // sunday
			
			const weekdayRule = makeRule("include 8 hours every weekday")
			expect(weekdayRule(DateTime.fromISO("2020-02-10"))).toBe(8) // monday
			expect(weekdayRule(DateTime.fromISO("2020-02-11"))).toBe(8) // tuesday
			expect(weekdayRule(DateTime.fromISO("2020-02-12"))).toBe(8) // wednesday
			expect(weekdayRule(DateTime.fromISO("2020-02-13"))).toBe(8) // thursday
			expect(weekdayRule(DateTime.fromISO("2020-02-14"))).toBe(8) // friday
			expect(weekdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(weekdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const weekendRule = makeRule("include 8 hours every weekend")
			expect(weekendRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(weekendRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(weekendRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(weekendRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(weekendRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(weekendRule(DateTime.fromISO("2020-02-15"))).toBe(8) // saturday
			expect(weekendRule(DateTime.fromISO("2020-02-16"))).toBe(8) // sunday
			
			const mondayRule = makeRule("include 8 hours every monday")
			expect(mondayRule(DateTime.fromISO("2020-02-10"))).toBe(8) // monday
			expect(mondayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(mondayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(mondayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(mondayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(mondayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(mondayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const tuesdayRule = makeRule("include 8 hours every tuesday")
			expect(tuesdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(tuesdayRule(DateTime.fromISO("2020-02-11"))).toBe(8) // tuesday
			expect(tuesdayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(tuesdayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(tuesdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(tuesdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(tuesdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const wednesdayRule = makeRule("include 8 hours every wednesday")
			expect(wednesdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(wednesdayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(wednesdayRule(DateTime.fromISO("2020-02-12"))).toBe(8) // wednesday
			expect(wednesdayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(wednesdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(wednesdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(wednesdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const thursdayRule = makeRule("include 8 hours every thursday")
			expect(thursdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(thursdayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(thursdayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(thursdayRule(DateTime.fromISO("2020-02-13"))).toBe(8) // thursday
			expect(thursdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(thursdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(thursdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const fridayRule = makeRule("include 8 hours every friday")
			expect(fridayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(fridayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(fridayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(fridayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(fridayRule(DateTime.fromISO("2020-02-14"))).toBe(8) // friday
			expect(fridayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(fridayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const saturdayRule = makeRule("include 8 hours every saturday")
			expect(saturdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(saturdayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(saturdayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(saturdayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(saturdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(saturdayRule(DateTime.fromISO("2020-02-15"))).toBe(8) // saturday
			expect(saturdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const sundayRule = makeRule("include 8 hours every sunday")
			expect(sundayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(sundayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(sundayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(sundayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(sundayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(sundayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(sundayRule(DateTime.fromISO("2020-02-16"))).toBe(8) // sunday
		})
		
		// EXCLUDE FORMS
		
		test("exclude on DATE", () => {
			const rule = makeRule("exclude on 2020-02-20")
			expect(rule(DateTime.fromISO("2020-02-19"))).toBeUndefined() // before
			expect(rule(DateTime.fromISO("2020-02-20"))).toBe(0) // during
			expect(rule(DateTime.fromISO("2020-02-21"))).toBeUndefined() // after
		})
		
		test("exclude from DATE to DATE", () => {
			const rule = makeRule("exclude from 2020-02-10 to 2020-02-20")
			expect(rule(DateTime.fromISO("2020-02-05"))).toBeUndefined() // before
			expect(rule(DateTime.fromISO("2020-02-10"))).toBe(0) // on leading edge
			expect(rule(DateTime.fromISO("2020-02-15"))).toBe(0) // during
			expect(rule(DateTime.fromISO("2020-02-20"))).toBe(0) // on trailing edge
			expect(rule(DateTime.fromISO("2020-02-25"))).toBeUndefined() // after
		})
		
		test("exclude from DATE for NUMBER DURATION every NUMBER DURATION", () => {
			const rule = makeRule("exclude from 2020-02-10 for 5 days every 2 weeks")
			expect(rule(DateTime.fromISO("2020-02-05"))).toBeUndefined() // before date
			expect(rule(DateTime.fromISO("2020-02-12"))).toBe(0) // on first occurrance
			expect(rule(DateTime.fromISO("2020-02-19"))).toBeUndefined() // between occurrances
			expect(rule(DateTime.fromISO("2020-02-24"))).toBe(0) // on second occurrance leding edge
			expect(rule(DateTime.fromISO("2020-02-26"))).toBe(0) // on second occurrance
			expect(rule(DateTime.fromISO("2020-02-28"))).toBe(0) // on second occurrance trailing edge
			expect(rule(DateTime.fromISO("2020-03-04"))).toBeUndefined() // after second occurrance
		})
		
		test("exclude every ORDINAL", () => {
			const dayRule = makeRule("exclude every day")
			expect(dayRule(DateTime.fromISO("2020-02-10"))).toBe(0) // monday
			expect(dayRule(DateTime.fromISO("2020-02-11"))).toBe(0) // tuesday
			expect(dayRule(DateTime.fromISO("2020-02-12"))).toBe(0) // wednesday
			expect(dayRule(DateTime.fromISO("2020-02-13"))).toBe(0) // thursday
			expect(dayRule(DateTime.fromISO("2020-02-14"))).toBe(0) // friday
			expect(dayRule(DateTime.fromISO("2020-02-15"))).toBe(0) // saturday
			expect(dayRule(DateTime.fromISO("2020-02-16"))).toBe(0) // sunday
			
			const weekdayRule = makeRule("exclude every weekday")
			expect(weekdayRule(DateTime.fromISO("2020-02-10"))).toBe(0) // monday
			expect(weekdayRule(DateTime.fromISO("2020-02-11"))).toBe(0) // tuesday
			expect(weekdayRule(DateTime.fromISO("2020-02-12"))).toBe(0) // wednesday
			expect(weekdayRule(DateTime.fromISO("2020-02-13"))).toBe(0) // thursday
			expect(weekdayRule(DateTime.fromISO("2020-02-14"))).toBe(0) // friday
			expect(weekdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(weekdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const weekendRule = makeRule("exclude every weekend")
			expect(weekendRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(weekendRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(weekendRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(weekendRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(weekendRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(weekendRule(DateTime.fromISO("2020-02-15"))).toBe(0) // saturday
			expect(weekendRule(DateTime.fromISO("2020-02-16"))).toBe(0) // sunday
			
			const mondayRule = makeRule("exclude every monday")
			expect(mondayRule(DateTime.fromISO("2020-02-10"))).toBe(0) // monday
			expect(mondayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(mondayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(mondayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(mondayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(mondayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(mondayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const tuesdayRule = makeRule("exclude every tuesday")
			expect(tuesdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(tuesdayRule(DateTime.fromISO("2020-02-11"))).toBe(0) // tuesday
			expect(tuesdayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(tuesdayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(tuesdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(tuesdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(tuesdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const wednesdayRule = makeRule("exclude every wednesday")
			expect(wednesdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(wednesdayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(wednesdayRule(DateTime.fromISO("2020-02-12"))).toBe(0) // wednesday
			expect(wednesdayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(wednesdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(wednesdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(wednesdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const thursdayRule = makeRule("exclude every thursday")
			expect(thursdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(thursdayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(thursdayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(thursdayRule(DateTime.fromISO("2020-02-13"))).toBe(0) // thursday
			expect(thursdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(thursdayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(thursdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const fridayRule = makeRule("exclude every friday")
			expect(fridayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(fridayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(fridayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(fridayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(fridayRule(DateTime.fromISO("2020-02-14"))).toBe(0) // friday
			expect(fridayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(fridayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const saturdayRule = makeRule("exclude every saturday")
			expect(saturdayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(saturdayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(saturdayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(saturdayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(saturdayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(saturdayRule(DateTime.fromISO("2020-02-15"))).toBe(0) // saturday
			expect(saturdayRule(DateTime.fromISO("2020-02-16"))).toBeUndefined() // sunday
			
			const sundayRule = makeRule("exclude every sunday")
			expect(sundayRule(DateTime.fromISO("2020-02-10"))).toBeUndefined() // monday
			expect(sundayRule(DateTime.fromISO("2020-02-11"))).toBeUndefined() // tuesday
			expect(sundayRule(DateTime.fromISO("2020-02-12"))).toBeUndefined() // wednesday
			expect(sundayRule(DateTime.fromISO("2020-02-13"))).toBeUndefined() // thursday
			expect(sundayRule(DateTime.fromISO("2020-02-14"))).toBeUndefined() // friday
			expect(sundayRule(DateTime.fromISO("2020-02-15"))).toBeUndefined() // saturday
			expect(sundayRule(DateTime.fromISO("2020-02-16"))).toBe(0) // sunday
		})
	})
})

// describe("Schedule Structure", () => {
// 
// })