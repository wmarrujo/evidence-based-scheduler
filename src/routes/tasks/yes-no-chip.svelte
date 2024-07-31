<script lang="ts">
	import {cn} from "$lib/utils"
	import {X, Check} from "lucide-svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let className = ""
	export {className as class}
	
	export let status: boolean
</script>

<div class={cn(className, "flex rounded-sm h-[26px] pl-0.5 pr-[6px] items-center text-xs text-white",
	!status && "bg-red-500 dark:bg-red-700",
	status && "bg-green-500 dark:bg-green-700")
}>
	{#if status}
		<Check class="h-4" />YES
	{:else}
		<X class="h-4" />NO
	{/if}
</div>
