<script lang="ts">
	import {cn} from "$lib/utils"
	import * as Plot from "@observablehq/plot"
	import {mode} from "mode-watcher"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let {
		class: className = "",
		milestones = new Map(),
	}: {
		class?: string
		milestones?: Map<Goal, Array<Date>>
	} = $props()
	
	type Goal = {
		type: "Milestone" | "Tag" | "Task"
		name: string
	}
	
	////////////////////////////////////////////////////////////////////////////////
	
	let container: HTMLDivElement
	
	let data = $derived([...milestones.entries()].flatMap(([milestone, predictions], m) => {
		return predictions.sort((a: Date, b: Date) => a.getTime() - b.getTime()).map((prediction, i) => ({
			series: m,
			prediction,
			probability: i / (predictions.length - 1) * 100, // the index out of how many runs we had is the probability (after it's sorted)
			type: milestone.type,
			name: milestone.name,
		}))
	}))
	
	$effect(() => {
		container?.firstChild?.remove() // remove an old chart, if any
		container?.append(Plot.plot({ // add the new chart
			width: Math.max(container.clientWidth),
			height: Math.max(container.clientHeight),
			style: {
				overflow: "visible",
				fontSize: "1em",
			},
			margin: 60,
			marginRight: 20,
			x: {type: "time"},
			y: {grid: true, label: "Probability (%)"},
			marks: [
				Plot.ruleY([0, 100]), // draw horizontal lines at 0 and 100
				Plot.lineY(data, {x: "prediction", y: "probability", z: "series", stroke: "type"}),
				Plot.ruleY(data, Plot.pointerY({px: "prediction", y: "probability", z: "series", stroke: "red"})),
				Plot.ruleX(data, Plot.pointerY({x: "prediction", py: "probability", z: "series", stroke: "red"})),
				Plot.dot(data, Plot.pointerY({x: "prediction", y: "probability", z: "series", stroke: "red"})),
				Plot.text(data, Plot.pointerY({px: "prediction", py: "probability", frameAnchor: "top-left", dy: -20,
					text: (d) => `${Math.round(d.probability)}% probability that ${d.type} "${d.name}" will be completed by ${((d.prediction as Date).toLocaleString("en-US", {weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", hour12: false, minute: "2-digit"}))}`,
				})),
			],
			color: {
				domain: ["Milestone", "Tag", "Task"],
				range: ["green", "blue", $mode == "light" ? "black" : "white"],
			},
		}))
	})
</script>

<div bind:this={container} class={cn("w-full h-full", className)} role="img">
	
</div>
