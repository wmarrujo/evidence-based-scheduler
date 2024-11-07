<script lang="ts">
	import {cn} from "$lib/utils"
	import {Check, X} from "lucide-svelte"
	import {type Snippet} from "svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let {
		class: className = "",
		id,
		name,
		value = $bindable(),
		colorized = false,
		yes,
		no,
	}: {
		class?: string
		id?: string
		name?: string
		value?: boolean
		colorized?: boolean
		yes?: Snippet
		no?: Snippet
	} = $props()
</script>

<div
	class={cn("flex gap-1 rounded-md bg-secondary h-10 items-center justify-stretch shadow-inner p-1",
		colorized && value && "bg-green-100 dark:bg-green-950",
		colorized && !value && "bg-red-100 dark:bg-red-950",
		className,
	)}
>
	<button
		onclick={event => { event.preventDefault(); value = true }}
		class={cn("grow bg-transparent rounded-md h-full flex items-center justify-center",
			value === true && "bg-background shadow",
		)}
	>
		{#if yes}
			{@render yes()}
		{:else}
			<Check class={cn("w-full h-full rounded-md", colorized && "text-green-500 dark:text-black hover:text-white hover:dark:text-black hover:bg-green-400 hover:dark:bg-green-700", colorized && value && "dark:text-green-700")} />
		{/if}
	</button>
	<button
		onclick={event => { event.preventDefault(); value = false }}
		class={cn("grow bg-transparent rounded-md h-full flex items-center justify-center",
			value === false && "bg-background shadow",
		)}
	>
		{#if no}
			{@render no()}
		{:else}
			<X class={cn("w-full h-full rounded-md", colorized && "text-red-500 dark:text-black hover:text-white hover:dark:text-black hover:bg-red-400 hover:dark:bg-red-700", colorized && !value && "dark:text-white-700")} />
		{/if}
	</button>
	<input type="checkbox" hidden bind:checked={value} {id} {name} />
</div>
