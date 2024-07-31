<script lang="ts">
	import {cn} from "$lib/utils"
	import * as Popover from "$lib/components/ui/popover"
	import * as Command from "$lib/components/ui/command"
	import {buttonVariants} from "$lib/components/ui/button"
	import {onMount} from "svelte"
	import {db, liveQuery, type Resource, type ResourceId} from "$lib/db"
	import {Check, ChevronsUpDown} from "lucide-svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	// pull these out separately (they are passed in from the "{...attrs}" call) these get passed to the spent input element, so forms know what to pull from
	export let id: string | undefined = undefined // the form id
	export let name: string | undefined = undefined // the form name
	let className = ""
	export {className as class}
	export let placeholder: string = "Select Resource..."
	
	export let value: ResourceId | undefined = undefined // the id, to export to a form as if this was a single input element
	let resource: Resource | undefined = undefined // the actual resource
	function setResource(r: Resource | undefined) { resource = r } // pulled out to avoid reactive infinite loop (unset value if we don't get a valid resource)
	$: if (mounted && value) db.resources.get(value).then(setResource)
	
	let resources = liveQuery(() => db.resources.toArray())
	
	let mounted = false
	onMount(async () => mounted = true)
	
	let open = false
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		role="combobox"
		aria-expanded={open}
		{...$$restProps}
		class={cn(buttonVariants({variant: "outline"}), "justify-between pl-3 text-left font-normal", !resource && "text-muted-foreground", className)}
	>
		{#if resource}
			{resource?.name}
		{:else}
			<span class="text-muted-foreground">{placeholder}</span>
		{/if}
		<ChevronsUpDown class="hl-2 h-4 w-4" />
	</Popover.Trigger>
	<Popover.Content class="p-0 px-2 pt-2">
		<Command.Root>
			<Command.Input autofocus placeholder="Search..." class="h-9" />
			<Command.Empty>No resource found.</Command.Empty>
			<Command.Group>
				{#each $resources as option (option.id)}
					<Command.Item value={option.name} onSelect={() => { resource = option; value = option.id; open = false }}>
						{option.name}
						<Check class={cn("ml-auto h-4 w-4", option.id !== value && "text-transparent")} />
					</Command.Item>
				{/each}
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
<input type="number" hidden {value} {id} {name} />
