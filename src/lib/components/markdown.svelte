<script lang="ts">
	import {Carta, Markdown} from "carta-md"
	
	export let text = ""
	
	const carta = new Carta()
</script>

<div  class="prose dark:prose-invert">
	{#key text}
		<Markdown {carta} value={text} />
	{/key}
</div>
