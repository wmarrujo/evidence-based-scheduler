<script lang="ts">
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {db} from "$lib/db"
	import type {Task, TaskId} from "$lib/db"
	import Table from "./table.svelte"
	import TaskCard from "./task-card.svelte"
	import * as Card from "$lib/components/ui/card"
	import {Trash2} from "lucide-svelte"
	import {Button} from "$lib/components/ui/button"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let selected: Array<TaskId> = []
	let selectedTasks: Array<Task> = []
	
	function setTasks(tasks: Array<Task>) { selectedTasks = tasks } // made into its own function because svelte reactivity would cause a loop
	$: db.tasks.bulkGet(selected).then(tasks => setTasks((tasks.filter(t => t) as Array<Task>)))
</script>

<div class="flex flex-col h-screen">
	<MenuBar />
	<main class="grow grid grid-cols-2 gap-2 p-2 min-h-0">
		<Table on:selection={event => selected = event.detail} />
		<div class="min-h-0">
			{#if selected.length <= 1}
				<TaskCard task={selectedTasks[0]} />
			{:else}
				<Card.Root>
					<Card.Header class="text-center">
						<Card.Title>Multiple Tasks Selected</Card.Title>
						<!-- TODO: bulk editing of estimates, spent, done -->
					</Card.Header>
					<Card.Content class="text-center">
						<Button variant="destructive" class="text-md"><Trash2 class="mr-2" />Delete</Button>
						<!-- TODO: other actions on multiple -->
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	</main>
</div>
