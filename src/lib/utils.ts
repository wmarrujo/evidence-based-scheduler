import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

////////////////////////////////////////////////////////////////////////////////
// TYPE EXTENSIONS
////////////////////////////////////////////////////////////////////////////////

export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never

////////////////////////////////////////////////////////////////////////////////
// EXTENSIONS
////////////////////////////////////////////////////////////////////////////////

declare global {
	interface Array<T> {
		intersects(other: Array<T>): boolean
		max(): T
		min(): T
	}
}

Array.prototype.intersects = function<T>(other: Array<T>): boolean {
	return this.some(item => other.includes(item))
}

Array.prototype.max = function() {
	return Math.max.apply(null, this)
}

Array.prototype.min = function() {
	return Math.min.apply(null, this)
}

////////////////////////////////////////////////////////////////////////////////

export function transpose<T>(matrix: Array<Array<T>>): Array<Array<T>> {
	return (matrix[0] ?? []).map((col, i) => matrix.map(row => row[i]))
}

export function JSONSafeParse(item: string | null | undefined): any | undefined { // eslint-disable-line @typescript-eslint/no-explicit-any
	if (item) {
		try { return JSON.parse(item) }
		catch { return undefined }
	} else {
		return undefined
	}
}

export function JSONSafeParseToArray(item: string | null | undefined): Array<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
	const parsed = JSONSafeParse(item)
	if (Array.isArray(parsed)) return parsed
	else return []
}
