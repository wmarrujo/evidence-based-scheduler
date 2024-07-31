<script lang="ts">
	import type {HTMLInputAttributes} from "svelte/elements"
	import {cn} from "$lib/utils.js"
	import type {InputEvents} from "./index.js"
	
	type $$Props = HTMLInputAttributes
	type $$Events = InputEvents
	
	let className: $$Props["class"] = undefined
	export {className as class}
	export let value: $$Props["value"] = undefined
	export let type: $$Props["type"] = undefined // NOTE: the `type="number"` & `type="file"` division below forces svelte to compile them differently, which means the number input's value will actually be of type number or file instead of being a string
	
	let element: HTMLInputElement
	export function click() { element.click() } // let the outside world click it programmatically (useful for the file input to show the file dialog)
</script>

{#if type === "number"}
	<input
		class={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:bg-secondary disabled:cursor-not-allowed disabled:opacity-50", className)}
		bind:this={element}
		bind:value
		type="number"
		on:blur on:change on:click on:focus on:focusin on:focusout on:keydown on:keypress on:keyup on:mouseover on:mouseenter on:mouseleave on:paste on:input
		{...$$restProps}
	/>
{:else if type === "file"}
	<input
		class={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:bg-secondary disabled:cursor-not-allowed disabled:opacity-50", className)}
		bind:this={element}
		bind:value
		type="file"
		on:blur on:change on:click on:focus on:focusin on:focusout on:keydown on:keypress on:keyup on:mouseover on:mouseenter on:mouseleave on:paste on:input
		{...$$restProps}
	/>
{:else}
	<input
		class={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:bg-secondary disabled:cursor-not-allowed disabled:opacity-50", className)}
		bind:this={element}
		bind:value
		on:blur on:change on:click on:focus on:focusin on:focusout on:keydown on:keypress on:keyup on:mouseover on:mouseenter on:mouseleave on:paste on:input
		{...$$restProps}
	/>
{/if}
