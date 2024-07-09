<script lang="ts">
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {liveQuery} from "dexie"
	import {db} from "$lib/db"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let resources = liveQuery(() => db.resources.toArray())
	
</script>

<div class="flex flex-col h-screen">
	<MenuBar>
		<div class="flex gap-2">
			
		</div>
	</MenuBar>
	<main class="grow">
		// TODO: list resources
		// TODO: show & edit schedules
		// TODO: estimated vs actual hours
		// TODO: velocity spread
	</main>
</div>
