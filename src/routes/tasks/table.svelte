<script lang="ts">
	import {cn} from "$lib/utils"
	import {db, liveQuery} from "$lib/db"
	import type {TaskId, Resource, ResourceId} from "$lib/db"
	import * as Table from "$lib/components/ui/table"
	import {createTable, Render, Subscribe, createRender} from "svelte-headless-table"
	import {addPagination, addSortBy, addTableFilter, addHiddenColumns, addSelectedRows} from "svelte-headless-table/plugins"
	import {Button} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import {derived, type Readable} from "svelte/store"
	import TableCheckbox from "./table-checkbox.svelte"
	import TableActions from "./table-actions.svelte"
	import {ChevronDown, ArrowDownAZ, ArrowUpZA, ArrowDown01, ArrowUp10} from "lucide-svelte"
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
	import * as Pagination from "$lib/components/ui/pagination"
	import {createEventDispatcher} from "svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	// DATA
	////////////////////////////////////////////////////////////////////////////////
	
	let tasks = derived(liveQuery(() => db.tasks.toArray()), ts => ts ?? [], [])
	let resources = derived(liveQuery(() => db.resources.toArray()), rs => rs ?? [], [])
	let resourcesById = derived(resources, resources => new Map(resources.map(r => [r.id, r])), new Map()) as Readable<Map<ResourceId, Resource>>
	
	enum Status {
		Planned = 0,
		Started = 1,
		Done = 2,
	}
	
	let data = derived([tasks, resourcesById], ([$tasks, $resourcesById]) => {
		return $tasks.map(task => ({
			...task,
			status: task.done ? Status.Done : task.spent <= 0 ? Status.Planned : Status.Started,
			doerName: $resourcesById.get(task.doer)?.name ?? "ERROR: invalid doer",
		}))
	}, [])
	
	////////////////////////////////////////////////////////////////////////////////
	// TABLE
	////////////////////////////////////////////////////////////////////////////////
	
	const table = createTable(data, {
		page: addPagination({initialPageSize: 10}),
		sort: addSortBy(),
		filter: addTableFilter({
			fn: ({filterValue, value}) => value.toLowerCase().includes(filterValue.toLowerCase().trim()),
		}),
		hide: addHiddenColumns(),
		select: addSelectedRows(),
		// select: addSelectedRows({initialSelectedDataIds: Object.fromEntries(selected.map(t => [t, true]))}),
	})
	
	const columns = table.createColumns([
		table.column({
			id: "checkbox",
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
			id: "doer",
			accessor: "doerName",
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
			cell: ({value}) => value ? "YES" : "NO", // TODO: make fancy chip for this
			plugins: {
				sort: {getSortValue: (value) => value ? 1 : 0},
				filter: {exclude: true},
			},
		}),
		table.column({
			accessor: "status",
			header: "Status",
			cell: ({value}) => ["Planned", "Started", "Done"][value], // TODO: make fancy chip for this
			plugins: {
				filter: {exclude: true},
			},
		}),
		// dependsOn: Array<TaskId>
		// dependants
		// projects
		// milestones
		table.column({
			id: "action",
			accessor: "id",
			header: "",
			cell: ({value}) => createRender(TableActions, {task: value}),
			plugins: {
				sort: {disable: true},
				filter: {exclude: true},
			},
		}),
	])
	
	const {headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates, flatColumns, rows} = table.createViewModel(columns, {rowDataId: row => String(row.id)})
	
	const {pageIndex, pageSize} = pluginStates.page
	const {filterValue} = pluginStates.filter
	const {hiddenColumnIds} = pluginStates.hide
	const {selectedDataIds} = pluginStates.select
	
	const ids = flatColumns.map(col => col.id)
	let initialHiddenColumns = ["spent", "done"]
	let hideColumnById = Object.fromEntries(ids.map(id => [id, !initialHiddenColumns.includes(id)]))
	$: $hiddenColumnIds = Object.entries(hideColumnById).filter(([_, hide]) => !hide).map(([id]) => id)
	const hidableColumns = ["doer", "estimate", "spent", "done", "status"]
	
	////////////////////////////////////////////////////////////////////////////////
	// EXPORT
	////////////////////////////////////////////////////////////////////////////////
	
	const dispatch = createEventDispatcher()
	
	$: dispatch("select", Object.keys($selectedDataIds).map(Number))
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center">
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
									<Table.Head {...attrs}
										class={cn("[&:has([role=checkbox])]:pl-3 p-1",
											["checkbox", "action", "estimate", "spent", "done", "status"].includes(cell.id) && "w-0", // shrink
										)}
									>
										{#if cell.id == "checkbox"}
											<div class="pt-1 pr-2">
												<Render of={cell.render()} />
											</div>
										{:else if ["estimate", "spent"].includes(cell.id)}
											<Button variant="ghost" on:click={props.sort.toggle} class="p-0 hover:bg-transparent w-full justify-end">
												<Render of={cell.render()} />
												{#if props.sort.order == "asc"}
													<ArrowDown01 class="ml-1 h-4 w-4" />
												{:else if props.sort.order == "desc"}
													<ArrowUp10 class="ml-1 h-4 w-4" />
												{/if}
											</Button>
										{:else if ["name", "doer"].includes(cell.id)}
											<Button variant="ghost" on:click={props.sort.toggle} class="p-0 hover:bg-transparent w-full justify-start">
												<Render of={cell.render()} />
												{#if props.sort.order == "asc"}
													<ArrowDownAZ class="ml-1 h-4 w-4" />
												{:else if props.sort.order == "desc"}
													<ArrowUpZA class="ml-1 h-4 w-4" />
												{/if}
											</Button>
										{:else if ["done", "status"].includes(cell.id)}
											<Button variant="ghost" on:click={props.sort.toggle} class="p-0 hover:bg-transparent w-full justify-start">
												<Render of={cell.render()} />
												{#if props.sort.order == "asc"}
													<ArrowDown01 class="ml-1 h-4 w-4" />
												{:else if props.sort.order == "desc"}
													<ArrowUp10 class="ml-1 h-4 w-4" />
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
									<Table.Cell class={cn("p-1"/*, cell.id == "checkbox" && "w-min", cell.id == "action" && "w-10"*/)} {...attrs}>
										{#if cell.id == "checkbox"}
											<div class="pl-2 pt-1">
												<Render of={cell.render()} />
											</div>
										{:else if ["estimate", "spent"].includes(cell.id)}
											<div class="text-right">
												<Render of={cell.render()} /><span class="text-muted-foreground">h</span>
											</div>
										{:else if cell.id == "action"}
											<div>
												<Render of={cell.render()} />
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
	<div class="flex items-center">
		<div class="text-muted-foreground flex-1 text-sm text-nowrap">
			{Object.keys($selectedDataIds).length} of {$rows.length} task{$rows.length == 1 ? "" : "s"} selected
		</div>
		<!-- TODO: figure out how to link the pagination here with the table variables -->
		<Pagination.Root count={$rows.length} bind:perPage={$pageSize} let:pages let:currentPage onPageChange={page => $pageIndex = page - 1}>
			<Pagination.Content>
				<Pagination.Item><Pagination.PrevButton /></Pagination.Item>
				{#each pages as page (page.key)}
					{#if page.type == "ellipsis"}
						<Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
					{:else}
						<Pagination.Item><Pagination.Link {page} isActive={page.value == currentPage}>{page.value}</Pagination.Link></Pagination.Item>
					{/if}
				{/each}
				<Pagination.Item><Pagination.NextButton /></Pagination.Item>
			</Pagination.Content>
		</Pagination.Root>
		<!-- <Button variant="outline" on:click={() => $pageIndex = $pageIndex - 1} disabled={!$hasPreviousPage}>Preview</Button> -->
		<!-- <Button variant="outline" on:click={() => $pageIndex = $pageIndex + 1} disabled={!$hasNextPage}>Next</Button> -->
	</div>
</div>
