<script lang="ts">
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {db} from "$lib/db"
	import type {Task, TaskId} from "$lib/db"
	import Table from "./table.svelte"
	import TaskCard from "./task-card.svelte"
	import * as Card from "$lib/components/ui/card"
	import {ListPlus, Trash2} from "lucide-svelte"
	import {Button} from "$lib/components/ui/button"
	import {Separator} from "$lib/components/ui/separator"
	import * as Dialog from "$lib/components/ui/dialog"
	import CreateMilestone from "$lib/components/create-milestone.svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let selected: Array<TaskId> = $state([])
	let selectedTasks: Array<Task> = $state([])
	
	function setTasks(tasks: Array<Task>) { selectedTasks = tasks } // made into its own function because svelte reactivity would cause a loop
	$effect(() => { db.tasks.bulkGet(selected).then(tasks => setTasks((tasks.filter(t => t) as Array<Task>))) })
	
	function clickedDelete() {
		db.tasks.bulkDelete([...selected]) // TODO: doesn't update table when it deletes
	}
	
	let createMilestoneDialogOpen = $state(false)
</script>

<div class="flex flex-col h-screen">
	<MenuBar />
	<main class="grow grid grid-cols-2 gap-2 p-2 min-h-0">
		<Table onselection={selection => selected = selection} class="h-full min-h-0" />
		<div class="min-h-0">
			{#if selected.length <= 1}
				<TaskCard task={selectedTasks[0]} />
			{:else}
				<Card.Root class="h-full">
					<Card.Header class="text-center">
						<Card.Title>Multiple Tasks Selected</Card.Title>
						<!-- TODO: bulk editing of estimates, spent, done -->
						<!-- TODO: show if they're all part of a tag or milestone together -->
						<!-- TODO: show averages and sums of various quantities -->
					</Card.Header>
					<Card.Content class="flex flex-col justify-start items-center gap-2">
						<Button onclick={() => createMilestoneDialogOpen = true}><ListPlus class="mr-2" />New Milestone from selection</Button>
						<Separator />
						<Button variant="destructive" onclick={clickedDelete} class="text-md"><Trash2 class="mr-2" />Delete</Button>
						<!-- TODO: other actions on multiple -->
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	</main>
</div>

<Dialog.Root bind:open={createMilestoneDialogOpen}>
	<Dialog.Content class="min-w-[50%] max-h-[90vh] h-[90vh] pt-12">
		<CreateMilestone requirements={[...selected]} oncreated={() => createMilestoneDialogOpen = false} />
	</Dialog.Content>
</Dialog.Root>
