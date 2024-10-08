<script lang="ts">
	import {cn, JSONSafeParseToArray} from "$lib/utils"
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {resources, tags, tasks, milestones, tagExpansions, milestonesById, tagsById, tasksById, populatedMilestonesById, populatedTagsById, populatedTasksById} from "$lib/db"
	import type {MilestoneId, TagId, TaskId, ResourceId, Velocity} from "$lib/db"
	import {Button, buttonVariants} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import {Plus, Check, X, Milestone, Tag, Pin, Upload, Save} from "lucide-svelte"
	import {simulate} from "$lib/simulation"
	import ShipDateProbabilityChart from "$lib/components/ship-date-probability-chart.svelte"
	import * as Popover from "$lib/components/ui/popover"
	import * as Command from "$lib/components/ui/command"
	import {writable} from "svelte/store"
	import {browser} from "$app/environment"
	
	////////////////////////////////////////////////////////////////////////////////
	
	$: milestoneRequirementsById = $milestones.reduce((acc, milestone) => acc.set(milestone.id, milestone.requirements), new Map<MilestoneId, Array<TaskId>>())
	$: tasksByTag = $tasks.reduce((acc, task) => {
		const tags = task.tags.flatMap(tag => [...$tagExpansions.get(tag) ?? []])
		return tags.reduce((acc, tag) => acc.set(tag, [task.id, ...(acc.get(tag) ?? [])]), acc)
	}, new Map<TagId, Array<TaskId>>())
	
	$: options = [
		...$milestones.map(milestone => ({type: "Milestone", id: milestone.id, name: milestone.name})),
		...$tags.map(tag => ({type: "Tag", id: tag.id, name: tag.name})),
		...$tasks.map(task => ({type: "Task", id: task.id, name: task.name})),
	] as Array<Goal>
	
	let selected = writable<Array<Goal>>([]) // start out empty on page load (will be filled later, when certain conditions are met)
	selected.subscribe(value => { if (browser && $populatedMilestonesById && $populatedTagsById && $populatedTasksById) localStorage.setItem("selected-goals", JSON.stringify(value)) }) // NOTE: only write when we know we've got the full set
	$: if (browser && $populatedMilestonesById && $populatedTagsById && $populatedTasksById) { // once we're in the browser and have all the references loaded
		$selected = (JSONSafeParseToArray(localStorage.getItem("selected-goals")) as Array<Goal>) // then we can set selected to whatever was in our cache
			.filter(goal => ({"Milestone": $milestonesById, "Tag": $tagsById, "Task": $tasksById}[goal?.type]?.has(goal?.id))) // filtering out everything that shouldn't be there anymore
	}
	
	let start: Date = new Date()
	let simulations: number = 101
	
	////////////////////////////////////////////////////////////////////////////////
	
	type Goal = {
		type: "Milestone" | "Tag" | "Task"
		id: MilestoneId | TagId | TaskId
		name: string
	}
	
	function getRequirements(goal: Goal): Array<TaskId> {
		if (goal.type == "Milestone") return milestoneRequirementsById.get(goal.id) ?? []
		else if (goal.type == "Tag") return tasksByTag.get(goal.id) ?? []
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
									<Command.Item value={option.type + option.id} onSelect={() => { if (!$selected.includes(option)) { $selected.push(option); $selected = $selected }; goalPopoverOpen = false }}>
										<Milestone class="w-4 h-4 mr-2" />
										{option.name}
										<Check class={cn("ml-auto h-4 w-4", !$selected.includes(option) && "text-transparent")} />
									</Command.Item>
								{/each}
							</Command.Group>
							<Command.Separator />
							<Command.Group heading="Tags">
								{#each options.filter(option => option.type == "Tag") as option (option.id)}
									<Command.Item value={option.type + option.id} onSelect={() => { if (!$selected.includes(option)) { $selected.push(option); $selected = $selected }; goalPopoverOpen = false }}>
										<Tag class="w-4 h-4 mr-2" />
										{option.name}
										<Check class={cn("ml-auto h-4 w-4", !$selected.includes(option) && "text-transparent")} />
									</Command.Item>
								{/each}
							</Command.Group>
							<Command.Separator />
							<Command.Group heading="Tasks">
								{#each options.filter(option => option.type == "Task") as option (option.id)}
									<Command.Item value={option.type + option.id} onSelect={() => { if (!$selected.includes(option)) { $selected.push(option); $selected = $selected }; goalPopoverOpen = false }}>
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
								goal.type == "Tag" && "bg-blue-600 dark:bg-blue-700",
								goal.type == "Task" && "bg-gray-800 dark:bg-gray-300",
							)}
							draggable="true"
							on:dragstart={() => dragStartIndex = index}
							on:dragenter={() => dragEnterIndex = index}
						>
							{#if goal.type == "Milestone"}
								<Milestone class="w-4 h-4 mr-2" />
							{:else if goal.type == "Tag"}
								<Tag class="w-4 h-4 mr-2" />
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
