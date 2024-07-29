<script lang="ts">
	import {cn} from "$lib/utils"
	import {Check, X} from "lucide-svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let className = ""
	export {className as class}
	
	export let value: boolean | undefined = undefined
</script>

<div class={cn(className, "flex gap-1 rounded-md bg-secondary h-10 items-center justify-stretch shadow-inner p-1")}>
	<div class={cn("grow bg-transparent rounded-md h-full", value === true && "bg-background shadow")}>
		<slot name="true">
			<Check />
		</slot>
	</div>
	<div class={cn("grow bg-transparent rounded-md h-full", value === false && "bg-background shadow")}>
		<slot name="false">
			<X />
		</slot>
	</div>
</div>
