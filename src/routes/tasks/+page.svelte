<script lang="ts">
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {liveQuery} from "dexie"
	import {db} from "$lib/db"
	import * as Table from "$lib/components/ui/table"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let tasks = liveQuery(() => db.tasks.toArray())
	
	console.log(tasks)
	
</script>

<div class="flex flex-col h-screen">
	<MenuBar>
		<div class="flex gap-2">
			
		</div>
	</MenuBar>
	<main class="grow">
		<!-- // TODO: list of tasks -->
		<!-- // TODO: stopwatch for current task -->
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Row></Table.Row>
		</Table.Root>
	</main>
</div>
