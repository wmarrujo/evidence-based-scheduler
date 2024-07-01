export function drawCircle(context: CanvasRenderingContext2D, x: number, y: number, radius: number, border?: boolean, borderWidth?: number) {
	context.save()
	context.beginPath()
	context.arc(x, y, radius, 0, 2 * Math.PI, false)
	context.fill()
	context.restore()
}

export function drawArrow(context: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, width: number, headAngle?: number, headLength?: number) {
	const angle = Math.atan2(toY - fromY, toX - fromX) // the angle of the arrow
	headAngle = headAngle ?? Math.PI/7
	headLength = headLength ?? width * 4
	
	context.save()
	
	// draw the line
	context.beginPath()
	context.moveTo(fromX, fromY)
	context.lineTo(toX, toY)
	context.lineWidth = width
	context.stroke()
	
	// triangle
	context.beginPath()
	context.moveTo(toX, toY)
	context.lineTo(toX-headLength * Math.cos(angle - Math.PI/7), toY-headLength * Math.sin(angle - Math.PI/7))
	context.lineTo(toX-headLength * Math.cos(angle + Math.PI/7), toY-headLength * Math.sin(angle + Math.PI/7))
	// context.lineTo(toX, toY)
	// context.lineTo(toX-headLength * Math.cos(angle - Math.PI/7), toY-headLength * Math.sin(angle - Math.PI/7))
	context.closePath()
	context.fill()
	context.stroke()
	
	context.restore()
}
