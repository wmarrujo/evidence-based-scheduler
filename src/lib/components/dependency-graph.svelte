<script lang="ts">
	import * as d3 from "d3"
	import {onMount} from "svelte"
	import type {Task, TaskId, Milestone} from "$lib/db"
	import {db, resourcesById, tasksById} from "$lib/db"
	import {mode} from "mode-watcher"
	import {drawCircle, drawArrow, drawLine} from "$lib/canvas"
	import * as Card from "$lib/components/ui/card"
	import * as Dialog from "$lib/components/ui/dialog"
	import {Button} from "$lib/components/ui/button"
	import EditTask from "$lib/components/edit-task.svelte"
	import {cn} from "$lib/utils"
	import {Toaster} from "$lib/components/ui/sonner"
	import {toast} from "svelte-sonner"
	import {SquareUserRound, AlarmClock, Timer, Plus, Trash2, Pencil} from "lucide-svelte"
	import {browser} from "$app/environment"
	
	////////////////////////////////////////////////////////////////////////////////
	// SETUP
	////////////////////////////////////////////////////////////////////////////////
	
	let canvas: HTMLCanvasElement
	let context: CanvasRenderingContext2D
	
	let width: number
	let height: number
	
	const meter = 10 // unit of measure, in pixels
	
	////////////////////////////////////////////////////////////////////////////////
	// DATA
	////////////////////////////////////////////////////////////////////////////////
	
	// these are passed in based on where the component is used
	export let tasks: Array<Task> = []
	export let milestones: Array<Milestone> = []
	
	// NODES & LINK OBJECTS
	
	type Node = d3.SimulationNodeDatum & {
		id: number
		r: number // radius
	}
	type Link = d3.SimulationLinkDatum<Node>
	
	let nodes: Array<Node> = []
	let links: Array<Link> = []
	
	let nodesById = new Map<TaskId, Node>()
	
	const taskToNode = (task: Task): Node => ({id: task.id, r: Math.sqrt(task.estimate * meter**2)})
	
	let nodeInsertionPoint: Point = {x: 0, y: 0}
	function tasksUpdated(tasks: Array<Task>) {
		links.splice(0, links.length) // empty the list // NOTE: WITHOUT reassigning it (since it needs to be the same object that was registered for the force when defining the simulation, so that when we reinitialize the simulation, it can use the node ids and transform them to node objects automatically)
		let unseen = new Set(nodes.map(node => node.id))
		tasks.forEach(task => {
			unseen.delete(task.id) // mark it as seen so that we can remove any that were deleted
			let node = nodesById.get(task.id)
			if (node) {
				node = Object.assign(node, {...taskToNode(task)}) // will modify node in-place
			} else {
				node = {...taskToNode(task), ...nodeInsertionPoint} // make new nodes out of the new tasks
				nodes.push(node)
				nodeInsertionPoint = {x: (Math.random() * 2 - 1) * meter, y: (Math.random() * 2 - 1) * meter} // make it so that successive inserts aren't all on top of each other // TODO: make an actually good layout method
			}
			task.requirements.forEach(r => links.push({source: r, target: task.id}))
		})
		nodes = nodes.filter(node => !unseen.has(node.id)) // remove any old tasks that didn't show up this time around
		nodesById = nodes.reduce((acc, node) => acc.set(node.id, node), new Map<TaskId, Node>()) // update this // NOTE: doesn't work as a standalone reactive value for some reason
	}
	$: tasksUpdated(tasks)
	
	////////////////////////////////////////////////////////////////////////////////
	// SIMULATION
	////////////////////////////////////////////////////////////////////////////////
	
	let simulation: d3.Simulation<Node, never>
	
	// FORCES
	
	function flow(alpha: number) {
		const stiffness = 0.01 // the strength it adds per pixel farther to the right the source is from the target
		const offset = meter * 5 // try to be at least this much farther than in-line with each other
		
		links.forEach(({source, target}) => {
			source = source as Node; target = target as Node
			
			const flippedness = Math.max(0, (source.x! - target.x!) + offset) // how many pixels the source is right of the target (how many it is in the flipped orientation)
			
			source.vx! -= flippedness * stiffness * alpha
			target.vx! += flippedness * stiffness * alpha
		})
	}
	
	// RUNNING
	
	function buildForceSimulation() {
		return d3.forceSimulation(nodes)
			.force("link", d3.forceLink(links).id(node => (node as Node).id).strength(0.001)) // connect nodes
			.force("repulsion", d3.forceManyBody().strength(-5)) // keep nodes apart
			.force("centerX", d3.forceX().strength(0.0001)) // make sure separated nodes don't fly apart forever
			.force("centerY", d3.forceY().strength(0.001)) // make sure separated nodes don't fly apart forever
			.force("flow", flow) // flow nodes left to right via their connections
			.on("tick", updateSimulation)
			.alphaDecay(0) // never stop the simulation
	}
	
	function reInitializeSimulation() {
		simulation.stop()
		simulation.nodes(nodes) // make sure it has the updated list of nodes
		// re-initialize forces
		simulation.force("link")!.initialize!(nodes, () => 0)
		simulation.force("repulsion")!.initialize!(nodes, () => 0)
		simulation.force("centerX")!.initialize!(nodes, () => 0)
		simulation.force("centerY")!.initialize!(nodes, () => 0)
		simulation.restart()
	}
	
	$: if (simulation && (nodes || links)) reInitializeSimulation() // when nodes or links are updated, re-initialize the simulation
	
	function updateSimulation() {
		context.save()
		context.clearRect(0, 0, width, height)
		context.translate(transform.x * window.devicePixelRatio, transform.y * window.devicePixelRatio)
		context.scale(transform.k * window.devicePixelRatio, transform.k * window.devicePixelRatio)
		
		// draw
		links.forEach(drawLink)
		if (selectedNode) drawConnector(selectedNode)
		nodes.forEach(drawNode)
		milestones.forEach(milestone => drawMilestone(milestone))
		
		context.restore()
	}
	
	// DRAWING
	
	function drawNode(node: Node) {
		let color = $mode == "light" ? "black" : "white"
		const border = hoveredNode == node || selectedNode == node
		let borderColor
		if (hoveredNode == node) borderColor = "gold"
		if (selectedNode == node) borderColor = "lightblue"
		
		if (meter <= node.r) { // if it's big enough
			drawCircle(context, node.x!, node.y!, node.r, {border, borderWidth: 3, color, borderColor})
		} else { // if it's too small
			drawCircle(context, node.x!, node.y!, node.r, {color}) // draw the node as small as it is
			drawCircle(context, node.x!, node.y!, meter, {border, borderWidth: 3, color: "transparent", borderColor}) // draw the border not too small, should coincide with the clickable area
		}
	}
	
	function drawLink(link: Link) {
		const source = link.source as Node; const target = link.target as Node
		
		let color = $mode == "light" ? "black" : "white"
		let headColor = $mode == "light" ? "black" : "white"
		if (!hoveredNode && hoveredLink == link) { color = "red"; headColor = "red" }
		
		drawArrow(context, source.x!, source.y!, target.x!, target.y!, {width: 2, startOffset: source.r, endOffset: target.r, color, headColor})
	}
	
	function drawConnector(from: Node) {
		const color = $mode == "light" ? "black" : "white"
		const headColor = $mode == "light" ? "black" : "white"
		
		drawArrow(context, from.x!, from.y!, mouse.x, mouse.y, {width: 2, startOffset: from.r, color, headColor})
	}
	
	function drawMilestone(milestone: Milestone) {
		const buffer = meter * 5
		// go find the nodes it connects to
		const direct = nodes.filter(node => milestone.requirements.includes(node.id))
		const x = Math.max(...direct.map(node => node.x!))
		// draw the line & the connecting lines
		const top = (canvas.scrollTop - transform.y) / transform.k
		const bottom = (canvas.scrollTop + canvas.scrollHeight - transform.y) / transform.k
		drawLine(context, x + buffer, top, x + buffer, bottom, {width: 5, color: "green"})
	}
	
	////////////////////////////////////////////////////////////////////////////////
	// INTERACTION
	////////////////////////////////////////////////////////////////////////////////
	
	let transform = d3.zoomIdentity
	
	type Point = {x: number, y: number}
	let cursor: Point = {x: 0, y: 0} // the mouse coordinates, in the DOM's coordinate space
	let mouse: Point = {x: 0, y: 0} // the mouse coordinates, in the canvas' coordinate space
	
	function getNode(point: Point): Node | undefined {
		return nodes.find(node => Math.sqrt((point.x - node.x!)**2 + (point.y - node.y!)**2) < Math.max(node.r, meter))
	}
	
	function getLink(point: Point, fuzziness: number): Link | undefined {
		return links.find(link => {
			const source = {x: (link.source as Node).x!, y: (link.source as Node).y!}
			const target = {x: (link.target as Node).x!, y: (link.target as Node).y!}
			
			if (point.x < Math.min(source.x, target.x) - fuzziness || Math.max(source.x, target.x) + fuzziness < point.x) return false // it's outside the bounding box of the line, it's not on the line
			if (point.y < Math.min(source.y, target.y) - fuzziness || Math.max(source.y, target.y) + fuzziness < point.y) return false // it's outside the bounding box of the line, it's not on the line
			return Math.abs((target.x - source.x) * (source.y - point.y) - (target.y - source.y) * (source.x - point.x)) / Math.sqrt((target.x - source.x)**2 + (target.y - source.y)**2) <= fuzziness // right angle distance
		})
	}
	
	// ZOOM
	
	type ZoomEvent = d3.D3ZoomEvent<HTMLCanvasElement, Node>
	
	function zoomed(event: ZoomEvent) {
		transform = event.transform.translate(width / 2 / window.devicePixelRatio, height / 2 / window.devicePixelRatio)
		updateSimulation()
	}
	
	// DRAG
	
	type DragEvent = d3.D3DragEvent<HTMLCanvasElement, Node, Node>
	
	function getDragSubject(_event: DragEvent) {
		const node = getNode(mouse)
		if (node) { node.x = transform.applyX(node.x!); node.y = transform.applyY(node.y!) }
		return node
	}
	
	function onDragStarted(event: DragEvent) {
		informationCardOpen = false // hide the card
		event.subject.fx = transform.invertX(event.x); event.subject.fy = transform.invertY(event.y) // force the subject to follow mouse
	}
	
	function onDrag(event: DragEvent) {
		event.subject.fx = transform.invertX(event.x); event.subject.fy = transform.invertY(event.y) // force the subject to follow mouse
	}
	
	function onDragEnded(event: DragEvent) {
		event.subject.fx = undefined; event.subject.fy = undefined
	}
	
	// HOVER
	
	let hoveredNode: Node | undefined
	let hoveredLink: Link | undefined
	
	function onMouseMove(_event: MouseEvent) {
		hoveredNode = getNode(mouse)
		hoveredLink = getLink(mouse, 5)
		
		if (hoveredNode) {
			if (!contextMenuOpen) informationCardOpen = true
		} else {
			informationCardOpen = false
		}
	}
	
	// CLICK
	
	let clickedNode: Node | undefined
	
	async function onClick(_event: MouseEvent) {
		contextMenuOpen = false
		rightClickedNode = undefined
		
		clickedNode = getNode(mouse)
		
		if (!selectedNode) { // if no node is selected yet
			selectedNode = clickedNode
			
			if (!selectedNode && !hoveredNode) { // if we didn't just select a node now, and we aren't hovering over one (which would be a double click on the node)
				const link = getLink(mouse, 5) // see if we clicked on a link
				if (link) removeLink(link) // if we clicked on a link, remove it
			}
		} else { // if a node is already selected
			if (clickedNode) { // if we clicked on a node receiving
				await makeLink(selectedNode, clickedNode)
			} // if there is no target, we clicked on empty space, drop it
			selectedNode = undefined // reset selection
		}
	}
	
	let doubleClickedNode: Node | undefined
	
	function onDoubleClick(_event: MouseEvent) {
		doubleClickedNode = getNode(mouse)
		if (doubleClickedNode) openEditTaskDialog(doubleClickedNode.id) // if double clicked on a node
		else openCreateTaskDialog(mouse) // if double clicked in empty space
	}
	
	let rightClickedCursor: Point = {x: 0, y: 0}
	let rightClickedPoint: Point = {x: 0, y: 0}
	let rightClickedNode: Node | undefined
	
	function onRightClick(_event: MouseEvent) {
		informationCardOpen = false // close the information box, so we don't see both at the same time
		selectedNode = undefined // stop drawing another arrow
		rightClickedCursor = cursor // store the position of the cursor when this was clicked, so we can make the UI element not move with the mouse
		rightClickedPoint = mouse // store the position of the mouse when this was clicked, in case we want to do things like make a new node
		rightClickedNode = getNode(mouse)
		contextMenuOpen = true // show the context menu
	}
	
	// SELECTIONS
	
	let selectedNode: Node | undefined
	
	// DIALOGS
	
	// Information Card
	
	let informationCard: Card.Root
	let informationCardOpen = false
	$: informationCardNode = hoveredNode
	$: informationCardTask = tasks.find(task => task.id == informationCardNode?.id)
	
	// Context Menu
	
	let contextMenuOpen = false
	
	// Create Task
	
	let taskDialogOpen = false
	
	function openCreateTaskDialog(point: Point) {
		nodeInsertionPoint = point // record where we started making the task, so we can insert the node there
		editTaskId = undefined // make sure it's not editing anything (this will make the dialog add a task instead)
		taskDialogOpen = true // go make a task
	}
	
	// Edit Task
	
	let editTaskId: TaskId | undefined
	
	function openEditTaskDialog(id?: TaskId) {
		if (!id) return // this can't happen, but have to guard against it so typescript is happy
		editTaskId = id // make sure it's editing the task we selected
		taskDialogOpen = true
	}
	
	// ACTIONS
	
	async function makeLink(source: Node, target: Node) {
		// guards
		if (links.findIndex(link => link.source == source && link.target == target) != -1) { toast.error("That dependency already exists"); return}
		if (source == target) return // if it's the same node, don't error, since it's spently probably just a double click
		if (await makesLoop(source.id, target.id)) { toast.error("That dependency would make a loop"); return}
		
		// add this information to the database
		const task = $tasksById.get(target.id)!
		task.requirements.push(source.id)
		db.tasks.update(target.id, {requirements: task.requirements})
	}
	
	/** Returns true if the arrow from the source to the target would make a loop. */
	async function makesLoop(source: TaskId, target: TaskId): Promise<boolean> {
		// if (source == target) return true // no self-loops (and when it's come all the way around, though this is caught 1 level early) // NOTE: disabling for efficiency, since we're checking for this separately already
		const backLinks = $tasksById.get(source)?.requirements ?? [] // get the backlinks of this source
		if (backLinks.includes(target)) return true // check 1 level short (it would find it the next loop, but skip that work here) // NOTE: this line is for efficiency
		return Promise.all(backLinks.map(task => makesLoop(task, target))).then(loops => loops.some(t => t)) // check the backlinks recursively
	}
	
	async function removeLink(link: Link) {
		const target = link.target as Node
		const source = link.source as Node
		
		// remove from database
		const task = $tasksById.get(target.id)!
		task.requirements = task.requirements.filter(s => s != source.id)
		await db.tasks.update(target.id, {requirements: task.requirements})
	}
	
	async function removeNode(node: Node | undefined) {
		if (!node) return // NOTE: this guard is needed for the typing to be correct in the html
		
		// remove from database
		const dependents = await db.tasks.filter(task => task.requirements.includes(node.id)).toArray() // find ALL tasks that reference the node (not just the tasks passed in to the component, so use db.tasks directly)
		await db.tasks.bulkUpdate(dependents.map(task => ({key: task.id, changes: {requirements: task.requirements.filter(t => t != node.id)}}))) // remove all references to the node
		await db.tasks.delete(node.id) // remove the node itself // NOTE: do this after removing the dependencies to make sure it removes the links first
	}
	
	////////////////////////////////////////////////////////////////////////////////
	// START
	////////////////////////////////////////////////////////////////////////////////
	
	onMount(() => {
		canvas.width = canvas.clientWidth * window.devicePixelRatio; canvas.height = canvas.clientHeight * window.devicePixelRatio
		width = canvas.clientWidth * window.devicePixelRatio; height = canvas.clientHeight * window.devicePixelRatio
		context = canvas.getContext("2d")!
		
		transform = transform.translate((width / 2) / window.devicePixelRatio, (height / 2) / window.devicePixelRatio)
		
		simulation = buildForceSimulation()
		
		d3.select(canvas)
			.call(d3.drag<HTMLCanvasElement, unknown>().container(canvas).subject(getDragSubject).on("start", onDragStarted).on("drag", onDrag).on("end", onDragEnded)) // NOTE: this must be before zoom, to take precedence
			.call(d3.zoom<HTMLCanvasElement, unknown>().on("zoom", zoomed))
			.on("dblclick.zoom", null) // disable default double click to zoom
			.on("mousemove", onMouseMove)
			.on("click", onClick)
			.on("dblclick", onDoubleClick)
	})
</script>

<style lang="pcss">
	.deleteCursor {
		cursor: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS10cmFzaC0yIj48cGF0aCBkPSJNMyA2aDE4Ii8+PHBhdGggZD0iTTE5IDZ2MTRjMCAxLTEgMi0yIDJIN2MtMSAwLTItMS0yLTJWNiIvPjxwYXRoIGQ9Ik04IDZWNGMwLTEgMS0yIDItMmg0YzEgMCAyIDEgMiAydjIiLz48bGluZSB4MT0iMTAiIHgyPSIxMCIgeTE9IjExIiB5Mj0iMTciLz48bGluZSB4MT0iMTQiIHgyPSIxNCIgeTE9IjExIiB5Mj0iMTciLz48L3N2Zz4="), auto;
	}
</style>

<svelte:window on:mousemove={event => { cursor.x = event.pageX; cursor.y = event.pageY }} />
<canvas
	bind:this={canvas}
	on:contextmenu|preventDefault={onRightClick}
	on:mousemove={event => { let [x, y] = transform.invert(d3.pointer(event)); mouse.x = x; mouse.y = y }}
	class={cn("w-full h-full", hoveredLink && !hoveredNode && "deleteCursor")}
/>

<Card.Root bind:this={informationCard} class={cn("absolute -translate-x-1/2 max-w-96", !informationCardOpen && "hidden", browser && cursor.y < window.innerHeight / 2 ? "translate-y-[2rem]" : "-translate-y-[calc(100%+2rem)]")} style="top: {cursor.y}px; left: {cursor.x}px;">
	{#if informationCardTask}
		<Card.Header class="p-2">
			<Card.Title>{informationCardTask.name}</Card.Title>
		</Card.Header>
		<Card.Content class="p-2 grid grid-cols-[min-content_auto_min-content_auto] gap-1">
			<SquareUserRound /><span class="col-span-3">{informationCardTask.doer ? $resourcesById.get(informationCardTask.doer)?.name : "Unassigned"}</span>
			<AlarmClock /><span>{informationCardTask.estimate}h</span>
			<Timer /><span>{informationCardTask.spent}h</span>
		</Card.Content>
	{:else}
		<Card.Header class="p-2">
			<Card.Title>Undefined Information</Card.Title>
		</Card.Header>
	{/if}
</Card.Root>

<Card.Root class={cn("absolute max-w-96 flex flex-col p-1", !contextMenuOpen && "hidden", browser && rightClickedCursor.y < window.innerHeight / 2 ? "" : "-translate-y-[calc(100%)]")} style="top: {rightClickedCursor.y}px; left: {rightClickedCursor.x}px;">
	{#if rightClickedNode}
		<Button variant="ghost" class="h-8 px-2 w-full justify-start" on:click={() => { contextMenuOpen = false; openEditTaskDialog(rightClickedNode?.id) }}><Pencil class="w-4 h-4 mr-2" />Edit</Button>
		<Button variant="ghost" class="h-8 px-2 w-full justify-start" on:click={() => { contextMenuOpen = false; removeNode(rightClickedNode) }}><Trash2 class="w-4 h-4 mr-2" />Delete</Button>
		<!-- TODO: add duplicate -->
		<!-- TODO: add duplicate with links -->
		<!-- TODO: add transfer to another person -->
	{:else}
		<Button variant="ghost" class="h-8 px-2 w-full justify-start" on:click={() => { contextMenuOpen = false; openCreateTaskDialog(rightClickedPoint) }}><Plus class="w-4 h-4 mr-2" />New Task</Button>
	{/if}
</Card.Root>

<Dialog.Root bind:open={taskDialogOpen}>
	<Dialog.Content class="min-w-[90%] max-h-[90vh] h-[90vh] pt-12">
		<EditTask task={editTaskId ? $tasksById.get(editTaskId) : undefined} on:saved={() => taskDialogOpen = false} />
	</Dialog.Content>
</Dialog.Root>

<Toaster richColors position="top-center" />
