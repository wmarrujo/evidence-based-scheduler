<script lang="ts">
	import {Checkbox} from "$lib/components/ui/checkbox"
	import type {Writable} from "svelte/store"
	
	export let checked: Writable<boolean>
	
	export let preventDefault: boolean = false// click prevented here because we want the table row to register the click and registering it here will double count it
</script>

<Checkbox bind:checked={$checked} on:click={event => { if (preventDefault) event.preventDefault() }} />
