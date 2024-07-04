<script lang="ts">
	import * as d3 from "d3"
	import {onMount} from "svelte"
	import type {Task, TaskId, Resource, ResourceId, Project, ProjectId} from "$lib/db"
	import {db} from "$lib/db"
	import {liveQuery} from "dexie"
	import {mode} from "mode-watcher"
	import {drawCircle, drawArrow, drawRectangle} from "$lib/canvas"
	import * as Card from "$lib/components/ui/card"
	import * as Dialog from "$lib/components/ui/dialog"
	import {Button} from "$lib/components/ui/button"
	import CreateTask from "$lib/components/create-task.svelte"
	import EditTask from "$lib/components/edit-task.svelte"
	import CreateProject from "$lib/components/create-project.svelte"
	import {cn} from "$lib/utils"
	import {Toaster} from "$lib/components/ui/sonner"
	import {toast} from "svelte-sonner"
	import {SquareUserRound, AlarmClock, Timer, Plus, Trash2, Pencil} from "lucide-svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	// SETUP
	////////////////////////////////////////////////////////////////////////////////
	
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
	
	////////////////////////////////////////////////////////////////////////////////
	// DATA
	////////////////////////////////////////////////////////////////////////////////
	
	export let tasks: Array<Task> = []
	
	export let projects: Array<Project> = []
	$: projectsById = projects.reduce((acc, project) => { acc[project.id] = project; return acc }, {} as Record<ProjectId, Project>)
	
	let resources = liveQuery(() => db.resources.toArray())
	let resourcesById: Record<ResourceId, Resource> = {}
	$: if ($resources) resourcesById = $resources.reduce((acc, resource) => { acc[resource.id] = resource; return acc }, {} as Record<ResourceId, Resource>)
	
	type Node = d3.SimulationNodeDatum & {
		id: number
		type: "Task" | "Project"
		name: string
		r: number // radius
	}
	type Link = d3.SimulationLinkDatum<Node>
	
	const defaultRadius = 10
	
	function taskToNode(task: Task): Node {
		return {id: task.id, type: "Task", name: task.name, r: Math.sqrt(task.estimate * defaultRadius**2)} // TODO: set the radius based on the size
	}
	
	function getTaskByIdUnsafe(id: TaskId): Task {
		return tasks.find(task => task.id == id)!
	}
	
	const nodes: Array<Node> = tasks.map(taskToNode)
	const links: Array<Link> = tasks.flatMap(task => task.dependsOn.map(d => ({source: d, target: task.id})))
	// TODO: add projects to links
	
	$: unExpandedProjectNodes = nodes.filter(node => node.type == "Project") // all the nodes which are projects (so the un-expanded projects)
	$: unExpandedProjectIds = unExpandedProjectNodes.map(node => node.id)
	$: expandedProjects = projects.filter(project => !unExpandedProjectIds.includes(project.id))
	$: expandedProjectNodes = expandedProjects.reduce((acc, project) => {
		acc[project.id] = nodes.filter(node => { // get the nodes that should go inside this project's box
			if (node.type == "Task") { return project.tasks.includes(node.id) }
			else if (node.type == "Project") { return projectsById[project.id].tasks.intersects(projectsById[node.id].tasks) } // if there is any overlap, include this un-expanded project in this project's box
			else return false
		})
		return acc
	}, {} as Record<ProjectId, Array<Node>>)
	
	////////////////////////////////////////////////////////////////////////////////
	// SIMULATION
	////////////////////////////////////////////////////////////////////////////////
	
	let simulation: d3.Simulation<Node, never>
	
	// FORCES
	
	function flow(alpha: number) {
		let strength = 1
		let idealDistance = defaultRadius * 5
		
		links.forEach(({source, target}) => {
			source = source as Node; target = target as Node
			
			const sourceIdealX = target.x! - (idealDistance + target.r + source.r)
			const targetIdealX = source.x! + (idealDistance + target.r + source.r)
			
			source.vx! += (sourceIdealX - source.x!) * 0.001 * strength * alpha
			source.vy! += (target.y! - source.y!) * 0.001 * strength * alpha
			
			target.vx! += (targetIdealX - target.x!) * 0.001 * strength * alpha
			target.vy! += (source.y! - target.y!) * 0.001 * strength * alpha
		})
	}
	
	// RUNNING
	
	function buildForceSimulation() {
		return d3.forceSimulation(nodes)
			.force("link", d3.forceLink(links).id(node => (node as Node).id).strength(0.001)) // connect nodes
			.force("repulsion", d3.forceManyBody().strength(-5).distanceMax(defaultRadius * 10)) // keep nodes apart
			.force("separator", d3.forceManyBody().strength(-0.1)) // try to separate things
			.force("centerX", d3.forceX().strength(0.0001)) // make sure separate sections don't fly off forever
			.force("centerY", d3.forceY().strength(0.001)) // make sure separate sections don't fly off forever
			.force("flow", flow) // flow nodes left to right via their connections
			.on("tick", updateSimulation)
			.alphaDecay(0) // never stop the simulation
	}
	
	function reInitializeSimulation() {
		simulation.nodes(nodes) // make sure it has the updated list of nodes
		// re-initialize forces
		simulation.force("link")!.initialize!(nodes, () => 0)
		simulation.force("repulsion")!.initialize!(nodes, () => 0)
		simulation.force("separator")!.initialize!(nodes, () => 0)
		simulation.force("centerX")!.initialize!(nodes, () => 0)
		simulation.force("centerY")!.initialize!(nodes, () => 0)
	}
	
	function updateSimulation() {
		context.save()
		context.clearRect(0, 0, width, height)
		context.translate(transform.x * window.devicePixelRatio, transform.y * window.devicePixelRatio)
		context.scale(transform.k * window.devicePixelRatio, transform.k * window.devicePixelRatio)
		
		// draw
		expandedProjects.forEach(project => { drawGroup(expandedProjectNodes[project.id]) })
		links.forEach(drawLink)
		if (selectedNode) drawConnector(selectedNode)
		nodes.forEach(drawNode)
		
		context.restore()
	}
	
	// DRAWING
	
	function drawNode(node: Node) {
		let color = $mode == "light" ? "black" : "white"
		if (groupedNodes.includes(node)) color = "purple"
		const border = hoveredNode == node || selectedNode == node
		let borderColor
		if (hoveredNode == node) borderColor = "gold"
		if (selectedNode == node) borderColor = "lightblue"
		
		drawCircle(context, node.x!, node.y!, node.r, {border, borderWidth: 3, color, borderColor})
	}
	
	function drawLink(link: Link) {
		const source = link.source as Node
		const target = link.target as Node
		
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
	
	function drawGroup(nodes: Array<Node>) {
		let color = $mode == "light" ? "black" : "white"
		
		const minX = Math.min(...nodes.map(node => node.x! - node.r))
		const minY = Math.min(...nodes.map(node => node.y! - node.r))
		const maxX = Math.max(...nodes.map(node => node.x! + node.r))
		const maxY = Math.max(...nodes.map(node => node.y! + node.r))
		
		drawRectangle(context, minX, minY, maxX, maxY, {offset: defaultRadius, color, opacity: 0.1})
	}
	
	////////////////////////////////////////////////////////////////////////////////
	// INTERACTION
	////////////////////////////////////////////////////////////////////////////////
	
	let transform = d3.zoomIdentity
	
	type Point = {x: number, y: number}
	let cursor: Point = {x: 0, y: 0} // the mouse coordinates, in the DOM's coordinate space
	let mouse: Point = {x: 0, y: 0} // the mouse coordinates, in the canvas' coordinate space
	
	function getNode(point: Point): Node | undefined {
		return nodes.find(node => Math.sqrt((point.x - node.x!)**2 + (point.y - node.y!)**2) < node.r)
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
		
		if (grouping) { // if we're in grouping mode
			if (clickedNode) groupedNodes.push(clickedNode) // add any node we clicked on
		} else if (!selectedNode) { // if no node is selected yet
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
		if (doubleClickedNode) { // if double clicked on a node
			if (doubleClickedNode.type == "Task") openEditTaskDialog(doubleClickedNode.id)
		} else { // if double clicked in empty space
			openCreateTaskDialog(mouse)
		}
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
	
	// Grouping
	
	export let grouping = false // if we're in grouping mode
	let groupedNodes: Array<Node> = []
	
	export function startGrouping() {
		grouping = true
	}
	
	export function cancelGrouping() {
		grouping = false
		groupedNodes = [] // clear the grouping
	}
	
	export function finishGrouping() {
		grouping = false
		if (groupedNodes.length == 0) return // if we didn't actually group anything, don't make a group
		createProjectTasks = groupedNodes.flatMap(node => {
			if (node.type == "Task") { return [node.id] } // the node id is the task id
			else if (node.type == "Project") { return projects.find(project => project.id == node.id)?.tasks ?? [] }
			else { return [] }
		})
		createProjectDialogOpen = true // get the final information
		groupedNodes = [] // clear the grouping
	}
	
	// DIALOGS
	
	// Information Card
	
	let informationCard: Card.Root
	let informationCardOpen = false
	$: informationCardNode = hoveredNode
	$: informationCardTask = tasks.find(task => task.id == informationCardNode?.id)
	
	// Context Menu
	
	let contextMenuOpen = false
	
	// Create Task
	
	let createTaskDialogOpen = false
	let createTaskInsertionPoint: Point = {x: 0, y: 0}
	
	function openCreateTaskDialog(point: Point) {
		createTaskInsertionPoint = point // record where we started making the task, so we can insert the node there
		createTaskDialogOpen = true // go make a task
	}
	
	// Edit Task
	
	let editTaskDialogOpen = false
	let editTaskId: TaskId | undefined
	
	function openEditTaskDialog(id?: TaskId) {
		if (!id) return // this can't happen, but have to guard against it so typescript is happy
		editTaskId = id
		editTaskDialogOpen = true
	}
	
	// Create Project
	
	let createProjectDialogOpen = false
	let createProjectTasks: Array<TaskId> = []
	
	// ACTIONS
	
	function onTaskCreated(event: CustomEvent<Task>) {
		const task = event.detail
		const node = taskToNode(task)
		node.x = createTaskInsertionPoint.x; node.y = createTaskInsertionPoint.y
		
		// add the task as a node
		simulation.stop()
		nodes.push(node)
		reInitializeSimulation()
		simulation.restart()
	}
	
	function onTaskEdited(event: CustomEvent<Task>) {
		const task = event.detail
		const node = taskToNode(task)
		
		// add the task as a node
		simulation.stop()
		const oldNode = nodes.findIndex(n => n.id == node.id)
		nodes.splice(oldNode, 1, {...nodes[oldNode], ...node}) // replace the node (but keep the position information)
		reInitializeSimulation()
		simulation.restart()
	}
	
	function onProjectCreated(event: CustomEvent<Project>) {
		// TODO
	}
	
	async function makeLink(source: Node, target: Node) {
		// guards
		if (links.findIndex(link => link.source == source && link.target == target) != -1) { toast.error("That dependency already exists"); return}
		if (source == target) return // if it's the same node, don't error, since it's spently probably just a double click
		if (await makesLoop(source.id, target.id)) { toast.error("That dependency would make a loop"); return}
		
		// FIXME: don't assume nodes are tasks
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
	
	async function removeLink(link: Link) {
		const target = link.target as Node
		const source = link.source as Node
		
		// FIXME: don't assume nodes are tasks
		// remove from database
		const task = (await db.tasks.get(target.id))!
		task.dependsOn = task.dependsOn.filter(s => s != source.id)
		await db.tasks.update(target.id, {dependsOn: task.dependsOn})
		
		// remove from list of links
		simulation.stop()
		links.splice(links.findIndex(l => l == link), 1)
		reInitializeSimulation()
		simulation.restart()
	}
	
	async function removeNode(node: Node | undefined) {
		if (!node) return // NOTE: this guard is needed for the typing to be correct in the html
		
		// FIXME: don't assume nodes are tasks
		// remove from database
		await db.tasks.delete(node.id) // remove the node itself
		const dependents = await db.tasks.filter(task => task.dependsOn.includes(node.id)).toArray() // find all tasks that reference the node
		await db.tasks.bulkUpdate(dependents.map(task => ({key: task.id, changes: {dependsOn: task.dependsOn.filter(t => t != node.id)}}))) // remove all references to the node
		
		// remove from list of nodes
		const badLinkIndices = links.reduce((acc, link, i) => {
			if ((link.source as Node).id == node.id || (link.target as Node).id == node.id) { acc.push(i); return acc}
			else { return acc }
		}, [] as Array<number>).reverse()
		
		simulation.stop()
		nodes.splice(nodes.findIndex(n => n.id == node.id), 1)
		badLinkIndices.forEach(i => links.splice(i, 1))
		reInitializeSimulation()
		simulation.restart()
	}
	
	////////////////////////////////////////////////////////////////////////////////
	// START
	////////////////////////////////////////////////////////////////////////////////
	
	onMount(() => {
		setCanvasDimensions()
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

<canvas
	bind:this={canvas}
	on:contextmenu={event => { event.preventDefault(); onRightClick(event) }}
	on:mousemove={event => { let [x, y] = transform.invert(d3.pointer(event)); mouse.x = x; mouse.y = y }}
	class={cn("w-full h-full", hoveredLink && !hoveredNode && "deleteCursor")}
/>

<svelte:window on:mousemove={event => { cursor.x = event.pageX; cursor.y = event.pageY }} />

<Card.Root bind:this={informationCard} class={cn("absolute -translate-x-1/2 max-w-96", !informationCardOpen && "hidden", cursor.y < window.innerHeight / 2 ? "translate-y-[2rem]" : "-translate-y-[calc(100%+2rem)]")} style="top: {cursor.y}px; left: {cursor.x}px;">
	{#if informationCardTask}
		<Card.Header class="p-2">
			<Card.Title>{informationCardTask.name}</Card.Title>
		</Card.Header>
		<Card.Content class="p-2 grid grid-cols-[min-content_auto_min-content_auto] gap-1">
			<SquareUserRound /><span class="col-span-3">{informationCardTask.doer ? resourcesById[informationCardTask.doer].name : "Unassigned"}</span>
			<AlarmClock /><span>{informationCardTask.estimate}h</span>
			<Timer /><span>{informationCardTask.spent}h</span>
		</Card.Content>
	{:else}
		<Card.Header class="p-2">
			<Card.Title>Undefined Information</Card.Title>
		</Card.Header>
	{/if}
</Card.Root>

<Card.Root class={cn("absolute max-w-96 flex flex-col p-1", !contextMenuOpen && "hidden", rightClickedCursor.y < window.innerHeight / 2 ? "" : "-translate-y-[calc(100%)]")} style="top: {rightClickedCursor.y}px; left: {rightClickedCursor.x}px;">
	{#if rightClickedNode?.type == "Task"}
		<Button variant="ghost" class="h-8 px-2 w-full justify-start" on:click={() => { contextMenuOpen = false; openEditTaskDialog(rightClickedNode?.id) }}><Pencil class="w-4 h-4 mr-2" />Edit</Button>
		<Button variant="ghost" class="h-8 px-2 w-full justify-start" on:click={() => { contextMenuOpen = false; removeNode(rightClickedNode) }}><Trash2 class="w-4 h-4 mr-2" />Delete</Button>
	{:else}
		<Button variant="ghost" class="h-8 px-2 w-full justify-start" on:click={() => { contextMenuOpen = false; openCreateTaskDialog(rightClickedPoint) }}><Plus class="w-4 h-4 mr-2" />New Task</Button>
	{/if}
</Card.Root>

<Dialog.Root bind:open={createTaskDialogOpen}>
	<Dialog.Content>
		<CreateTask on:created={event => { createTaskDialogOpen = false; onTaskCreated(event) }} />
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={editTaskDialogOpen}>
	<Dialog.Content>
		{#if editTaskId}
			<EditTask initial={getTaskByIdUnsafe(editTaskId)} on:edited={event => { editTaskDialogOpen = false; onTaskEdited(event) }} />
		{/if}
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={createProjectDialogOpen}>
	<Dialog.Content>
		<CreateProject tasks={createProjectTasks} on:created={event => { createProjectDialogOpen = false; onProjectCreated(event) }} />
	</Dialog.Content>
</Dialog.Root>

<Toaster richColors position="top-center" />
