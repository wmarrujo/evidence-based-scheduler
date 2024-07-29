<script lang="ts">
	import * as Card from "$lib/components/ui/card"
	import type {Task} from "$lib/db"
	
	export let task: Task
	
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{task.name}</Card.Title>
	</Card.Header>
	<Card.Content>
		
	</Card.Content>
</Card.Root>
