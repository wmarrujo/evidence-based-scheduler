<script lang="ts">
	import {cn} from "$lib/utils"
	import * as Plot from "@observablehq/plot"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let className = ""
	export {className as class}
	
	type Goal = {
		type: "Milestone" | "Project" | "Task"
		name: string
	}
	
	export let milestones: Map<Goal, Array<Date>> = new Map()
	
	////////////////////////////////////////////////////////////////////////////////
	
	let container: HTMLDivElement
	
	$: data = [...milestones.entries()].flatMap(([milestone, predictions], m) => {
		return predictions.sort().map((prediction, i) => ({
			series: m,
			prediction,
			probability: i / (predictions.length - 1) * 100, // the index out of how many runs we had is the probability (after it's sorted)
			type: milestone.type,
			name: milestone.name,
		}))
	})
	
	$: {
		container?.firstChild?.remove() // remove an old chart, if any
		container?.append(Plot.plot({ // add the new chart
			width: Math.max(container.clientWidth),
			height: Math.max(container.clientHeight),
			style: "overflow: visible",
			y: {grid: true, label: "Probability (%)"},
			marks: [
				Plot.ruleY([0, 100]), // draw horizontal lines at 0 and 100
				Plot.lineY(data, {x: "prediction", y: "probability", z: "series", stroke: "type"}),
				Plot.crosshairX(data, {x: "prediction", y: "probability"}),
				Plot.text(data, Plot.selectMaxY({x: "prediction", y: "probability", text: "name", lineAnchor: "bottom", dy: -10})),
			],
			color: {
				domain: ["Milestone", "Project", "Task"],
				range: ["green", "blue", "black"],
			},
		}))
	}
</script>

<div bind:this={container} class={cn("w-full h-full", className)} role="img">
	
</div>
