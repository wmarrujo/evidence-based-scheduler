<script lang="ts">
	import {Button} from "$lib/components/ui/button"
	import {Plus} from "lucide-svelte"
	import * as Dialog from "$lib/components/ui/dialog"
	import CreateTask from "$lib/components/create-task.svelte"
	import CreateResource from "$lib/components/create-resource.svelte"
	
	let createResourceDialogOpen = false
	let createTaskDialogOpen = false
</script>

<div class="flex flex-col h-screen">
	<div class="w-full p-2 shadow flex justify-between">
		<nav class="flex gap-2">
			<Button href="/">Graph</Button>
		</nav>
		<div class="flex gap-2">
			<Dialog.Root bind:open={createResourceDialogOpen}>
				<Dialog.Trigger><Button><Plus />Add Resource</Button></Dialog.Trigger>
				<Dialog.Content><CreateResource on:created={() => createResourceDialogOpen = false} /></Dialog.Content>
			</Dialog.Root>
			<Dialog.Root bind:open={createTaskDialogOpen}>
				<Dialog.Trigger><Button><Plus />Add Task</Button></Dialog.Trigger>
				<Dialog.Content><CreateTask on:created={() => createTaskDialogOpen = false} /></Dialog.Content>
			</Dialog.Root>
		</div>
	</div>
	<main class="grow">
		TODO: put in the force-directed graph
	</main>
</div>
