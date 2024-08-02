<script lang="ts">
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {db, liveQuery} from "$lib/db"
	import type {Milestone, Project, Task} from "$lib/db"
	import {Button} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import {ArrowRight, Plus, Upload, Save} from "lucide-svelte"
	import {simulate} from "$lib/simulation"
	import ShipDateProbabilityChart from "$lib/components/ship-date-probability-chart.svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let milestones = liveQuery(() => db.milestones.toArray())
	let projects = liveQuery(() => db.projects.toArray())
	let tasks = liveQuery(() => db.tasks.toArray())
	
	let selected: Array<Milestone | Project | Task> = []
	let start: Date = new Date()
	
	////////////////////////////////////////////////////////////////////////////////
	
	type Goal = {
		type: "Milestone" | "Project" | "Task"
		name: string
	}
	
	function isTask(obj: any): obj is Task { return obj.estimate !== undefined } // eslint-disable-line @typescript-eslint/no-explicit-any
	function isProject(obj: any): obj is Project { return obj.tasks !== undefined } // eslint-disable-line @typescript-eslint/no-explicit-any
	function isMilestone(obj: any): obj is Milestone { return obj.dependsOn !== undefined } // eslint-disable-line @typescript-eslint/no-explicit-any
	
	function getGoal(goal: Milestone | Project | Task): Goal {
		if (isTask(goal)) return {type: "Task", name: goal.name}
		else if (isProject(goal)) return {type: "Project", name: goal.name}
		else if (isMilestone(goal)) return {type: "Milestone", name: goal.name}
		else throw new Error("Unknown Goal Type")
	}
	
	function getRequirements(goal: Milestone | Project | Task) {
		if (isTask(goal)) return [goal.id]
		else if (isProject(goal)) return goal.tasks
		else if (isMilestone(goal)) return goal.dependsOn
		else throw new Error("tried to run a simulation with an unknown type")
	}
	
	let chartData = new Map<Goal, Array<Date>>()
	
	function clickedSimulate() {
		// const selection = [...selected] // save this in case the simulation takes a while and they change their mind in between
		const selection = [...$milestones, ...$projects] // DEBUG
		const results = simulate(selection.map(getRequirements), $tasks, start)
		chartData = new Map(selection.map((goal, i) => [getGoal(goal), results[i]]))
	}
	
</script>

<div class="flex flex-col h-screen">
	<MenuBar>
		<div class="flex gap-2">
			
		</div>
	</MenuBar>
	<main class="grow flex gap-2 p-2 h-full">
		<div class="flex flex-col gap-2 min-w-72 h-full">
			<div class="flex gap-2">
				<Button><Plus />Add</Button>
				<Button on:click={clickedSimulate}>Simulate<ArrowRight /></Button>
			</div>
			<div class="grow">
				<!-- TODO: re-orderable table -->
			</div>
		</div>
		<div class="flex flex-col gap-2 grow h-full">
			<div class="flex gap-2">
				<Input type="date" />
				<!-- TODO: use date & time picker -->
				<Button><Upload />Load Snapshot</Button>
				<Button><Save />Save Snapshot</Button>
			</div>
			<div class="grow">
				<ShipDateProbabilityChart milestones={chartData} />
			</div>
		</div>
	</main>
</div>
