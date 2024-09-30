<script lang="ts">
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {tasks, milestones} from "$lib/db"
	import DependencyGraph from "$lib/components/dependency-graph.svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let dependencyGraph: DependencyGraph
</script>

<div class="flex flex-col h-screen">
	<MenuBar />
	<main class="grow">
		{#if $tasks}
			<DependencyGraph
				bind:this={dependencyGraph}
				tasks={$tasks}
				milestones={$milestones}
			/>
		{/if}
	</main>
</div>
