<script lang="ts">
	import * as d3 from "d3"
	import {onMount} from "svelte"
	import {type Task} from "$lib/db"
	
	// SETUP
	
	let canvas: HTMLCanvasElement
	let context: CanvasRenderingContext2D
	
	let width: number
	let height: number
	
	function setCanvasDimensions() {
		canvas.width = canvas.clientWidth * window.devicePixelRatio
		canvas.height = canvas.clientHeight * window.devicePixelRatio
		width = canvas.clientWidth * window.devicePixelRatio
		height = canvas.clientHeight * window.devicePixelRatio
	}
	
	// DATA
	
	export let tasks: Array<Task> = []
	
	type Node = d3.SimulationNodeDatum
	
	const nodes = tasks.map(task => Object.assign({}, task) as Node) // make copies
	
	// SIMULATION
	
	let simulation: d3.Simulation<Node, never>
	
	function buildForceSimulation() {
		return d3.forceSimulation(nodes)
			.force("center", d3.forceCenter(width / 2 / window.devicePixelRatio, height / 2 / window.devicePixelRatio))
			.force("charge", d3.forceManyBody())
			.on("tick", updateSimulation)
	}
	
	function updateSimulation() {
		context.save()
		context.clearRect(0, 0, width, height)
		context.translate(transform.x * window.devicePixelRatio, transform.y * window.devicePixelRatio)
		context.scale(transform.k * window.devicePixelRatio, transform.k * window.devicePixelRatio)
		
		// draw nodes
		nodes.forEach((node) => {
			context.beginPath()
			context.arc(node.x!, node.y!, 10, 0, 2 * Math.PI, false)
			context.fillStyle = "white"
			context.fill()
		})
		
		context.restore()
	}
	
	// INTERACTION
	
	let transform = d3.zoomIdentity
	
	// Zoom
	
	function zoomed(event: d3.D3ZoomEvent<HTMLCanvasElement, Node>) {
		transform = event.transform
		updateSimulation()
	}
	
	// Drag
	
	type DragEvent = d3.D3DragEvent<HTMLCanvasElement, Node, Node>
	
	function dragSubject(event: DragEvent) {
		const [x, y] = transform.invert([event.x, event.y])
		const node = nodes.find(node => Math.sqrt((x - node.x!)**2 + (y - node.y!)**2) < 10)
		if (node) {
			node.x = transform.applyX(node.x!)
			node.y = transform.applyY(node.y!)
		}
		return node
	}
	
	function dragStarted(event: DragEvent) {
		if (!event.active) simulation.alphaTarget(0.3).restart() // run the simulation while dragging
		event.subject.fx = transform.invertX(event.x)
		event.subject.fy = transform.invertY(event.y)
	}
	
	function dragged(event: DragEvent) {
		event.subject.fx = transform.invertX(event.x)
		event.subject.fy = transform.invertY(event.y)
	}
	
	function dragEnded(event: DragEvent) {
		if (!event.active) simulation.alphaTarget(0) // set the simulation to decay again
		event.subject.fx = undefined
		event.subject.fy = undefined
	}
	
	// START
	
	onMount(() => {
		setCanvasDimensions()
		context = canvas.getContext("2d")!
		
		simulation = buildForceSimulation()
		
		d3.select(canvas)
			// @ts-ignore
			.call(d3.drag().container(canvas).subject(dragSubject).on("start", dragStarted).on("drag", dragged).on("end", dragEnded)) // NOTE: this must be before zoom, to take precedence
			// @ts-ignore
			.call(d3.zoom().on("zoom", zoomed))
	})
</script>

<canvas bind:this={canvas} class="w-full h-full" />
