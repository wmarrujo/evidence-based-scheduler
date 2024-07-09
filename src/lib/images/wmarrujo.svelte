<script lang="ts">
	import {mode} from "mode-watcher"
	import {cn} from "$lib/utils"
	
	let className = ""
	export {className as class}
</script>

<svg class={cn(className)} viewBox="0 0 128 128" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
	<title>William Marrujo</title>
	<g id="Logo" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
		<path d="M6,1 L6,125.558645 L50,80.8602326 L94,125.558645 L94,1 L78,1 L78,84.727069 L50,56.2826245 L22,84.727069 L22,1 L6,1 Z" id="W" stroke={$mode == "light" ? "#000000" : "#FFFFFF"} stroke-width="2"></path>
		<polygon id="Path-3" fill={$mode == "light" ? "#000000" : "#FFFFFF"} points="104 128 122 128 122 -2.84217094e-14 77 45.7142857 32 0 32 74.5701377 50 56.2715241 50 46.2609185 77 74 104 46.2609185"></polygon>
		<polygon id="Path-4" fill={$mode == "light" ? "#000000" : "#FFFFFF"} points="32 128 50 128 50 80.865453 32 99.1467356"></polygon>
	</g>
</svg>
