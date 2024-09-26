export function drawCircle(context: CanvasRenderingContext2D, x: number, y: number, radius: number, options?: {color?: string, opacity?: number, border?: boolean, borderWidth?: number, borderColor?: string}) {
	// read arguments
	const color = options?.color ?? "black"
	const borderWidth = options?.borderWidth ?? 1
	const borderColor = options?.borderColor ?? color
	const opacity = options?.opacity ?? 1
	
	// DRAW
	
	context.save()
	
	// set style
	context.globalAlpha = opacity
	context.lineWidth = borderWidth
	context.fillStyle = color
	context.strokeStyle = borderColor
	
	// draw the circle
	context.beginPath()
	context.arc(x, y, radius, 0, 2*Math.PI, false)
	context.fill()
	
	// draw the outline
	if (options?.border) context.stroke()
	
	context.restore()
}

export function drawArrow(context: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, options?: {width?: number, headAngle?: number, headLength?: number, color?: string, opacity?: number, headColor?: string, startOffset?: number, endOffset?: number}) {
	// read arguments
	const angle = Math.atan2(toY - fromY, toX - fromX) // the angle of the arrow
	const width = options?.width ?? 1
	const headAngle = options?.headAngle ?? Math.PI/7
	const headLength = options?.headLength ?? width * 4
	const startOffset = options?.startOffset ?? 0
	const endOffset = options?.endOffset ?? 0
	const color = options?.color ?? "black"
	const headColor = options?.headColor ?? color
	const opacity = options?.opacity ?? 1
	
	// calculate
	const start = {x: fromX + startOffset * Math.cos(angle), y: fromY + startOffset * Math.sin(angle)}
	const end = {x: toX - endOffset * Math.cos(angle), y: toY - endOffset * Math.sin(angle)}
	
	// DRAW
	
	context.save()
	
	// set style
	context.globalAlpha = opacity
	context.lineWidth = width
	context.strokeStyle = color
	context.fillStyle = headColor
	
	// draw the line
	context.beginPath()
	context.moveTo(start.x, start.y)
	context.lineTo(end.x, end.y)
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

export function drawLine(context: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, options?: {width?: number, color?: string, opacity?: number}) {
	// read arguments
	const width = options?.width ?? 1
	const color = options?.color ?? "black"
	const opacity = options?.opacity ?? 1
	
	// DRAW
	
	context.save()
	
	// set style
	context.globalAlpha = opacity
	context.lineWidth = width
	context.strokeStyle = color
	
	// draw the line
	context.beginPath()
	context.moveTo(fromX, fromY)
	context.lineTo(toX, toY)
	context.stroke()
	
	context.restore()
}

export function drawRectangle(context: CanvasRenderingContext2D, minX: number, minY: number, maxX: number, maxY: number, options?: {border?: boolean, borderWidth?: number, color?: string, opacity?: number, borderColor?: string, offset?: number}) {
	// read arguments
	const offset = options?.offset ?? 0
	const color = options?.color ?? "black"
	const borderColor = options?.borderColor ?? color
	const opacity = options?.opacity ?? 1
	
	// calculate
	const x = minX - offset
	const y = minY - offset
	const width = maxX - minX + offset * 2
	const height = maxY - minY + offset * 2
	
	// DRAW
	
	context.save()
	
	// set style
	context.globalAlpha = opacity
	context.lineWidth = width
	context.fillStyle = color
	context.strokeStyle = borderColor
	
	// draw rect
	context.fillRect(x, y, width, height)
	
	// draw border
	context.lineWidth = options?.borderWidth ?? 1
	
	// draw outline
	if (options?.border) context.strokeRect(x, y, width, height)
	
	context.restore()
}

// TODO: maybe draw convex hulls? https://youtu.be/SBdWdT_5isI?si=9UdAmJt7LaCsvIlb
