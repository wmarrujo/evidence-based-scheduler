<script lang="ts">
	import * as d3 from "d3"
	import {onMount} from "svelte"
	import {db, type Task, type TaskId} from "$lib/db"
	import {mode} from "mode-watcher"
	import {drawCircle, drawArrow} from "$lib/canvas"
	
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
	
	async function makeLink(source: Node | number, target: Node | number) {
		const s = typeof(source) == "number" ? nodesById[source] : source
		const t = typeof(target) == "number" ? nodesById[target] : target
		
		if (await makesLoop(s.id, t.id)) { console.error("Makes loop"); return} // can't make loops
		
		// add this information to the database
		const task = (await db.tasks.get(t.id))!
		task.dependsOn.push(s.id)
		db.tasks.update(t.id, {dependsOn: task.dependsOn})
		
		// add the link to the list of links
		simulation.stop()
		links.push({source: s.id, target: t.id})
		reInitializeSimulation()
		simulation.restart()
	}
	
	/** Returns true if the arrow from the source to the target would make a loop. */
	async function makesLoop(source: TaskId, target: TaskId): Promise<boolean> {
		const backLinks = (await db.tasks.get(source))?.dependsOn ?? []
		return source == target // self loops aren't allowed
			|| backLinks.includes(target) // check this link
			|| !backLinks.every(task => !makesLoop(task, target)) // check recursively
	}
	
	// SIMULATION
	
	let simulation: d3.Simulation<Node, never>
	
	function buildForceSimulation() {
		return d3.forceSimulation(nodes)
			.force("link", d3.forceLink(links).id(node => (node as Node).id).strength(0))
			.force("charge", d3.forceManyBody().distanceMax(200))
			.on("tick", updateSimulation)
			.alphaDecay(0) // never stop the simulation
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
		drawCircle(context, node.x!, node.y!, node.r)
	}
	
	function drawLink(link: Link) {
		const source = link.source as Node
		const target = link.target as Node
		
		context.strokeStyle = $mode == "light" ? "black" : "white"
		
		drawArrow(context, source.x!, source.y!, target.x!, target.y!, 2)
	}
	
	function drawConnector(source: Node) {
		context.strokeStyle = $mode == "light" ? "black" : "white"
		context.lineWidth = 2
		
		drawArrow(context, source.x!, source.y!, mouse.x, mouse.y, 2)
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
		event.subject.fx = transform.invertX(event.x)
		event.subject.fy = transform.invertY(event.y)
	}
	
	function onDrag(event: DragEvent) {
		event.subject.fx = transform.invertX(event.x)
		event.subject.fy = transform.invertY(event.y)
	}
	
	function onDragEnded(event: DragEvent) {
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
	
	async function onClick(event: MouseEvent) {
		if (!selected) { // if no node is selected yet
			selected = getNode(event)
		} else { // if a node is already selected
			const target = getNode(event)
			if (target) { // if we clicked on a node receiving
				await makeLink(selected, target)
			} // if there is no target, drop it
			selected = undefined // reset selection
		}
		// TODO: handle clicking on a link
	}
	
	function onDoubleClick(event: MouseEvent) {
		const node = getNode(event)
		console.log("DOUBLE CLICK", node)
		// TODO: handle double clicking on a link
	}
	
	function onRightClick(event: MouseEvent) {
		const node = getNode(event)
		if (node) { // right clicked on a node
			
		} else { // right clicked in blank space
			
		}
		// TODO: handle right clicking on a link
	}
	
	// START
	
	onMount(() => {
		setCanvasDimensions()
		context = canvas.getContext("2d")!
		
		transform = transform.translate((width / 2) / window.devicePixelRatio, (height / 2) / window.devicePixelRatio)
		
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
	})
</script>

<canvas
	bind:this={canvas}
	on:contextmenu={(event) => { event.preventDefault(); onRightClick(event) }}
	class="w-full h-full"
/>
