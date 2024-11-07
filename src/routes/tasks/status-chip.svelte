<script lang="ts">
	import {cn} from "$lib/utils"
	import {Minus, ArrowRight, Check} from "lucide-svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let {
		class: className = "",
		status,
	}: {
		class?: string
		status?: "planned" | "started" | "done"
	} = $props()
</script>

<div class={cn("flex rounded-sm h-[26px] pl-0.5 pr-[6px] items-center text-xs text-white",
	status == "planned" && "bg-gray-300 dark:bg-gray-600 text-foreground",
	status == "started" && "bg-blue-400 dark:bg-blue-600",
	status == "done" && "bg-green-500 dark:bg-green-700",
	className)
}>
	{#if status == "planned"}
		<Minus class="h-4" />PLANNED
	{:else if status == "started"}
		<ArrowRight class="h-4" />STARTED
	{:else if status == "done"}
		<Check class="h-4" />DONE
	{/if}
</div>
