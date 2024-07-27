<script lang="ts">
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {db, liveQuery} from "$lib/db"
	import Table from "./table.svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let tasks = liveQuery(() => db.tasks.toArray())
	
</script>

<div class="flex flex-col h-screen">
	<MenuBar>
		<div class="flex gap-2">
			
		</div>
	</MenuBar>
	<main class="grow grid grid-cols-2">
		<Table />
	</main>
</div>
