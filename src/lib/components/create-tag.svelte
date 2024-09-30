<script lang="ts">
	import {cn} from "$lib/utils"
	import {z} from "zod"
	import {superForm, defaults} from "sveltekit-superforms"
	import {zod} from "sveltekit-superforms/adapters"
	import * as Form from "$lib/components/ui/form"
	import {Button} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import {Textarea} from "$lib/components/ui/textarea"
	import {db} from "$lib/db"
	import {createEventDispatcher} from "svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let className = ""
	export {className as class}
	const dispatch = createEventDispatcher()
	
	const schema = z.object({
		name: z.string().min(1, {message: "you must provide a name"}),
		id: z.string().min(1, {message: "you must provide an id"}),
		description: z.string().default(""),
		tags: z.array(z.string()),
	})
	
	const form = superForm(defaults(zod(schema)), {
			SPA: true,
			validators: zod(schema),
			async onUpdate({form}) { // handle submission
				if (!form.valid) return
				const tag = {
					id: form.data.id,
					name: form.data.name,
					description: form.data.description,
					tags: form.data.tags,
				}
				await db.tags.add(tag)
				dispatch("created", tag)
			},
		}), {form: data, enhance} = form
	
	function nameChanged(event: InputEvent) {
		if (!form.isTainted("id")) {
			let kebab = (event.target! as HTMLInputElement).value.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[\s_]+/g, "-").toLowerCase()
			data.update(f => { f.id = kebab; return f }, {taint: false})
		}
	}
	
	// TODO: make sure to check if there are infinite loops in the tags that we add, don't allow them
</script>

<form class={cn(className)} use:enhance>
	<Form.Field {form} name="name">
		<Form.Control let:attrs>
			<Input type="text" bind:value={$data.name} on:input={nameChanged} placeholder="Tag Name" class="text-2xl h-14"  {...attrs} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="id">
		<Form.Control let:attrs>
			<Input type="text" bind:value={$data.id} placeholder="Identifier" {...attrs} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="description">
		<Form.Control let:attrs>
			<Textarea bind:value={$data.description} placeholder="Description" {...attrs} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<div class="flex w-full justify-center">
		<Button type="submit">Create</Button>
	</div>
</form>
