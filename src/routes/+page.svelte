<script lang="ts">
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {Button} from "$lib/components/ui/button"
	import {Plus} from "lucide-svelte"
	import * as Dialog from "$lib/components/ui/dialog"
	import CreateTask from "$lib/components/create-task.svelte"
	import CreateResource from "$lib/components/create-resource.svelte"
	import {liveQuery} from "dexie"
	import {db} from "$lib/db"
	import DependencyGraph from "$lib/components/dependency-graph.svelte"
	
	let createResourceDialogOpen = false
	let createTaskDialogOpen = false
	
	let tasks = liveQuery(() => db.tasks.toArray())
</script>

<div class="flex flex-col h-screen">
	<MenuBar>
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
	</MenuBar>
	<main class="grow">
		{#if $tasks}
			<DependencyGraph tasks={$tasks} />
		{/if}
	</main>
</div>