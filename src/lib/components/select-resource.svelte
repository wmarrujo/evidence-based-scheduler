<script lang="ts">
	import {cn} from "$lib/utils"
	import * as Popover from "$lib/components/ui/popover"
	import * as Command from "$lib/components/ui/command"
	import * as Dialog from "$lib/components/ui/dialog"
	import {buttonVariants} from "$lib/components/ui/button"
	import {onMount} from "svelte"
	import {db, resources, type Resource, type ResourceId} from "$lib/db"
	import {Check, ChevronsUpDown} from "lucide-svelte"
	import {Plus} from "lucide-svelte"
	import CreateResource from "$lib/components/create-resource.svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let {
		id,
		name,
		class: className = "",
		placeholder = "Select Resource...",
		value = $bindable(), // the id, to export to a form as if this was a single input element
	}: {
		id?: string
		name?: string
		class?: string
		placeholder?: string
		value?: ResourceId | undefined
	} = $props()
	
	let resource: Resource | undefined = $state(undefined) // the actual resource
	function setResource(r: Resource | undefined) { resource = r } // pulled out to avoid reactive infinite loop (unset value if we don't get a valid resource)
	$effect(() => { if (mounted && value) db.resources.get(value).then(setResource) })
	
	let mounted = false
	onMount(async () => mounted = true)
	
	let open = $state(false)
	
	let createResourceDialogOpen = $state(false)
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		role="combobox"
		aria-expanded={open}
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
					<Command.Item value={String(option.id)} onSelect={() => { resource = option; value = option.id; open = false }}>
						{option.name}
						<Check class={cn("ml-auto h-4 w-4", option.id !== value && "text-transparent")} />
					</Command.Item>
				{:else}
					<span class="text-muted-foreground text-sm">No resources</span>
				{/each}
			</Command.Group>
			<Command.Separator />
			<Command.Group>
				<Command.Item onSelect={() => createResourceDialogOpen = true}><Plus class="h-4" />New Resource</Command.Item>
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
<input type="number" hidden {value} {id} {name} />

<Dialog.Root bind:open={createResourceDialogOpen}>
	<Dialog.Content class="min-w-[90%] max-h-[90vh] h-[90vh] pt-12">
		<CreateResource oncreated={r => { resource = r; value = r.id; createResourceDialogOpen = false; open = false }} />
	</Dialog.Content>
</Dialog.Root>
