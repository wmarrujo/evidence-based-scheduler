<script lang="ts">
	import {cn} from "$lib/utils"
	import * as Card from "$lib/components/ui/card"
	import {db} from "$lib/db"
	import type {Task} from "$lib/db"
	import {Plus, Play, Pause, Square, Pencil, Check, Trash2} from "lucide-svelte"
	import {Button} from "$lib/components/ui/button"
	import * as Dialog from "$lib/components/ui/dialog"
	import CreateTask from "$lib/components/create-task.svelte"
	import EditTask from "$lib/components/edit-task.svelte"
	import stopwatch from "$lib/stopwatch"
	
	////////////////////////////////////////////////////////////////////////////////
	
	export let task: Task | undefined
	
	let createTaskDialogOpen = false
	let editTaskDialogOpen = false
	
	let spent: number = 0
	$: if (task) spent = $stopwatch.time ?? task.spent
	
	function clickedDone(task: Task) {
		stopwatch.stop()
		db.tasks.update(task.id, {done: !task.done})
	}
</script>

{#if task}
	<Card.Root>
		<Card.Header>
			<div class="flex justify-center">
				<div class="grid grid-cols-[auto_auto] w-fit gap-4">
					<div class="row-span-2">
						{#if $stopwatch.task?.id == task.id && $stopwatch.running}
							<Button on:click={() => stopwatch.pause()} variant="outline" class="h-full aspect-square rounded-2xl"><Pause class="w-full h-full" /></Button>
						{:else}
							<Button on:click={() => stopwatch.start(task)} variant="outline" class="h-full aspect-square rounded-2xl"><Play class="w-full h-full" /></Button>
						{/if}
					</div>
					<div class="text-5xl flex justify-end font-mono">
						{String(Math.floor(spent)).padStart(2, "0")}:{String(Math.floor(spent * 60 % 60)).padStart(2, "0")}:{String(Math.floor(spent * 60 * 60 % 60)).padStart(2, "0")}
					</div>
					<div class="flex justify-end gap-2 items-center font-mono">
						<span class="text-3xl mr-[18px]">{String(Math.floor(task.estimate)).padStart(2, "0")}:{String(Math.floor(task.estimate * 60 % 60)).padStart(2, "0")}</span>
						<Button on:click={() => clickedDone(task)} variant="outline" class={cn("px-3", task.done && "bg-green-600 hover:bg-green-700")}>
							{#if task.done}
								<Check class="mr-2" />
							{:else}
								<Square class="mr-2" />
							{/if}
							Done
						</Button>
					</div>
				</div>
			</div>
			<Card.Title class="text-3xl pt-4">{task.name}</Card.Title>
		</Card.Header>
		<Card.Content>
			<!-- TODO: markdown description -->
		</Card.Content>
		<Card.Footer class="flex gap-2">
			<Button on:click={() => editTaskDialogOpen = true}><Pencil class="mr-2" />Edit</Button>
			<Button variant="destructive" on:click={() => editTaskDialogOpen = true}><Trash2 class="mr-2" />Delete</Button>
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
