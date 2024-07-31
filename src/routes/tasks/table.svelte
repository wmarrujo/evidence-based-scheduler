<script lang="ts">
	import {cn} from "$lib/utils"
	import {db, liveQuery} from "$lib/db"
	import type {Resource, ResourceId} from "$lib/db"
	import * as Table from "$lib/components/ui/table"
	import {createTable, Render, Subscribe, createRender} from "svelte-headless-table"
	import {addPagination, addSortBy, addTableFilter, addHiddenColumns, addSelectedRows} from "svelte-headless-table/plugins"
	import {Button} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import {derived, type Readable} from "svelte/store"
	import TableCheckbox from "./table-checkbox.svelte"
	import {Plus, Columns3, ArrowDownAZ, ArrowUpZA, ArrowDown01, ArrowUp10} from "lucide-svelte"
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
	import * as Pagination from "$lib/components/ui/pagination"
	import {createEventDispatcher} from "svelte"
	import YesNoChip from "./yes-no-chip.svelte"
	import StatusChip from "./status-chip.svelte"
	import * as Dialog from "$lib/components/ui/dialog"
	import EditTask from "$lib/components/edit-task.svelte"
	
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
		page: addPagination({initialPageSize: 100}),
		sort: addSortBy(),
		filter: addTableFilter({
			fn: ({filterValue, value}) => value.toLowerCase().includes(filterValue.toLowerCase().trim()),
		}),
		hide: addHiddenColumns(),
		select: addSelectedRows(),
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
				return createRender(TableCheckbox, {checked: isSelected, preventDefault: true})
				// TODO: make it so when the checkboxes themselves are checked, it can multi-select without needing the meta key or shift key
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
			cell: ({value}) => createRender(YesNoChip, {status: value}),
			plugins: {
				sort: {getSortValue: (value) => value ? 1 : 0},
				filter: {exclude: true},
			},
		}),
		table.column({
			accessor: "status",
			header: "Status",
			cell: ({value}) => createRender(StatusChip, {status: value}),
			plugins: {
				filter: {exclude: true},
			},
		}),
		// TODO: dependsOn: Array<TaskId>
		// TODO: dependants
		// TODO: projects
		// TODO: milestones
	])
	
	const {headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates, flatColumns, rows} = table.createViewModel(columns)
	
	const {pageIndex, pageSize} = pluginStates.page
	const {filterValue} = pluginStates.filter
	const {hiddenColumnIds} = pluginStates.hide
	const {selectedDataIds, allRowsSelected} = pluginStates.select
	
	const ids = flatColumns.map(col => col.id)
	let initialHiddenColumns = ["spent", "done"]
	let hideColumnById = Object.fromEntries(ids.map(id => [id, !initialHiddenColumns.includes(id)]))
	$: $hiddenColumnIds = Object.entries(hideColumnById).filter(([_, hide]) => !hide).map(([id]) => id)
	const hidableColumns = ["doer", "estimate", "spent", "done", "status"]
	
	////////////////////////////////////////////////////////////////////////////////
	// INTERACTION
	////////////////////////////////////////////////////////////////////////////////
	
	let className = ""
	export {className as class}
	
	const dispatch = createEventDispatcher()
	
	// @ts-expect-error original isn't typed correctly and I can't get the task id any other way https://github.com/bryanmylee/svelte-headless-table/issues/104
	$: dispatch("selection", Object.keys($selectedDataIds).map(row => $rows[Number(row)].original.id))
	
	type ArrayElementType<A> = A extends readonly (infer E)[] ? E : never;
	type Row = ArrayElementType<typeof $rows>
	
	let rangeSelectionStartRowId: string | undefined
	function rowClicked(event: MouseEvent, row: Row) {
		if (event.metaKey) { // if command or control are selected while clicking
			$selectedDataIds[row.id] = !$selectedDataIds[row.id] // toggle row
			rangeSelectionStartRowId = row.id
		} else if (event.shiftKey) {
			// NOTE: assumes we don't have sub-rows
			const start = Math.min(Number(rangeSelectionStartRowId), Number(row.id))
			const end = Math.max(Number(rangeSelectionStartRowId), Number(row.id)) + 1
			const rows = Array.from(Array(end - start).keys()).map(i => String(i + start))
			rows.forEach(id => $selectedDataIds[id] = true) // select all rows between last and here
		} else {
			const previous = $selectedDataIds[row.id]
			$allRowsSelected = false // deselect all rows
			$selectedDataIds[row.id] = !previous // toggle row
			rangeSelectionStartRowId = row.id
		}
	}
	
	let createTaskDialogOpen = false
</script>

<div class={cn("flex flex-col gap-2", className)}>
	<div class="flex gap-1">
		<Input type="text" bind:value={$filterValue} placeholder="Search name..." />
		<Button variant="outline" on:click={() => createTaskDialogOpen = true} class="aspect-square p-0"><Plus /></Button>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button variant="ghost" builders={[builder]} class="ml-auto aspect-square p-0"><Columns3 /></Button>
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
	<div class="rounded-md border grow min-h-0">
		<Table.Root {...$tableAttrs} class="border-separate border-spacing-0">
			<Table.Header class="border-0">
				{#each $headerRows as headerRow (headerRow.id)}
					<Subscribe rowAttrs={headerRow.attrs()}>
						<Table.Row class="border-0">
							{#each headerRow.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs props={cell.props()} let:props>
									<Table.Head {...attrs}
										class={cn("[&:has([role=checkbox])]:pl-3 p-1 sticky top-0 bg-background border-b first:rounded-tl-md last:rounded-tr-md",
										// class={cn("[&:has([role=checkbox])]:pl-3 p-1 sticky top-0 bg-background drop-shadow-[0_1px_0_rgb(228,228,231)] dark:drop-shadow-[0_1px_0_rgb(39,39,42)]",
											["checkbox", "estimate", "spent", "done", "status"].includes(cell.id) && "w-0", // shrink
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
			<Table.Body {...$tableBodyAttrs} class="min-h-0 overflow-y-scroll">
				{#each $pageRows as row (row.id)}
					<Subscribe rowAttrs={row.attrs()} let:rowAttrs>
						<Table.Row data-state={$selectedDataIds[row.id] && "selected"} on:click={event => rowClicked(event, row)} class="h-10 select-none cursor-pointer" {...rowAttrs}>
							{#each row.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} let:attrs>
									<Table.Cell class="p-1 border-b" {...attrs}>
										{#if cell.id == "checkbox"}
											<div class="pl-2 pt-1">
												<Render of={cell.render()} />
											</div>
										{:else if ["estimate", "spent"].includes(cell.id)}
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
	<div class="flex items-center">
		<div class="text-muted-foreground flex-1 text-sm text-nowrap">
			{Object.keys($selectedDataIds).length} of {$rows.length} task{$rows.length == 1 ? "" : "s"} selected
		</div>
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
	</div>
</div>

<Dialog.Root bind:open={createTaskDialogOpen}>
	<Dialog.Content class="min-w-[70%] pt-12">
		<EditTask on:saved={() => createTaskDialogOpen = false} />
	</Dialog.Content>
</Dialog.Root>
