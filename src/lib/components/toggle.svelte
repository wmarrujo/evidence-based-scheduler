<script lang="ts">
	import {cn} from "$lib/utils"
	import {Check, X} from "lucide-svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let className = ""
	export {className as class}
	export let id: string | undefined = undefined
	export let name: string | undefined = undefined
	
	export let value: boolean | undefined = undefined
	
	export let colorized: boolean = false
</script>

<div
	class={cn("flex gap-1 rounded-md bg-secondary h-10 items-center justify-stretch shadow-inner p-1",
		colorized && value && "bg-green-100 dark:bg-green-950",
		colorized && !value && "bg-red-100 dark:bg-red-950",
		className,
	)}
	{...$$restProps}
>
	<button
		on:click={() => value = true}
		class={cn("grow bg-transparent rounded-md h-full flex items-center justify-center",
			value === true && "bg-background shadow",
		)}
	>
		<slot name="true">
			<Check class={cn("w-full h-full rounded-md", colorized && "text-green-500 dark:text-black hover:text-white hover:dark:text-black hover:bg-green-400 hover:dark:bg-green-700", colorized && value && "dark:text-green-700")} />
		</slot>
	</button>
	<button
		on:click={() => value = false}
		class={cn("grow bg-transparent rounded-md h-full flex items-center justify-center",
			value === false && "bg-background shadow",
		)}
	>
		<slot name="false">
			<X class={cn("w-full h-full rounded-md", colorized && "text-red-500 dark:text-black hover:text-white hover:dark:text-black hover:bg-red-400 hover:dark:bg-red-700", colorized && !value && "dark:text-white-700")} />
		</slot>
	</button>
	<input type="checkbox" hidden bind:checked={value} {id} {name} />
</div>
