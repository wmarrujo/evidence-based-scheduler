<script lang="ts">
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {db, liveQuery} from "$lib/db"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let resources = liveQuery(() => db.resources.toArray())
	
</script>

<div class="flex flex-col h-screen">
	<MenuBar>
		<div class="flex gap-2">
			
		</div>
	</MenuBar>
	<main class="grow">
		<span>🚧 Under Construction 🚧</span>
		<!-- // TODO: list resources -->
		<!-- // TODO: show & edit schedules -->
		<!-- // TODO: estimated vs actual hours -->
		<!-- // TODO: velocity spread -->
	</main>
</div>
