<script lang="ts">
	import {Ellipsis} from "lucide-svelte"
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
	import {Button} from "$lib/components/ui/button"
</script>

<!-- TODO: turn this into a right-click contextmenu action list -->
<DropdownMenu.Root>
	<DropdownMenu.Trigger asChild let:builder>
		<Button size="icon" variant="ghost" builders={[builder]} class="relative h-8 w-8 p-0"><Ellipsis class="h-4 w-4" /></Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<!-- TODO: delete -->
		<DropdownMenu.Item>Delete</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<!-- TODO: attach to (show diagram) -->
		<DropdownMenu.Item>Attach To</DropdownMenu.Item>
		<!-- TODO: dependency of (show diagram) -->
		<DropdownMenu.Item>Dependency Of</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<!-- TODO: make new tag -->
		<DropdownMenu.Item>New Tag with Selection</DropdownMenu.Item>
		<!-- TODO: add to tag -->
		<DropdownMenu.Item>Add to Tag</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<!-- TODO: make new milestone -->
		<DropdownMenu.Item>New Milestone with Selection</DropdownMenu.Item>
		<!-- TODO: add to milestone -->
		<DropdownMenu.Item>Add to Milestone</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
