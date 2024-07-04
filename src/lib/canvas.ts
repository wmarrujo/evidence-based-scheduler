export function drawCircle(context: CanvasRenderingContext2D, x: number, y: number, radius: number, options?: {border?: boolean, borderWidth?: number}) {
	context.save()
	
	context.beginPath()
	context.arc(x, y, radius, 0, 2 * Math.PI, false)
	context.fill()
	if (options?.border) {
		context.lineWidth = options?.borderWidth ?? 1
		context.stroke()
	}
	
	context.restore()
}

export function drawArrow(context: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, options?: {width?: number, headAngle?: number, headLength?: number, startOffset?: number, endOffset?: number}) {
	const angle = Math.atan2(toY - fromY, toX - fromX) // the angle of the arrow
	const width = options?.width ?? 1
	const headAngle = options?.headAngle ?? Math.PI/7
	const headLength = options?.headLength ?? width * 4
	const startOffset = options?.startOffset ?? 0
	const endOffset = options?.endOffset ?? 0
	
	const start = {x: fromX + startOffset * Math.cos(angle), y: fromY + startOffset * Math.sin(angle)}
	const end = {x: toX - endOffset * Math.cos(angle), y: toY - endOffset * Math.sin(angle)}
	
	context.save()
	
	// draw the line
	context.beginPath()
	context.moveTo(start.x, start.y)
	context.lineTo(end.x, end.y)
	context.lineWidth = width
	context.stroke()
	
	// triangle
	context.beginPath()
	context.moveTo(end.x, end.y)
	context.lineTo(end.x - headLength * Math.cos(angle - headAngle), end.y - headLength * Math.sin(angle - headAngle))
	context.lineTo(end.x - headLength * Math.cos(angle + headAngle), end.y - headLength * Math.sin(angle + headAngle))
	context.closePath()
	context.fill()
	context.stroke()
	
	context.restore()
}

export function drawRectangle(context: CanvasRenderingContext2D, minX: number, minY: number, maxX: number, maxY: number, options?: {border?: boolean, borderWidth?: number, offset?: number}) {
	const offset = options?.offset ?? 0
	
	const x = minX - offset
	const y = minY - offset
	const width = maxX - minX + offset * 2
	const height = maxY - minY + offset * 2
	
	context.save()
	
	context.fillRect(x, y, width, height)
	context.lineWidth = options?.borderWidth ?? 1
	if (options?.border) context.strokeRect(x, y, width, height)
	
	context.restore()
}

// TODO: maybe draw convex hulls? https://youtu.be/SBdWdT_5isI?si=9UdAmJt7LaCsvIlb
