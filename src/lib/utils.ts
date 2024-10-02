import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import {cubicOut} from "svelte/easing"
import type {TransitionConfig} from "svelte/transition"

////////////////////////////////////////////////////////////////////////////////

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

type FlyAndScaleParams = {
	y?: number
	x?: number
	start?: number
	duration?: number
}

export const flyAndScale = (
	node: Element,
	params: FlyAndScaleParams = {y: -8, x: 0, start: 0.95, duration: 150},
): TransitionConfig => {
	const style = getComputedStyle(node)
	const transform = style.transform === "none" ? "" : style.transform
	
	const scaleConversion = (
		valueA: number,
		scaleA: [number, number],
		scaleB: [number, number],
	) => {
		const [minA, maxA] = scaleA
		const [minB, maxB] = scaleB
		
		const percentage = (valueA - minA) / (maxA - minA)
		const valueB = percentage * (maxB - minB) + minB
		
		return valueB
	}
	
	const styleToString = (
		style: Record<string, number | string | undefined>,
	): string => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str
			return str + `${key}:${style[key]};`
		}, "")
	}
	
	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0])
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0])
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1])
			
			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t,
			})
		},
		easing: cubicOut,
	}
}

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
