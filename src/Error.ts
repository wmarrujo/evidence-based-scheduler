////////////////////////////////////////////////////////////////////////////////
// VALIDATION ERROR
////////////////////////////////////////////////////////////////////////////////

export class ValidationError extends Error {
	location: Location
	cause: string
	
	constructor(cause: string, description: string, index?: string | number, location: Location = []) {
		super([cause, ...location.slice().reverse().map(l => displayLocation(l.description, l.index))].join("\n"))
		this.name = "ValidationError"
		this.cause = cause
		this.location = location.slice() // copy the old location
		this.location.unshift({description: description, index: index}) // push the new location to the top of the stack
	}
}

// STACK TRACING

type Location = Array<{
	description: string,
	index: string | number | undefined
}>

function displayLocation(description: string, index: string | number | undefined): string {
	if (index) {
		return `in: ${description} @ ${index}`
	} else {
		return `in: ${description}`
	}
}

export function rethrowValidationError(error: ValidationError, description: string, index: string | number | undefined): never {
	throw new ValidationError(error.cause, description, index, error.location)
}