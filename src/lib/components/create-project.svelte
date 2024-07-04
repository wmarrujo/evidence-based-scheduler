<script lang="ts">
	import {cn} from "$lib/utils"
	import {z} from "zod"
	import {superForm, defaults} from "sveltekit-superforms"
	import {zod} from "sveltekit-superforms/adapters"
	import * as Form from "$lib/components/ui/form"
	import {Button} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import {Textarea} from "$lib/components/ui/textarea"
	import {db, type Project, type TaskId} from "$lib/db"
	import {createEventDispatcher} from "svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let className = ""
	export {className as class}
	const dispatch = createEventDispatcher<{created: Project}>()
	
	export let tasks: Array<TaskId> = []
	
	const schema = z.object({
		name: z.string().min(1, {message: "you must provide a name"}),
		description: z.string().optional(),
	})
	
	const form = superForm(defaults(zod(schema)), {
			SPA: true,
			validators: zod(schema),
			async onUpdate({form}) { // handle submission
				if (!form.valid) return
				const project = {
					name: form.data.name,
					description: form.data.description == "" ? undefined : form.data.description,
					tasks,
				}
				const id = await db.projects.add(project) // insert (and get the id it created)
				dispatch("created", {id, ...project}) // send the message, and return the project it created
			},
		}), {form: data, enhance} = form
</script>

<form class={cn(className)} use:enhance>
	<Form.Field {form} name="name">
		<Form.Control let:attrs>
			<Form.Label>Name</Form.Label>
			<Input type="text" bind:value={$data.name} {...attrs} placeholder="Big thing" />
		</Form.Control>
	</Form.Field>
	<Form.Field {form} name="description">
		<Form.Control let:attrs>
			<Form.Label>Description</Form.Label>
			<Textarea bind:value={$data.description} {...attrs} placeholder="this is what I mean..." />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<div class="flex w-full justify-center">
		<Button type="submit">Create</Button>
	</div>
</form>
