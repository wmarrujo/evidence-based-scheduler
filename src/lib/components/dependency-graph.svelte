<script lang="ts">
	import * as d3 from "d3"
	import {onMount} from "svelte"
	import {type Task} from "$lib/db"
	
	// SETUP
	
	let canvas: HTMLCanvasElement
	let context: CanvasRenderingContext2D
	
	// DATA
	
	export let tasks: Array<Task> = []
	
	const nodes = tasks.map(task => Object.assign({}, task) as d3.SimulationNodeDatum) // make copies
	
	// SIMULATION
	
	let simulation: d3.Simulation<d3.SimulationNodeDatum, never>
	
	function buildForceSimulation() {
		return d3.forceSimulation(nodes)
			.force("center", d3.forceCenter(canvas.width/2, canvas.height/2))
			.force("charge", d3.forceManyBody())
			.on("tick", updateSimulation)
	}
	
	function updateSimulation() {
		context.save()
		context.clearRect(0, 0, canvas.width, canvas.height)
		
		// draw nodes
		nodes.forEach((node) => {
			context.beginPath()
			context.arc(node.x!, node.y!, 10, 0, 2 * Math.PI, false)
			context.fillStyle = "white"
			context.fill()
		})
		
		context.restore()
	}
	
	// START
	
	onMount(() => {
		context = canvas.getContext("2d")!
		
		canvas.width = canvas.clientWidth * window.devicePixelRatio
		canvas.height = canvas.clientHeight * window.devicePixelRatio
		
		simulation = buildForceSimulation()
	})
</script>

<canvas bind:this={canvas} class="w-full h-full" />
