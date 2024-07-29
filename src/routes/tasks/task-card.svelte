<script lang="ts">
	import * as Card from "$lib/components/ui/card"
	import type {Task} from "$lib/db"
	import {SquareUserRound, AlarmClock, Timer, SquareCheck} from "lucide-svelte"
	import SelectResource from "$lib/components/select-resource.svelte"
	import {Input} from "$lib/components/ui/input"
	import Toggle from "$lib/components/toggle.svelte"
	
	export let task: Task
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{task.name}</Card.Title>
	</Card.Header>
	<Card.Content>
		<div class="flex gap-2">
			<div class="flex flex-col flex-1 gap-2">
				<div class="flex"><SquareUserRound class="mr-1" />Doer</div>
				<SelectResource initial={task.doer} class="w-full" />
			</div>
			<div class="flex flex-col flex-1 gap-2">
				<div class="flex"><AlarmClock class="mr-1" />Estimate</div>
				<div class="flex items-center"><Input type="number" value={task.estimate} min={0} step={0.1} class="text-right" />&nbsp;hour{task.estimate == 1 ? " " : "s"}</div>
			</div>
			<div class="flex flex-col flex-1 gap-2">
				<div class="flex"><Timer class="mr-1" />Spent</div>
				<div class="flex items-center"><Input type="number" value={task.spent} min={0} step={0.1} class="text-right" />&nbsp;hour{task.spent == 1 ? " " : "s"}</div>
			</div>
			<div class="flex flex-col flex-1 gap-2">
				<div class="flex"><SquareCheck class="mr-1" />Done</div>
				<Toggle bind:value={task.done} />
			</div>
		</div>
		<!-- TODO: markdown description -->
	</Card.Content>
	<Card.Footer>
		<!-- TODO: actions -->
	</Card.Footer>
</Card.Root>
