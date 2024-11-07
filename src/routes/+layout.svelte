<script lang="ts">
	import "../app.pcss"
	import {ModeWatcher} from "mode-watcher"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let {children} = $props()
</script>

<ModeWatcher />
{@render children?.()}
