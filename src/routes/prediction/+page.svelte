<script lang="ts">
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {db, liveQuery} from "$lib/db"
	import type {Milestone, Project, Task} from "$lib/db"
	import {Button} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import {ArrowRight, Plus, Upload, Save} from "lucide-svelte"
	import {simulate} from "$lib/simulation"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let tasks = liveQuery(() => db.tasks.toArray())
	let milestones = liveQuery(() => db.milestones.toArray())
	
	let selected: Array<Milestone | Project | Task> = []
	
	function clickedSimulate() {
		// simulate(selected, $tasks, new Date()) // DEBUG: re-enable when done writing
		simulate($milestones, $tasks, new Date())
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
				<!-- TODO: ship date chart -->
			</div>
		</div>
	</main>
</div>
