<script lang="ts">
	import {db, liveQuery} from "$lib/db"
	import * as Table from "$lib/components/ui/table"
	import {createTable, Render, Subscribe, createRender} from "svelte-headless-table"
	import {addPagination, addSortBy, addTableFilter, addHiddenColumns, addSelectedRows} from "svelte-headless-table/plugins"
	import {Button} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import {derived} from "svelte/store"
	import TableCheckbox from "./table-checkbox.svelte"
	import TableActions from "./table-actions.svelte"
	import {ArrowUpDown, ChevronDown} from "lucide-svelte"
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let tasks = liveQuery(() => db.tasks.toArray())
	
	const table = createTable(derived(tasks, ts => ts ?? [], []), {
		page: addPagination(),
		sort: addSortBy(),
		filter: addTableFilter({
			fn: ({filterValue, value}) => value.toLowerCase().includes(filterValue.toLowerCase().trim()),
		}),
		hide: addHiddenColumns(),
		select: addSelectedRows(),
	})
	
	const columns = table.createColumns([
		table.column({
			accessor: "id",
			header: (_, {pluginStates}) => {
				const {allPageRowsSelected} = pluginStates.select
				return createRender(TableCheckbox, {checked: allPageRowsSelected})
			},
			cell: ({row}, {pluginStates}) => {
				const {getRowState} = pluginStates.select
				const {isSelected} = getRowState(row)
				return createRender(TableCheckbox, {checked: isSelected})
			},
			plugins: {
				sort: {disable: true},
				filter: {exclude: true},
			},
		}),
		table.column({
			accessor: "name",
			header: "Name",
		}),
		// description: string | undefined
		// doer: ResourceId
		table.column({
			accessor: "estimate",
			header: "Estimate",
			cell: ({value}) => value.toFixed(1),
			plugins: {
				filter: {exclude: true},
			},
		}),
		// spent: number // the spent time spent, in hours
		table.column({
			accessor: "done",
			header: "Done",
			plugins: {
				filter: {exclude: true},
			},
		}),
		// dependsOn: Array<TaskId>
		table.column({
			accessor: ({id}) => id,
			header: "",
			cell: ({value}) => createRender(TableActions, {task: value}),
			plugins: {
				sort: {disable: true},
				filter: {exclude: true},
			},
		}),
	])
	
	const {headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates, flatColumns, rows} = table.createViewModel(columns)
	
	const {hasNextPage, hasPreviousPage, pageIndex} = pluginStates.page
	const {filterValue} = pluginStates.filter
	const {hiddenColumnIds} = pluginStates.hide
	const {selectedDataIds} = pluginStates.select
	
	const ids = flatColumns.map(col => col.id)
	let hideColumnById = Object.fromEntries(ids.map(id => [id, true]))
	$: $hiddenColumnIds = Object.entries(hideColumnById).filter(([_, hide]) => !hide).map(([id]) => id)
	const hidableColumns = ["estimate", "done"]
</script>

<div>
	<div class="flex items-center py-4">
		<Input type="text" bind:value={$filterValue} placeholder="Filter" class="max-w-sm" />
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button variant="outline" builders={[builder]} class="ml-auto">Columns <ChevronDown class="ml-2 h-4 w-4" /></Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				{#each flatColumns as column (column.id)}
					{#if hidableColumns.includes(column.id)}
						<DropdownMenu.CheckboxItem bind:checked={hideColumnById[column.id]}>{column.header}</DropdownMenu.CheckboxItem>
					{/if}
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
	<div class="rounded-md border">
		<Table.Root {...$tableAttrs}>
			<Table.Header>
				{#each $headerRows as headerRow (headerRow.id)}
					<Subscribe rowAttrs={headerRow.attrs()}>
						<Table.Row>
							{#each headerRow.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()} let:props>
									<Table.Head {...attrs} class="[&:has([role=checkbox])]:pl-3">
										{#if cell.id == "estimate"}
											<div class="text-right">
												<Render of={cell.render()} />
											</div>
										{:else}
											<Button variant="ghost" on:click={props.sort.toggle}>
												<Render of={cell.render()} />
												<ArrowUpDown class="ml-2 h-4 w-4" />
											</Button>
										{/if}
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
						<Table.Row data-state={$selectedDataIds[row.id] && "selected"} {...rowAttrs}>
							{#each row.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs>
									<Table.Cell {...attrs}>
										{#if cell.id == "estimate"}
											<div class="text-right">
												<Render of={cell.render()} /><span class="text-muted-foreground">h</span>
											</div>
										{:else}
											<Render of={cell.render()} />
										{/if}
									</Table.Cell>
								</Subscribe>
							{/each}
						</Table.Row>
					</Subscribe>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	<div class="flex items-center justify-end space-x-4 py-4">
		<div class="text-muted-foreground flex-1 text-sm">
			{Object.keys($selectedDataIds).length} of{" "}
			{$rows.length} row(s) selected
		</div>
		<Button variant="outline" on:click={() => $pageIndex = $pageIndex - 1} disabled={!$hasPreviousPage}>Preview</Button>
		<Button variant="outline" on:click={() => $pageIndex = $pageIndex + 1} disabled={!$hasNextPage}>Next</Button>
	</div>
</div>
