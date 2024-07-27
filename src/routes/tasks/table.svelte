<script lang="ts">
	import {db, liveQuery} from "$lib/db"
	import * as Table from "$lib/components/ui/table"
	import {createTable, Render, Subscribe} from "svelte-headless-table"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let tasks = liveQuery(() => db.tasks.toArray())
	
	const table = createTable(tasks)
	
	const columns = table.createColumns([
		table.column({accessor: "id", header: ""}),
		table.column({accessor: "name", header: "Name"}),
		table.column({accessor: "done", header: "Done"}),
		table.column({accessor: "estimate", header: "Estimate"}),
	])
	
	const {headerRows, pageRows, tableAttrs, tableBodyAttrs} = table.createViewModel(columns)
</script>

<div class="rounded-md border">
	<Table.Root {...$tableAttrs}>
		<Table.Header>
			{#each $headerRows as headerRow}
				<Subscribe rowAttrs={headerRow.attrs()}>
					<Table.Row>
						{#each headerRow.cells as cell (cell.id)}
							<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
								<Table.Head {...attrs}>
									<Render of={cell.render()} />
								</Table.Head>
							</Subscribe>
						{/each}
					</Table.Row>
				</Subscribe>
			{/each}
		</Table.Header>
		<Table.Body {...$tableBodyAttrs}>
			{#each $pageRows as row (row.id)}
				<Subscribe rowAttrs={row.attrs()} let:rowAttrs>
					<Table.Row {...rowAttrs}>
						{#each row.cells as cell (cell.id)}
							<Subscribe attrs={cell.attrs()} let:attrs>
								<Table.Cell {...attrs}>
									<Render of={cell.render()} />
								</Table.Cell>
							</Subscribe>
						{/each}
					</Table.Row>
				</Subscribe>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
