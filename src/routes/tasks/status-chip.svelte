<script lang="ts">
	import {cn} from "$lib/utils"
	import {Minus, ArrowRight, Check} from "lucide-svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let className = ""
	export {className as class}
	
	enum Status {
		Planned = 0,
		Started = 1,
		Done = 2,
	}
	
	export let status: Status
</script>

<div class={cn(className, "flex rounded-sm h-[26px] pl-0.5 pr-[6px] items-center text-xs",
	status == Status.Planned && "bg-gray-300 dark:bg-gray-600",
	status == Status.Started && "bg-blue-400 dark:bg-blue-600",
	status == Status.Done && "bg-green-500 dark:bg-green-700")
}>
	{#if status == Status.Planned}
		<Minus class="h-4" />PLANNED
	{:else if status == Status.Started}
		<ArrowRight class="h-4" />STARTED
	{:else if status == Status.Done}
		<Check class="h-4" />DONE
	{/if}
</div>
