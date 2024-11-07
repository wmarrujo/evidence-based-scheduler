<script lang="ts">
	import MenuBar from "$lib/components/menu-bar.svelte"
	import DependencyGraph from "$lib/components/dependency-graph.svelte"
</script>

<div class="flex flex-col h-screen">
	<MenuBar />
	<main class="grow">
		<DependencyGraph />
	</main>
</div>
