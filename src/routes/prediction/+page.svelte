<script lang="ts">
	import {cn} from "$lib/utils"
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {db, liveQuery} from "$lib/db"
	import type {MilestoneId, ProjectId, TaskId, ResourceId, Velocity} from "$lib/db"
	import {Button, buttonVariants} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import {Plus, Check, X, Milestone, FolderClosed, Pin, Upload, Save} from "lucide-svelte"
	import {simulate} from "$lib/simulation"
	import ShipDateProbabilityChart from "$lib/components/ship-date-probability-chart.svelte"
	import * as Popover from "$lib/components/ui/popover"
	import * as Command from "$lib/components/ui/command"
	import {writable, derived} from "svelte/store"
	import {browser} from "$app/environment"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let milestones = derived(liveQuery(() => db.milestones.toArray()), ms => ms ?? [], [])
	let projects = derived(liveQuery(() => db.projects.toArray()), ps => ps ?? [], [])
	let tasks = derived(liveQuery(() => db.tasks.toArray()), ts => ts ?? [], [])
	let resources = derived(liveQuery(() => db.resources.toArray()), rs => rs ?? [], [])
	
	$: milestoneDependsOnById = $milestones.reduce((acc, milestone) => acc.set(milestone.id, milestone.dependsOn), new Map<MilestoneId, Array<TaskId>>())
	$: projectTasksById = $projects.reduce((acc, project) => acc.set(project.id, project.tasks), new Map<MilestoneId, Array<TaskId>>())
	
	$: options = [
		...$milestones.map(milestone => ({type: "Milestone", id: milestone.id, name: milestone.name})),
		...$projects.map(project => ({type: "Project", id: project.id, name: project.name})),
		...$tasks.map(task => ({type: "Task", id: task.id, name: task.name})),
	] as Array<Goal>
	let selected = writable<Array<Goal>>(browser ? JSON.parse(localStorage.getItem("selected-goals") ?? "[]") : [])
	selected.subscribe(value => { if (browser) localStorage.setItem("selected-goals", JSON.stringify(value)) }) // FIXME: not working
	let start: Date = new Date()
	let simulations: number = 101
	
	////////////////////////////////////////////////////////////////////////////////
	
	type Goal = {
		type: "Milestone" | "Project" | "Task"
		id: MilestoneId | ProjectId | TaskId
		name: string
	}
	
	function getRequirements(goal: Goal): Array<TaskId> {
		if (goal.type == "Milestone") return milestoneDependsOnById.get(goal.id)!
		else if (goal.type == "Project") return projectTasksById.get(goal.id)!
		else return [goal.id]
	}
	
	$: velocitiesByResource = $resources.reduce((acc, resource) => acc.set(resource.id, resource?.velocities ?? []), new Map<ResourceId, Array<Velocity>>())
	
	let chartData = new Map<Goal, Array<Date>>()
	$: if (0 < $selected.length && 0 < $tasks.length && 0 < $resources.length) { // if we are ready to run a simulation
		const results = simulate($selected.map(getRequirements), start, simulations, $tasks, velocitiesByResource)
		chartData = new Map($selected.map((goal, i) => [goal, results[i]]))
	} else {
		chartData = new Map<Goal, Array<Date>>()
	}
	
	let goalPopoverOpen = false
	let dragStartIndex: number | undefined
	let dragEnterIndex: number | undefined
	let dropIndex: number | undefined
	
	function draggedOver(event: DragEvent) {
		const top = (event.target as HTMLLIElement).getBoundingClientRect().top
		const height = (event.target as HTMLLIElement).getBoundingClientRect().height
		const y = event.clientY - top
		if (y < height / 2) dropIndex = dragEnterIndex // the item is being dragged over the top half of another element, replace the item
		else dropIndex = dragEnterIndex! + 1 // the item is being dragged over the bottom half of another element, so place after the item
	}
	
	function dropped() {
		if (dragStartIndex == dropIndex) return // if we haven't moved it, do nothing
		const draggedItem = $selected[dragStartIndex!]
		const newSelected = [...$selected]
		newSelected.splice(dragStartIndex!, 1)
		newSelected.splice(dropIndex!, 0, draggedItem)
		$selected = newSelected
	}
</script>

<div class="flex flex-col h-screen">
	<MenuBar />
	<main class="grow flex gap-2 p-2 h-full">
		<div class="flex flex-col gap-2 min-w-72 h-full">
			<div class="flex gap-2 justify-between items-center">
				<span>Priorities</span>
				<Popover.Root bind:open={goalPopoverOpen}>
					<Popover.Trigger
						role="combobox"
						aria-expanded={goalPopoverOpen}
						{...$$restProps}
						class={cn(buttonVariants({variant: "outline"}), "justify-between pl-3 text-left font-normal")}
					>
						<Plus />Add
					</Popover.Trigger>
					<Popover.Content class="p-0 px-2 pt-2">
						<Command.Root>
							<Command.Input autofocus placeholder="Search..." class="h-9" />
							<Command.Empty>No resource found.</Command.Empty>
							<Command.Group heading="Milestones">
								{#each options.filter(option => option.type == "Milestone") as option (option.id)}
									<Command.Item value={option.type + option.id} onSelect={() => { if (!$selected.includes(option)) { $selected.push(option); $selected = $selected } ; goalPopoverOpen = false }}>
										<Milestone class="w-4 h-4 mr-2" />
										{option.name}
										<Check class={cn("ml-auto h-4 w-4", !$selected.includes(option) && "text-transparent")} />
									</Command.Item>
								{/each}
							</Command.Group>
							<Command.Separator />
							<Command.Group heading="Projects">
								{#each options.filter(option => option.type == "Project") as option (option.id)}
									<Command.Item value={option.type + option.id} onSelect={() => { $selected.push(option); selected = selected; goalPopoverOpen = false }}>
										<FolderClosed class="w-4 h-4 mr-2" />
										{option.name}
										<Check class={cn("ml-auto h-4 w-4", !$selected.includes(option) && "text-transparent")} />
									</Command.Item>
								{/each}
							</Command.Group>
							<Command.Separator />
							<Command.Group>
								{#each options.filter(option => option.type == "Task") as option (option.id)}
									<Command.Item value={option.type + option.id} onSelect={() => { $selected.push(option); $selected = $selected; goalPopoverOpen = false }}>
										<Pin class="w-4 h-4 mr-2" />
										{option.name}
										<Check class={cn("ml-auto h-4 w-4", !$selected.includes(option) && "text-transparent")} />
									</Command.Item>
								{/each}
							</Command.Group>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</div>
			<div class="grow border rounded-md overflow-y-scroll">
				<ol
					class="h-full"
					on:drop={dropped}
					on:dragover|preventDefault={draggedOver}
				>
					{#each $selected as goal, index (goal.type + goal.id)}
						<li
							class={cn("h-10 flex items-center pl-2 border-b border-background first:rounded-t-md text-primary-foreground",
								goal.type == "Milestone" && "bg-green-600 dark:bg-green-700",
								goal.type == "Project" && "bg-blue-600 dark:bg-blue-700",
								goal.type == "Task" && "bg-gray-800 dark:bg-gray-300",
							)}
							draggable="true"
							on:dragstart={() => dragStartIndex = index}
							on:dragenter={() => dragEnterIndex = index}
						>
							{#if goal.type == "Milestone"}
								<Milestone class="w-4 h-4 mr-2" />
							{:else if goal.type == "Project"}
								<FolderClosed class="w-4 h-4 mr-2" />
							{:else}
								<Pin class="w-4 h-4 mr-2" />
							{/if}
							<span>{index + 1}.</span>
							<span>{goal.name}</span>
							<Button size="icon" variant="ghost" class="ml-auto hover:text-red-500" on:click={() => $selected = $selected.filter(option => option != goal)}><X /></Button>
						</li>
					{/each}
				</ol>
			</div>
		</div>
		<div class="flex flex-col gap-2 grow h-full">
			<!--
			<div class="flex gap-2">
				<Input type="date" />
				<Button><Upload />Load Snapshot</Button>
				<Button><Save />Save Snapshot</Button>
			</div>
			-->
			<div class="grow">
				<ShipDateProbabilityChart milestones={chartData} />
			</div>
		</div>
	</main>
</div>
