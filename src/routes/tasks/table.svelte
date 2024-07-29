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
	import {ChevronDown, ArrowDownAZ, ArrowUpZA, ArrowDown01, ArrowUp10} from "lucide-svelte"
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let tasks = liveQuery(() => db.tasks.toArray())
	let resources = liveQuery(() => db.tasks.toArray())
	
	// $: let resourcesById = resources
	
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
		table.column({
			accessor: "doer",
			header: "Doer",
		}),
		table.column({
			accessor: "estimate",
			header: "Estimate",
			cell: ({value}) => value.toFixed(1),
			plugins: {
				filter: {exclude: true},
			},
		}),
		table.column({
			accessor: "spent",
			header: "Spent",
			cell: ({value}) => value.toFixed(1),
			plugins: {
				filter: {exclude: true},
			},
		}),
		table.column({
			accessor: "done",
			header: "Done",
			plugins: {
				filter: {exclude: true},
			},
		}),
		// dependsOn: Array<TaskId>
		// dependants
		// projects
		// milestones
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

<div class="p-2">
	<div class="flex items-center pb-2">
		<Input type="text" bind:value={$filterValue} placeholder="Search name..." class="max-w-sm" />
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
									<Table.Head {...attrs} class="[&:has([role=checkbox])]:pl-3 p-1">
										{#if cell.id == "id"}
											<div class="pt-1">
												<Render of={cell.render()} />
											</div>
										{:else if ["estimate", "spent"].includes(cell.id)}
											<Button variant="ghost" on:click={props.sort.toggle} class="p-0 hover:bg-transparent w-full justify-end">
												<Render of={cell.render()} />
												{#if props.sort.order == "asc"}
													<ArrowDown01 class="h-4 w-4" />
												{:else if props.sort.order == "desc"}
													<ArrowUp10 class="h-4 w-4" />
												{/if}
											</Button>
										{:else if ["name", "doer", "done"].includes(cell.id)}
											<Button variant="ghost" on:click={props.sort.toggle} class="p-0 hover:bg-transparent w-full justify-start">
												<Render of={cell.render()} />
												{#if props.sort.order == "asc"}
													<ArrowDownAZ class="h-4 w-4" />
												{:else if props.sort.order == "desc"}
													<ArrowUpZA class="h-4 w-4" />
												{/if}
											</Button>
										{:else}
											<Render of={cell.render()} />
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
									<Table.Cell class="p-1" {...attrs}>
										{#if cell.id == "id"}
											<div class="pl-2 pt-1">
												<Render of={cell.render()} />
											</div>
										{:else if ["estimate", "spent"].includes(cell.id)}
											<div class="text-right">
												<Render of={cell.render()} /><span class="text-muted-foreground">h</span>
											</div>
										{:else}
											<div class="">
												<Render of={cell.render()} />
											</div>
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
	<div class="flex items-center justify-end space-x-4 pt-2">
		<div class="text-muted-foreground flex-1 text-sm">
			{Object.keys($selectedDataIds).length} of {$rows.length} task{$rows.length == 1 ? "" : "s"} selected
		</div>
		<Button variant="outline" on:click={() => $pageIndex = $pageIndex - 1} disabled={!$hasPreviousPage}>Preview</Button>
		<Button variant="outline" on:click={() => $pageIndex = $pageIndex + 1} disabled={!$hasNextPage}>Next</Button>
	</div>
</div>
