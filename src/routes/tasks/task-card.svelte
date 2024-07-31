<script lang="ts">
	import {cn} from "$lib/utils"
	import * as Card from "$lib/components/ui/card"
	import {db} from "$lib/db"
	import type {Task} from "$lib/db"
	import {Plus, Play, Pause, Square, Pencil, Check, Trash2} from "lucide-svelte"
	import {Button} from "$lib/components/ui/button"
	import * as Dialog from "$lib/components/ui/dialog"
	import EditTask from "$lib/components/edit-task.svelte"
	import stopwatch from "$lib/stopwatch"
	import Markdown from "$lib/components/markdown.svelte"
	import {Separator} from "$lib/components/ui/separator"
	
	////////////////////////////////////////////////////////////////////////////////
	
	export let task: Task | undefined
	
	let createTaskDialogOpen = false
	let editTaskDialogOpen = false
	
	let spent: number = 0
	$: if (task) spent = ($stopwatch.task?.id == task.id ? $stopwatch.time : task.spent) ?? task.spent
	
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
			<Separator />
		</Card.Header>
		<Card.Content>
			<Markdown text={task.description} />
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
	<Dialog.Content class="max-w-full pt-12">
		<EditTask on:saved={() => createTaskDialogOpen = false} />
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={editTaskDialogOpen}>
	<Dialog.Content class="max-w-[90%] w-[90%] max-h-[90%] h-[90%] pt-12">
		<EditTask task={task} on:saved={() => editTaskDialogOpen = false} class="h-full w-full" />
	</Dialog.Content>
</Dialog.Root>
