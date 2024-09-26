// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.

repeat = "every" _ unit
unit = "millenium" / "century" / "decade" / "year" / "quarter" / "month" / "week" / "day" / "hour" / "minute" / "second" / day_of_week / special
day_of_week = "monday" / "tuesday" / "wednesday" / "thursday" / "friday" / "saturday" / "sunday"
month = "january" / "february" / "march" / "april" / "may" / "june" / "july" / "august" / "september" / "october" / "november" / "december"
special = "easter" / "weekday" / "leap day" / "leap year"
_ "whitespace" = [ \t\n\r]+

// Expression
// 	= head:Term tail:(Whitespace ("+" / "-") Whitespace Term)* {
// 	return tail.reduce(function(result, element) {
// 		if (element[1] === "+") { return result + element[3]; }
// 		if (element[1] === "-") { return result - element[3]; }
// 	}, head);
// 	}

// Term
// 	= head:Factor tail:(Whitespace ("*" / "/") Whitespace Factor)* {
// 	return tail.reduce(function(result, element) {
// 	if (element[1] === "*") { return result * element[3]; }
// 	if (element[1] === "/") { return result / element[3]; }
// 	}, head);
// 	}

// Factor
// 	= "(" Whitespace expr:Expression Whitespace ")" { return expr; }
// 	/ Integer

// Integer "integer"
// 	= Whitespace [0-9]+ { return parseInt(text(), 10); }
