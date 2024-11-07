<script lang="ts">
	import {cn} from "$lib/utils"
	import * as Popover from "$lib/components/ui/popover"
	import * as Command from "$lib/components/ui/command"
	import * as Dialog from "$lib/components/ui/dialog"
	import {buttonVariants} from "$lib/components/ui/button"
	import {tags, type Tag, type TagId} from "$lib/db"
	import {Plus} from "lucide-svelte"
	import CreateTag from "$lib/components/create-tag.svelte"
	import {type Snippet} from "svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let {
		children,
		class: className = "",
		unavailable,
		onselect = () => {},
	}: {
		children?: Snippet
		class?: string
		unavailable?: Array<TagId>
		onselect?: (tag: Tag) => void
	} = $props()
	
	let open = $state(false)
	let createTagDialogOpen = $state(false)
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		role="combobox"
		aria-expanded={open}
		class={cn(buttonVariants({variant: "outline"}), "justify-between pl-3 text-left font-normal", className)}
	>
		{@render children?.()}
	</Popover.Trigger>
	<Popover.Content class="p-0 px-2 pt-2">
		<Command.Root>
			<Command.Input autofocus placeholder="Search..." class="h-9" />
			<Command.Empty>No tag found.</Command.Empty>
			<Command.Group>
				{#each $tags.filter(t => !(unavailable ?? []).includes(t.id)) as option (option.id)}
					<Command.Item value={String(option.id)} onSelect={() => { onselect(option); open = false }}>
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
		<CreateTag oncreated={tag => { onselect(tag); createTagDialogOpen = false; open = false }} />
	</Dialog.Content>
</Dialog.Root>
