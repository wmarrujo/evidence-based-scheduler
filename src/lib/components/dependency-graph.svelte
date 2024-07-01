<script lang="ts">
	import * as d3 from "d3"
	import {onMount} from "svelte"
	import {type Task} from "$lib/db"
	import {mode} from "mode-watcher"
	
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
	
	type Node = d3.SimulationNodeDatum & {
		id: number
		name: string
		r: number // radius
	}
	type Link = d3.SimulationLinkDatum<Node>
	
	const nodes: Array<Node> = tasks.map(task => ({id: task.id, name: task.name, r: 10})) // make copies // TODO: set the radius based on the size
	const links: Array<Link> = tasks.flatMap(task => task.dependsOn.map(d => ({source: d, target: task.id})))
	
	const nodesById = nodes.reduce((acc, node) => { acc[node.id] = node; return acc }, {} as Record<number, Node>)
	
	function makeLink(source: Node | number, target: Node | number) {
		const s = typeof(source) == "number" ? nodesById[source] : source
		const t = typeof(target) == "number" ? nodesById[target] : target
		
		if (s == t) return // can't make a link with yourself
		// TODO: make sure we didn't add a loop
		
		// TODO: add this information to the database
		
		// add the link to the list of links
		simulation.stop()
		
		links.push({source: s.id, target: t.id})
		
		reInitializeSimulation()
		simulation.restart()
	}
	
	// SIMULATION
	
	let simulation: d3.Simulation<Node, never>
	
	function buildForceSimulation() {
		return d3.forceSimulation(nodes)
			.force("link", d3.forceLink(links).id(node => (node as Node).id).strength(0))
			.force("charge", d3.forceManyBody())
			.on("tick", updateSimulation)
	}
	
	function reInitializeSimulation() {
		simulation.force("link")!.initialize!(nodes, () => 0) // re-initialize forces
		simulation.force("charge")!.initialize!(nodes, () => 0) // re-initialize forces
	}
	
	function updateSimulation() {
		context.save()
		context.clearRect(0, 0, width, height)
		context.translate(transform.x * window.devicePixelRatio, transform.y * window.devicePixelRatio)
		context.scale(transform.k * window.devicePixelRatio, transform.k * window.devicePixelRatio)
		
		// draw nodes
		if (selected) drawConnector(selected)
		links.forEach(drawLink)
		nodes.forEach(drawNode)
		
		context.restore()
	}
	
	function drawNode(node: Node) {
		context.fillStyle = $mode == "light" ? "black" : "white"
		
		context.beginPath()
		context.arc(node.x!, node.y!, node.r, 0, 2 * Math.PI, false)
		context.fill()
	}
	
	function drawLink(link: Link) {
		const source = link.source as Node
		const target = link.target as Node
		
		context.strokeStyle = $mode == "light" ? "black" : "white"
		context.lineWidth = 2
		
		context.beginPath()
		context.moveTo(source.x!, source.y!)
		context.lineTo(target.x!, target.y!)
		context.stroke()
	}
	
	function drawConnector(source: Node) {
		context.strokeStyle = $mode == "light" ? "black" : "white"
		context.lineWidth = 2
		
		context.beginPath()
		context.moveTo(source.x!, source.y!)
		context.lineTo(mouse.x, mouse.y)
		context.stroke()
	}
	
	// INTERACTION
	
	let transform = d3.zoomIdentity
	
	function getNode(event: Event | DragEvent): Node | undefined {
		const [x, y] = transform.invert(d3.pointer(event))
		return nodes.find(node => Math.sqrt((x - node.x!)**2 + (y - node.y!)**2) < node.r)
	}
	
	// Zoom
	
	type ZoomEvent = d3.D3ZoomEvent<HTMLCanvasElement, Node>
	
	function zoomed(event: ZoomEvent) {
		transform = event.transform.translate(width / 2 / window.devicePixelRatio, height / 2 / window.devicePixelRatio)
		updateSimulation()
	}
	
	// Drag
	
	type DragEvent = d3.D3DragEvent<HTMLCanvasElement, Node, Node>
	
	function getDragSubject(event: DragEvent) {
		const node = getNode(event)
		if (node) {
			node.x = transform.applyX(node.x!)
			node.y = transform.applyY(node.y!)
		}
		return node
	}
	
	function onDragStarted(event: DragEvent) {
		if (!event.active) simulation.alphaTarget(0.3).restart() // run the simulation while dragging
		event.subject.fx = transform.invertX(event.x)
		event.subject.fy = transform.invertY(event.y)
	}
	
	function onDrag(event: DragEvent) {
		event.subject.fx = transform.invertX(event.x)
		event.subject.fy = transform.invertY(event.y)
	}
	
	function onDragEnded(event: DragEvent) {
		if (!event.active) simulation.alphaTarget(0) // set the simulation to decay again
		event.subject.fx = undefined
		event.subject.fy = undefined
	}
	
	// hover
	
	let mouse: {x: number, y: number} = {x: 0, y: 0}
	let hovered: Node | undefined
	
	function onMouseMove(event: MouseEvent) {
		let [x, y] = transform.invert(d3.pointer(event))
		mouse.x = x; mouse.y = y
		hovered = getNode(event)
	}
	
	// click
	
	let selected: Node | undefined
	
	function onClick(event: MouseEvent) {
		if (!selected) { // if no node is selected yet
			selected = getNode(event)
		} else { // if a node is already selected
			const target = getNode(event)
			if (target) { // if we clicked on a node receiving
				makeLink(selected, target)
			} // if there is no target, drop it
			selected = undefined // reset selection
		}
	}
	
	function onDoubleClick(event: MouseEvent) {
		const node = getNode(event)
		console.log("DOUBLE CLICK", node)
	}
	
	// START
	
	onMount(() => {
		setCanvasDimensions()
		context = canvas.getContext("2d")!
		
		transform = transform.translate(width / 2 / window.devicePixelRatio, height / 2 / window.devicePixelRatio)
		
		simulation = buildForceSimulation()
		
		d3.select(canvas)
			// @ts-ignore
			.call(d3.drag().container(canvas).subject(getDragSubject).on("start", onDragStarted).on("drag", onDrag).on("end", onDragEnded)) // NOTE: this must be before zoom, to take precedence
			// @ts-ignore
			.call(d3.zoom().on("zoom", zoomed))
			.on("dblclick.zoom", null) // disable default double click to zoom
			.on("mousemove", onMouseMove)
			.on("click", onClick)
			.on("dblclick", onDoubleClick)
			// .on("click", (event) => { clearTimeout(clickTimeout); clickTimeout = setTimeout(() => onClick(event), 200) as unknown as number })
			// .on("dblclick", (event) => { clearTimeout(clickTimeout); onDoubleClick(event) })
	})
</script>

<canvas bind:this={canvas} class="w-full h-full" />
