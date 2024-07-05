<script lang="ts">
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {liveQuery} from "dexie"
	import {db} from "$lib/db"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let tasks = liveQuery(() => db.tasks.toArray())
	
	
</script>

<div class="flex flex-col h-screen">
	<MenuBar>
		<div class="flex gap-2">
			
		</div>
	</MenuBar>
	<main class="grow">
		// TODO: ship date probability graph
		// TODO: ship date probability prediction history
	</main>
</div>
