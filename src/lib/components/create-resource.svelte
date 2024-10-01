<script lang="ts">
	import {cn} from "$lib/utils"
	import {z} from "zod"
	import {superForm, defaults} from "sveltekit-superforms"
	import {zod} from "sveltekit-superforms/adapters"
	import * as Form from "$lib/components/ui/form"
	import {Button} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import {db, type Resource} from "$lib/db"
	import {createEventDispatcher} from "svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let className = ""
	export {className as class}
	const dispatch = createEventDispatcher<{created: Resource}>()
	
	const schema = z.object({
		name: z.string().min(1, {message: "you must provide a name"}),
	})
	
	const form = superForm(defaults(zod(schema)), {
			SPA: true,
			validators: zod(schema),
			async onUpdate({form}) { // handle submission
				if (!form.valid) return
				const resource = {
					name: form.data.name,
					velocities: [],
				}
				const id = await db.resources.add(resource)
				dispatch("created", {id, ...resource})
			},
		}), {form: data, enhance} = form
</script>

<form class={cn(className)} use:enhance>
	<Form.Field {form} name="name">
		<Form.Control let:attrs>
			<Input type="text" bind:value={$data.name} placeholder="Resource Name" class="text-2xl h-14"  {...attrs} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<div class="flex w-full justify-center">
		<Button type="submit">Create</Button>
	</div>
</form>
