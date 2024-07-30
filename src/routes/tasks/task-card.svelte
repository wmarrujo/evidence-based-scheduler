<script lang="ts">
	import * as Card from "$lib/components/ui/card"
	import type {Task} from "$lib/db"
	import {Plus, Play, Pause, Square, Pencil, Check} from "lucide-svelte"
	import {Button} from "$lib/components/ui/button"
	import * as Dialog from "$lib/components/ui/dialog"
	import CreateTask from "$lib/components/create-task.svelte"
	import EditTask from "$lib/components/edit-task.svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	export let task: Task | undefined
	
	let createTaskDialogOpen = false
	let editTaskDialogOpen = false
</script>

{#if task}
	<Card.Root>
		<Card.Header>
			<div class="grid grid-cols-2">
				<div class="row-span-2">
					<Button class="w-24 h-24"><Play class="w-24 h-24" /></Button>
				</div>
				<div class="text-5xl flex justify-end">
					{String(Math.floor(task.spent)).padStart(2, "0")}:{String(Math.floor(task.spent * 60 % 60)).padStart(2, "0")}:{String(Math.floor(task.spent * 60 * 60 % 60)).padStart(2, "0")}
				</div>
				<div class="flex justify-end gap-2 items-center">
					<span class="text-3xl">{String(Math.floor(task.estimate)).padStart(2, "0")}:{String(Math.floor(task.estimate * 60 % 60)).padStart(2, "0")}</span>
					<Button class="px-3">
						{#if task.done}
							<Check class="mr-2" />
						{:else}
							<Square class="mr-2" />
						{/if}
						Done
					</Button>
				</div>
			</div>
			<Card.Title>{task.name}</Card.Title>
		</Card.Header>
		<Card.Content>
			<!-- TODO: markdown description -->
		</Card.Content>
		<Card.Footer>
			<Button on:click={() => editTaskDialogOpen = true}><Pencil />Edit Task</Button>
			<Button variant="destructive" on:click={() => editTaskDialogOpen = true}><Pencil />Delete</Button>
			<!-- TODO: actions -->
		</Card.Footer>
	</Card.Root>
{:else}
	<Card.Root>
		<Card.Header class="text-center">
			<Card.Title>No Task Selected</Card.Title>
		</Card.Header>
		<Card.Content class="text-center">
			<Button class="text-md" on:click={() => createTaskDialogOpen = true}><Plus class="mr-2" />New Task</Button>
		</Card.Content>
	</Card.Root>
{/if}

<Dialog.Root bind:open={createTaskDialogOpen}>
	<Dialog.Content>
		<CreateTask on:created={() => createTaskDialogOpen = false} />
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={editTaskDialogOpen}>
	<Dialog.Content>
		{#if task}
			<EditTask initial={task} on:edited={() => editTaskDialogOpen = false} />
		{/if}
	</Dialog.Content>
</Dialog.Root>
