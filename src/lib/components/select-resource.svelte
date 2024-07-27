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
	
	export let initial: ResourceId | Resource | undefined = undefined // made available to the user so they can set an initial value
	let resource = typeof(initial) == "number" ? undefined : initial
	export let value: ResourceId | undefined = undefined // the id, to export to a form as if this was a single input element
	$: value = resource?.id
	
	let resources = liveQuery(() => db.resources.toArray())
	
	onMount(async () => {
		if (resource == undefined && typeof(initial) == "number") resource = await db.resources.get(initial) // set this now that we can do an await
	})
	
	let open = false
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		role="combobox"
		aria-expanded={open}
		{...$$restProps}
		class={cn(className, buttonVariants({variant: "outline"}), "justify-between pl-3 text-left font-normal", !resource && "text-muted-foreground")}
	>
		{#if resource}
			{resource?.name}
		{:else}
			<span class="text-muted-foreground">Select Resource</span>
		{/if}
		<ChevronsUpDown class="hl-2 h-4 w-4" />
	</Popover.Trigger>
	<Popover.Content class="p-0 px-2 pt-2">
		<Command.Root>
			<Command.Input autofocus placeholder="Search..." class="h-9" />
			<Command.Empty>No resource found.</Command.Empty>
			<Command.Group>
				{#each $resources as option (option.id)}
					<Command.Item value={option.name} onSelect={() => { resource = option; open = false }}>
						{option.name}
						<Check class={cn("ml-auto h-4 w-4", option.id !== value && "text-transparent")} />
					</Command.Item>
				{/each}
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
<input hidden value={resource?.id} {id} {name} />
