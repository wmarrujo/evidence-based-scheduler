<script lang="ts">
	import * as d3 from "d3"
	import {onMount} from "svelte"
	import type {Task, TaskId, Resource, ResourceId} from "$lib/db"
	import {db} from "$lib/db"
	import {liveQuery} from "dexie"
	import {mode} from "mode-watcher"
	import {drawCircle, drawArrow} from "$lib/canvas"
	import * as Card from "$lib/components/ui/card"
	import {cn} from "$lib/utils"
	import {Toaster} from "$lib/components/ui/sonner"
	import {toast} from "svelte-sonner"
	
	// SETUP
	
	let canvas: HTMLCanvasElement
	let context: CanvasRenderingContext2D
	
	let card: Card.Root
	let pageX: number
	let pageY: number
	
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
	
	let resources = liveQuery(() => db.resources.toArray())
	let resourcesById: Record<ResourceId, Resource> = {}
	$: if ($resources) resourcesById = $resources.reduce((acc, resource) => { acc[resource.id] = resource; return acc }, {} as Record<ResourceId, Resource>)
	
	type Node = d3.SimulationNodeDatum & {
		id: number
		name: string
		r: number // radius
	}
	type Link = d3.SimulationLinkDatum<Node>
	
	const nodes: Array<Node> = tasks.map(task => ({id: task.id, name: task.name, r: 10})) // make copies // TODO: set the radius based on the size
	const links: Array<Link> = tasks.flatMap(task => task.dependsOn.map(d => ({source: d, target: task.id})))
	
	async function makeLink(source: Node, target: Node) {
		// guards
		if (links.findIndex(link => link.source == source && link.target == target) != -1) { toast.error("That dependency already exists"); return}
		if (source == target) return // if it's the same node, don't error, since it's actually probably just a double click
		if (await makesLoop(source.id, target.id)) { toast.error("That dependency would make a loop"); return}
		
		// add this information to the database
		const task = (await db.tasks.get(target.id))!
		task.dependsOn.push(source.id)
		db.tasks.update(target.id, {dependsOn: task.dependsOn})
		
		// add the link to the list of links
		simulation.stop()
		links.push({source: source.id, target: target.id})
		reInitializeSimulation()
		simulation.restart()
	}
	
	/** Returns true if the arrow from the source to the target would make a loop. */
	async function makesLoop(source: TaskId, target: TaskId): Promise<boolean> {
		// if (source == target) return true // no self-loops (and when it's come all the way around, though this is caught 1 level early) // NOTE: disabling for efficiency, since we're checking for this separately already
		const backLinks = (await db.tasks.get(source))?.dependsOn ?? [] // get the backlinks of this source
		if (backLinks.includes(target)) return true // check 1 level short (it would find it the next loop, but skip that work here)
		return Promise.all(backLinks.map(task => makesLoop(task, target))).then(loops => loops.some(t => t)) // check the backlinks recursively
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
		if (hovered == node) context.strokeStyle = "gold"
		if (selected == node) context.strokeStyle = "lightblue"
		drawCircle(context, node.x!, node.y!, node.r, {border: hovered == node || selected == node, borderWidth: 3})
	}
	
	function drawLink(link: Link) {
		const source = link.source as Node
		const target = link.target as Node
		
		context.fillStyle = $mode == "light" ? "black" : "white"
		context.strokeStyle = $mode == "light" ? "black" : "white"
		
		drawArrow(context, source.x!, source.y!, target.x!, target.y!, {width: 2, startOffset: source.r, endOffset: source.r})
	}
	
	function drawConnector(from: Node) {
		context.fillStyle = $mode == "light" ? "black" : "white"
		context.strokeStyle = $mode == "light" ? "black" : "white"
		
		drawArrow(context, from.x!, from.y!, mouse.x, mouse.y, {width: 2, startOffset: from.r})
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
		hovered = undefined // hide the card
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
	$: cardTask = hovered ? tasks.find(task => task.id == hovered?.id) : undefined
	
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

<svelte:window on:mousemove={event => ({pageX, pageY} = event)} />
<Card.Root bind:this={card} class={cn("absolute -translate-x-1/2", !hovered ? "hidden" : "", window.innerHeight / 2 < pageY ? "-translate-y-[calc(100%+2rem)]" : "translate-y-[2rem]")} style="top: {pageY}px; left: {pageX}px;">
	<Card.Header>
		<Card.Title>{cardTask?.name}</Card.Title>
	</Card.Header>
	<Card.Content>
		{#if cardTask?.doer}
			<div>Doer: {resourcesById[cardTask?.doer].name}</div>
		{/if}
		<div>Estimate: {cardTask?.estimate} hours</div>
		<div>Actual: {cardTask?.actual} hours</div>
	</Card.Content>
</Card.Root>

<Toaster richColors position="top-center" />
