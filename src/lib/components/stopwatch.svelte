<script lang="ts">
	import {Play, Pause} from "lucide-svelte"
	import {Button} from "$lib/components/ui/button"
	import stopwatch from "$lib/stopwatch"
	
	let spent = 0
	$: spent = $stopwatch.time ?? 0
</script>

<div class="flex items-center gap-2" title={$stopwatch.task?.name ?? ""}>
	<!-- TODO: make better hover of name and information than the title tag -->
	{#if $stopwatch.task}
		{#if $stopwatch.running}
			<Button on:click={() => stopwatch.pause()} variant="outline" class="aspect-square p-2">
				<Pause />
			</Button>
		{:else}
			<Button on:click={() => stopwatch.resume()} variant="outline" class="aspect-square p-2">
				<Play />
			</Button>
		{/if}
		<span class="text-3xl font-mono">
			{String(Math.floor(spent)).padStart(2, "0")}:{String(Math.floor(spent * 60 % 60)).padStart(2, "0")}:{String(Math.floor(spent * 60 * 60 % 60)).padStart(2, "0")}
		</span>
	{/if}
</div>
