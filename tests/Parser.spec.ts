import {parseRule, spacing, num, time, date, times} from "@/Schedule"

describe("Schedule Rule Parser Combinators", () => {
	test("spacing parser", () => {
		expect(spacing.run(" ").isError).toBeFalsy()
		expect(spacing.run("     ").isError).toBeFalsy()
		expect(spacing.run("\n").isError).toBeFalsy()
	})
	
	test("number parser", () => {
		expect(num.run("1").result).toBe(1)
		expect(num.run("1.2").result).toBe(1.2)
		expect(num.run("1123.12").result).toBe(1123.12)
	})
	
	test("time parser", () => {
		expect(time.run("09:20").result).toEqual({hour: 9, minute: 20})
		expect(time.run("20:06").result).toEqual({hour: 20, minute: 6})
	})
	
	test("date parser", () => {
		expect(date.run("2020-02-02").result).toBe("2020-02-02")
	})
	
	test("times parser", () => {
		expect(times.run("from 09:00 to 17:00").result).toEqual({from: {hour: 9, minute: 0}, to: {hour: 17, minute: 0}})
	})
})

describe("Rule Parsing", () => {
	
	test("include date rule", () => {
		expect(parseRule("include from 09:00 to 17:00 on 2020-03-25")).toEqual({times: [{from: {hour: 9, minute: 0}, to: {hour: 17, minute: 0}}], on: "2020-03-25"})
	})
	
	test("include from to rule", () => {
		expect(parseRule("include from 09:00 to 17:00 from 2020-03-25 to 2020-04-11")).toEqual({times: [{from: {hour: 9, minute: 0}, to: {hour: 17, minute: 0}}], from: "2020-03-25", to: "2020-04-11"})
	})
	
	test("include from for repeat rule", () => {
		expect(parseRule("include from 09:00 to 17:00 from 2020-03-25 for 5 days every 2 weeks")).toEqual({times: [{from: {hour: 9, minute: 0}, to: {hour: 17, minute: 0}}], from: "2020-03-25", forValue: 5, forUnit: "days", repeatValue: 2, repeatUnit: "weeks"})
	})
	
	test("include every rule", () => {
		expect(parseRule("include from 09:00 to 17:00 every tuesday")).toEqual({times: [{from: {hour: 9, minute: 0}, to: {hour: 17, minute: 0}}], every: "tuesday"})
	})
	
	test("exclude date rule", () => {
		expect(parseRule("exclude on 2020-03-25")).toEqual({on: "2020-03-25"})
	})
	
	test("exclude from to rule", () => {
		expect(parseRule("exclude from 2020-03-25 to 2020-04-11")).toEqual({from: "2020-03-25", to: "2020-04-11"})
	})
	
	test("exclude from for repeat rule", () => {
		expect(parseRule("exclude from 2020-03-25 for 5 days every 2 weeks")).toEqual({from: "2020-03-25", forValue: 5, forUnit: "days", repeatValue: 2, repeatUnit: "weeks"})
	})
	
	test("exclude every rule", () => {
		expect(parseRule("exclude every tuesday")).toEqual({every: "tuesday"})
	})
})

describe("Parser Allowances", () => {
	test("Case Insensitivity", () => {
		expect(() => parseRule("iNcLuDe FrOm 09:00 To 17:00 eVeRy DaY")).not.toThrow() // should be fine
	})
	
	test("Floating-point numbers", () => {
		expect(() => parseRule("include from 09:00 to 17:00 from 2020-02-20 for 5.6 days every 2.3 weeks")).not.toThrow() // should be fine
	})
})