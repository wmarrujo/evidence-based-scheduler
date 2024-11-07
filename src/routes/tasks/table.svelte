<script lang="ts">
	import {cn, type ArrayElement} from "$lib/utils"
	import {tasks, resourcesById} from "$lib/db"
	import type {TaskId} from "$lib/db"
	import * as Table from "$lib/components/ui/table"
	import {Button} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import TableCheckbox from "./table-checkbox.svelte"
	import {Plus, Columns3, /*ArrowDownAZ, ArrowUpZA, ArrowDown01, ArrowUp10,*/ ChevronLeft, ChevronRight} from "lucide-svelte"
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
	import * as Pagination from "$lib/components/ui/pagination"
	// import YesNoChip from "./yes-no-chip.svelte"
	// import StatusChip from "./status-chip.svelte"
	import * as Dialog from "$lib/components/ui/dialog"
	import EditTask from "$lib/components/edit-task.svelte"
	import {getCoreRowModel, getPaginationRowModel, getFilteredRowModel} from "@tanstack/table-core"
	import type {ColumnDef, PaginationState, RowSelectionState, VisibilityState, ColumnFiltersState} from "@tanstack/table-core"
	import {createSvelteTable, FlexRender, renderComponent} from "$lib/components/ui/data-table"
	
	// TODO: re-implement sorting
	// TODO: re-implement clicking on a row to select it
	// TODO: re-implement command-clicking & shift-clicking
	// TODO: make the column names in the visibility selector look nicer
	
	////////////////////////////////////////////////////////////////////////////////
	// DATA
	////////////////////////////////////////////////////////////////////////////////
	
	let data = $derived($tasks.map(task => ({
		...task,
		status: task.done ? "done" : task.spent <= 0 ? "planned" : "started", // TODO: remove this when we use snippets to display the column
		doerName: $resourcesById.get(task.doer)?.name ?? "ERROR: invalid doer", // TODO: remove this when we use snippets to display the column
	})))
	
	////////////////////////////////////////////////////////////////////////////////
	// TABLE
	////////////////////////////////////////////////////////////////////////////////
	
	const columns: Array<ColumnDef<ArrayElement<typeof data>>> = [
		{
			id: "select",
			header: ({table}) => renderComponent(TableCheckbox, {
				checked: table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate"),
				onCheckedChange: value => table.toggleAllPageRowsSelected(Boolean(value)),
				controlledChecked: true,
				"aria-label": "Select all",
			}),
			cell: ({row}) => renderComponent(TableCheckbox, {
				checked: row.getIsSelected(),
				onCheckedChange: value => row.toggleSelected(Boolean(value)),
				controlledChecked: true,
				"aria-label": "Select row",
			}),
			enableSorting: false,
			enableHiding: false,
		},
		{header: "Name", accessorKey: "name"},
		{header: "Doer", accessorKey: "doerName"},
		{header: "Estimate", accessorKey: "estimate"},
		{header: "Spent", accessorKey: "spent"},
		{header: "Done", accessorKey: "done"},
		{header: "Status", accessorKey: "status"},
		// TODO: requirements
		// TODO: dependants
		// TODO: tags
		// TODO: milestones
	]
	
	let pagination = $state<PaginationState>({pageIndex: 0, pageSize: 30})
	let selection = $state<RowSelectionState>({})
	let visibility = $state<VisibilityState>({})
	let filters = $state<ColumnFiltersState>([])
	
	const table = createSvelteTable({
		get data() { return data },
		columns,
		state: {
			get pagination() { return pagination },
			get rowSelection() { return selection },
			get columnVisibility() { return visibility },
			get columnFilters() { return filters },
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: updater => { if (typeof updater === "function") { pagination = updater(pagination) } else { pagination = updater } },
		onRowSelectionChange: updater => { if (typeof updater === "function") { selection = updater(selection) } else { selection = updater } },
		onColumnVisibilityChange: updater => { if (typeof updater === "function") { visibility = updater(visibility) } else { visibility = updater } },
		onColumnFiltersChange: updater => { if (typeof updater === "function") { filters = updater(filters) } else { filters = updater } },
	})
	
	////////////////////////////////////////////////////////////////////////////////
	// INTERACTION
	////////////////////////////////////////////////////////////////////////////////
	
	let {
		class: className = "",
		onselection = () => {},
	}: {
		class?: string
		onselection?: (tasks: Array<TaskId>) => void
	} = $props()
	
	$effect(() => onselection(table.getSelectedRowModel().rows.map(row => row.original.id)))
	
	let createTaskDialogOpen = $state(false)
</script>

<div class={cn("flex flex-col gap-2", className)}>
	<div class="flex gap-1">
		<Input
			type="text"
			value={table.getColumn("name")?.getFilterValue() ?? ""}
			onchange={event => table.getColumn("name")?.setFilterValue(event.currentTarget.value)}
			oninput={event => table.getColumn("name")?.setFilterValue(event.currentTarget.value)}
			placeholder="Search name..."
		/>
		<span class="grow"></span>
		<Button variant="outline" onclick={() => createTaskDialogOpen = true} class="aspect-square"><Plus />New Task</Button>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<Button variant="ghost" class="ml-auto aspect-square p-0"><Columns3 /></Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				{#each table.getAllColumns().filter(column => column.getCanHide()) as column (column.id)}
					<DropdownMenu.CheckboxItem controlledChecked checked={column.getIsVisible()} onCheckedChange={value => column.toggleVisibility(Boolean(value))}>{column.id}</DropdownMenu.CheckboxItem>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
	<div class="rounded-md border grow min-h-0">
		<Table.Root class="border-separate border-spacing-0">
			<Table.Header class="border-0">
				{#each table.getHeaderGroups() as headerRow (headerRow.id)}
					<Table.Row class="border-0">
						{#each headerRow.headers as cell (cell.id)}
							<Table.Head class={cn("sticky top-0 bg-background border-b first:rounded-tl-md last:rounded-tr-md")}>
								{#if !cell.isPlaceholder}
									<FlexRender content={cell.column.columnDef.header} context={cell.getContext()}/>
									<!-- {#if cell.id == "checkbox"}
										<div class="pt-1 pr-2">
											<Render of={cell.render()} />
										</div>
									{:else if ["estimate", "spent"].includes(cell.id)}
										<Button variant="ghost" onclick={props.sort.toggle} class="p-0 hover:bg-transparent w-full justify-end">
											<Render of={cell.render()} />
											{#if props.sort.order == "asc"}
												<ArrowDown01 class="ml-1 h-4 w-4" />
											{:else if props.sort.order == "desc"}
												<ArrowUp10 class="ml-1 h-4 w-4" />
											{/if}
										</Button>
									{:else if ["name", "doer"].includes(cell.id)}
										<Button variant="ghost" onclick={props.sort.toggle} class="p-0 hover:bg-transparent w-full justify-start">
											<Render of={cell.render()} />
											{#if props.sort.order == "asc"}
												<ArrowDownAZ class="ml-1 h-4 w-4" />
											{:else if props.sort.order == "desc"}
												<ArrowUpZA class="ml-1 h-4 w-4" />
											{/if}
										</Button>
									{:else if ["done", "status"].includes(cell.id)}
										<Button variant="ghost" onclick={props.sort.toggle} class="p-0 hover:bg-transparent w-full justify-start">
											<Render of={cell.render()} />
											{#if props.sort.order == "asc"}
												<ArrowDown01 class="ml-1 h-4 w-4" />
											{:else if props.sort.order == "desc"}
												<ArrowUp10 class="ml-1 h-4 w-4" />
											{/if}
										</Button>
									{:else}
										<Render of={cell.render()} />
									{/if} -->
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body class="min-h-0 overflow-y-scroll">
				{#each table.getRowModel().rows as row (row.id)}
					<Table.Row data-state={row.getIsSelected() && "selected"} onclick={() => {}/*event => rowClicked(event, row)*/} class="h-10 select-none cursor-pointer">
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell class="border-b">
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
								<!-- {#if cell.id == "checkbox"}
									<div class="pl-2 pt-1">
										<Render of={cell.render()} />
									</div>
								{:else if ["estimate", "spent"].includes(cell.id)}
									<div class="text-right">
										<Render of={cell.render()} /><span class="text-muted-foreground">h</span>
									</div>
								{:else}
									<Render of={cell.render()} />
								{/if} -->
							</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	<div class="flex items-center">
		<div class="text-muted-foreground flex-1 text-sm text-nowrap">
			{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} tasks selected
		</div>
		{#if pagination.pageSize < data.length}
			<Pagination.Root count={data.length} perPage={pagination.pageSize} controlledPage page={pagination.pageIndex}>
				{#snippet children({pages, currentPage})}
					<Pagination.Content>
						<Pagination.Item>
							<Pagination.PrevButton onclick={() => { if (table.getCanPreviousPage()) table.previousPage() }} class="pr-2.5 {!table.getCanPreviousPage() && "pointer-events-none opacity-50"}"><ChevronLeft /></Pagination.PrevButton>
						</Pagination.Item>
						{#each pages as page (page.key)}
							{#if page.type == "ellipsis"}
								<Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
							{:else}
								<Pagination.Item>
									<Pagination.Link {page} isActive={page.value - 1 == currentPage} onclick={() => table.setPageIndex(page.value - 1)}>{page.value}</Pagination.Link>
								</Pagination.Item>
							{/if}
						{/each}
						<Pagination.Item>
							<Pagination.NextButton onclick={() => { if (table.getCanNextPage()) table.nextPage() }} class="pl-2.5 {!table.getCanNextPage() && "pointer-events-none opacity-50"}"><ChevronRight /></Pagination.NextButton>
						</Pagination.Item>
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>
		{/if}
	</div>
</div>

<Dialog.Root bind:open={createTaskDialogOpen}>
	<Dialog.Content class="min-w-[70%] pt-12">
		<EditTask onsaved={() => createTaskDialogOpen = false} />
	</Dialog.Content>
</Dialog.Root>
