<script lang="ts">
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {Button} from "$lib/components/ui/button"
	import {Group, Plus, X} from "lucide-svelte"
	import * as Dialog from "$lib/components/ui/dialog"
	import CreateResource from "$lib/components/create-resource.svelte"
	import {db, liveQuery} from "$lib/db"
	import DependencyGraph from "$lib/components/dependency-graph.svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let createResourceDialogOpen = false
	
	let tasks = liveQuery(() => db.tasks.toArray())
	let projects = liveQuery(() => db.projects.toArray())
	
	let dependencyGraph: DependencyGraph
	let grouping: boolean = false
</script>

<div class="flex flex-col h-screen">
	<MenuBar>
		<div class="flex gap-2">
			{#if grouping}
				<Button variant="outline" on:click={() => dependencyGraph.cancelGrouping()}><X /> Cancel Grouping</Button>
				<Button on:click={() => dependencyGraph.makeProject()}><Plus /> New Project</Button>
				<Button on:click={() => dependencyGraph.makeMilestone()}><Plus /> New Milestone</Button>
			{:else}
				<Button on:click={() => dependencyGraph.startGrouping()}><Group /> Group</Button>
				<Dialog.Root bind:open={createResourceDialogOpen}>
					<Dialog.Trigger><Button><Plus />Add Resource</Button></Dialog.Trigger>
					<Dialog.Content><CreateResource on:created={() => createResourceDialogOpen = false} /></Dialog.Content>
				</Dialog.Root>
			{/if}
		</div>
	</MenuBar>
	<main class="grow">
		{#if $tasks}
			<DependencyGraph
				bind:this={dependencyGraph}
				bind:grouping={grouping}
				tasks={$tasks}
				projects={$projects}
			/>
		{/if}
	</main>
</div>
