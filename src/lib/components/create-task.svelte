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
	
	let className = ""
	export {className as class}
	const dispatch = createEventDispatcher()
	
	const schema = z.object({
		name: z.string().min(1, {message: "you must provide a name"}),
		description: z.string().optional(),
		doer: z.string().uuid().optional(),
		estimate: z.coerce.number().positive(),
		elapsed: z.coerce.number().nonnegative().default(0),
	})
	
	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		validators: zod(schema),
		async onUpdate({form}) { // handle submission
			if (!form.valid) return
			const id = await db.tasks.add({
				name: form.data.name,
				description: form.data.description == "" ? undefined : form.data.description,
				doer: undefined, // TODO
				originalEstimate: form.data.estimate,
				estimate: form.data.estimate,
				elapsed: form.data.elapsed,
				dependsOn: [], // TODO
			})
			dispatch("created", {id})
		},
	}), {form: data, enhance} = form
</script>

<form class={cn(className)} use:enhance>
	<Form.Field {form} name="name">
		<Form.Control let:attrs>
			<Form.Label>Name</Form.Label>
			<Input type="text" bind:value={$data.name} {...attrs} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="description">
		<Form.Control let:attrs>
			<Form.Label>Description</Form.Label>
			<Textarea bind:value={$data.description} {...attrs} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="estimate">
		<Form.Control let:attrs>
			<Form.Label>Estimate (Hours)</Form.Label>
			<Input type="number" bind:value={$data.estimate} step="0.1" {...attrs} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="elapsed">
		<Form.Control let:attrs>
			<Form.Label>Elapsed Time (Hours)</Form.Label>
			<Input type="number" bind:value={$data.elapsed} step="0.1" {...attrs} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<div class="flex w-full justify-center">
		<Button type="submit">Create</Button>
	</div>
</form>
