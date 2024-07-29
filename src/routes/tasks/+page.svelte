<script lang="ts">
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {db} from "$lib/db"
	import type {Task, TaskId} from "$lib/db"
	import Table from "./table.svelte"
	import TaskCard from "./task-card.svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let selected: Array<TaskId> = []
	let selectedTask: Task | undefined // for when a single task is selected
	function selectTask(task: Task | undefined) {selectedTask = task} // made into its own function because svelte reactivity would cause a loop
	$: db.tasks.get(selected[0]).then(selectTask)
</script>

<div class="flex flex-col h-screen">
	<MenuBar>
		<div class="flex gap-2">
			
		</div>
	</MenuBar>
	<main class="grow grid grid-cols-2">
		<Table on:select={event => selected = event.detail} />
		<div>
			{#if 1 < selected.length}
				<span>multiple</span>
			{:else if selectedTask}
				<TaskCard task={selectedTask} />
			{:else}
				<span>none</span>
			{/if}
		</div>
	</main>
</div>
