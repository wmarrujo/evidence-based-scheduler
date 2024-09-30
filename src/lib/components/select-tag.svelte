<script lang="ts">
	import {cn} from "$lib/utils"
	import * as Popover from "$lib/components/ui/popover"
	import * as Command from "$lib/components/ui/command"
	import * as Dialog from "$lib/components/ui/dialog"
	import {buttonVariants} from "$lib/components/ui/button"
	import {tags, type Tag, type TagId} from "$lib/db"
	import {Plus} from "lucide-svelte"
	import CreateTag from "$lib/components/create-tag.svelte"
	import {createEventDispatcher} from "svelte"
	
	////////////////////////////////////////////////////////////////////////////////
		
	let className = ""
	export {className as class}
	
	export let unavailable: Array<TagId> | undefined
	
	const dispatch = createEventDispatcher<{select: Tag}>()
	
	let open = false
	let createTagDialogOpen = false
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		role="combobox"
		aria-expanded={open}
		{...$$restProps}
		class={cn(buttonVariants({variant: "outline"}), "justify-between pl-3 text-left font-normal", className)}
	>
		<slot />
	</Popover.Trigger>
	<Popover.Content class="p-0 px-2 pt-2">
		<Command.Root>
			<Command.Input autofocus placeholder="Search..." class="h-9" />
			<Command.Empty>No tag found.</Command.Empty>
			<Command.Group>
				{#each $tags.filter(t => !(unavailable ?? []).includes(t.id)) as option (option.id)}
					<Command.Item value={option.id} onSelect={() => { dispatch("select", option); open = false }}>
						{option.name}
					</Command.Item>
				{:else}
					<span class="text-muted-foreground text-sm">No tags</span>
				{/each}
			</Command.Group>
			<Command.Separator />
			<Command.Group>
				<Command.Item onSelect={() => createTagDialogOpen = true}><Plus class="h-4" />New Tag</Command.Item>
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>

<Dialog.Root bind:open={createTagDialogOpen}>
	<Dialog.Content class="min-w-[90%] max-h-[90vh] h-[90vh] pt-12">
		<CreateTag on:created={event => { dispatch("select", event.detail); createTagDialogOpen = false; open = false }} />
	</Dialog.Content>
</Dialog.Root>
