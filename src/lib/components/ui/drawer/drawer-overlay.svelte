<script lang="ts">
	import {Drawer as DrawerPrimitive} from "vaul-svelte"
	import {cn} from "$lib/utils.js"
	
	type $$Props = DrawerPrimitive.OverlayProps;
	
	export let el: $$Props["el"] = undefined
	let className: $$Props["class"] = undefined
	export {className as class}
</script>

<DrawerPrimitive.Overlay
	bind:el
	class={cn("fixed inset-0 z-50 bg-black/80", className)}
	{...$$restProps}
>
	<!-- FIXME: disabling the slot (it's not used anyway) so it doesn't say a warning every time. https://github.com/sveltejs/svelte/issues/6325 -->
	<!-- <slot /> -->
</DrawerPrimitive.Overlay>
