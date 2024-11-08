<script lang="ts">
	import {cn, JSONSafeParseToArray} from "$lib/utils"
	import MenuBar from "$lib/components/menu-bar.svelte"
	import {resources, tags, tasks, milestones, tagExpansions, milestonesById, tagsById, tasksById, populatedMilestonesById, populatedTagsById, populatedTasksById} from "$lib/db"
	import type {MilestoneId, TagId, TaskId, ResourceId, Velocity} from "$lib/db"
	import {Button, buttonVariants} from "$lib/components/ui/button"
	import {Plus, X, Milestone, Tag, Pin} from "lucide-svelte"
	import {simulate} from "$lib/simulation"
	import ShipDateProbabilityChart from "$lib/components/ship-date-probability-chart.svelte"
	import * as Popover from "$lib/components/ui/popover"
	import * as Command from "$lib/components/ui/command"
	import {browser} from "$app/environment"
	import {Switch} from "$lib/components/ui/switch"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let milestoneRequirementsById = $derived($milestones.reduce((acc, milestone) => acc.set(milestone.id, milestone.requirements), new Map<MilestoneId, Array<TaskId>>()))
	let tasksByTag = $derived($tasks.reduce((acc, task) => {
		const tags = task.tags.flatMap(tag => [...$tagExpansions.get(tag) ?? []])
		return tags.reduce((acc, tag) => acc.set(tag, [task.id, ...(acc.get(tag) ?? [])]), acc)
	}, new Map<TagId, Array<TaskId>>()))
	
	let options = $derived({
		milestones: $milestones.map(milestone => ({type: "Milestone", id: milestone.id, name: milestone.name} as Goal)),
		tags: $tags.map(tag => ({type: "Tag", id: tag.id, name: tag.name} as Goal)),
		tasks: $tasks.map(task => ({type: "Task", id: task.id, name: task.name} as Goal)),
	})
	
	let selected: Array<Goal> = $state([]) // start out empty on page load (will be filled later, when certain conditions are met)
	$effect(() => { if (browser && $populatedMilestonesById && $populatedTagsById && $populatedTasksById) localStorage.setItem("selected-goals", JSON.stringify(selected)) }) // NOTE: only write when we know we've got the full set
	$effect(() => { if (browser && $populatedMilestonesById && $populatedTagsById && $populatedTasksById) { // once we're in the browser and have all the references loaded
		selected = (JSONSafeParseToArray(localStorage.getItem("selected-goals")) as Array<Goal>) // then we can set selected to whatever was in our cache
			.filter(goal => ({"Milestone": $milestonesById, "Tag": $tagsById, "Task": $tasksById}[goal?.type]?.has(goal?.id))) // filtering out everything that shouldn't be there anymore
	}})
	
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
	
	let velocitiesByResource = $derived($resources.reduce((acc, resource) => acc.set(resource.id, resource?.velocities ?? []), new Map<ResourceId, Array<Velocity>>()))
	
	let chartData = $state(new Map<Goal, Array<Date>>())
	$effect(() => { if (0 < selected.length && 0 < $tasks.length && 0 < $resources.length) { // if we are ready to run a simulation
		// TODO: add an option to run the simulation taking into account the schedule or not
		const results = simulate(selected.map(getRequirements), start, simulations, $tasks, velocitiesByResource)
		chartData = new Map(selected.map((goal, i) => [goal, results[i]]))
	} else {
		chartData = new Map<Goal, Array<Date>>()
	}})
	
	let goalPopoverOpen = $state(false)
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
		const draggedItem = selected[dragStartIndex!]
		const newSelected = [...selected]
		newSelected.splice(dragStartIndex!, 1)
		newSelected.splice(dropIndex!, 0, draggedItem)
		selected = newSelected
	}
	
	let showStart = $state(false)
	let showHours = $state(true) // FIXME: when schedules are implemented, switch this default to be false (by date)
</script>

<div class="flex flex-col h-screen">
	<MenuBar>
		<!-- TODO: make a way to save the priorities we have set -->
		<div class="border rounded-lg p-2 flex items-center gap-2">
			Show Start
			<Switch bind:checked={showStart} />
		</div>
		<div class="border rounded-lg p-2 flex items-center gap-2">
			Dates
			<Switch bind:checked={showHours} />
			Hours
		</div>
	</MenuBar>
	<main class="grow flex gap-2 p-2 h-full">
		<div class="flex flex-col gap-2 min-w-72 h-full">
			<div class="flex gap-2 justify-between items-center">
				<span>Priorities</span>
				<Popover.Root bind:open={goalPopoverOpen}>
					<Popover.Trigger
						role="combobox"
						aria-expanded={goalPopoverOpen}
						class={cn(buttonVariants({variant: "outline"}), "justify-between pl-3 text-left font-normal")}
					>
						<Plus />Add
					</Popover.Trigger>
					<Popover.Content class="p-0 px-2 pt-2 max-h-96">
						<Command.Root>
							<Command.Input placeholder="Search..." autofocus class="h-9" />
							<Command.List>
								<Command.Empty>No resource found.</Command.Empty>
								<Command.Group heading="Milestones">
									{#each options.milestones as option (option.id)}
										<Command.Item value={option.name} onSelect={() => { selected.push(option); goalPopoverOpen = false }} disabled={selected.map(goal => goal.id).includes(option.id)}>
											<Milestone class="w-4 h-4 mr-2" />
											{option.name}
										</Command.Item>
									{/each}
								</Command.Group>
								<Command.Separator />
								<Command.Group heading="Tags">
									{#each options.tags as option (option.id)}
										<Command.Item value={option.name} onSelect={() => { selected.push(option); goalPopoverOpen = false }} disabled={selected.map(goal => goal.id).includes(option.id)}>
											<Tag class="w-4 h-4 mr-2" />
											{option.name}
										</Command.Item>
									{/each}
								</Command.Group>
								<Command.Separator />
								<Command.Group heading="Tasks">
									{#each options.tasks as option (option.id)}
										<Command.Item value={option.name} onSelect={() => { selected.push(option); goalPopoverOpen = false }} disabled={selected.map(goal => goal.id).includes(option.id)}>
											<Pin class="w-4 h-4 mr-2" />
											{option.name}
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</div>
			<div class="grow border rounded-md overflow-y-scroll">
				<ol
					class="h-full"
					ondrop={dropped}
					ondragover={event => { event.preventDefault(); draggedOver(event) }}
				>
					{#each selected as goal, index (goal.type + goal.id)}
						<li
							class={cn("h-10 flex items-center pl-2 border-b border-background first:rounded-t-md text-primary-foreground",
								goal.type == "Milestone" && "bg-green-600 dark:bg-green-700",
								goal.type == "Tag" && "bg-blue-600 dark:bg-blue-700",
								goal.type == "Task" && "bg-gray-800 dark:bg-gray-300",
							)}
							draggable="true"
							ondragstart={() => dragStartIndex = index}
							ondragenter={() => dragEnterIndex = index}
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
							<Button size="icon" variant="ghost" class="ml-auto hover:text-red-500" onclick={() => selected = selected.filter(option => option != goal)}><X /></Button>
						</li>
					{/each}
				</ol>
			</div>
		</div>
		<div class="flex flex-col gap-2 grow h-full">
			<div class="grow">
				<ShipDateProbabilityChart milestones={chartData} {start} {showHours} {showStart} />
			</div>
		</div>
	</main>
</div>
