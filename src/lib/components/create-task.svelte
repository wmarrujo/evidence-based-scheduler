<script lang="ts">
	import {cn} from "$lib/utils"
	import {z} from "zod"
	import {superForm, defaults} from "sveltekit-superforms"
	import {zod} from "sveltekit-superforms/adapters"
	import * as Form from "$lib/components/ui/form"
	import {Button} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import {Textarea} from "$lib/components/ui/textarea"
	import SelectResource from "$lib/components/select-resource.svelte"
	import {db} from "$lib/db"
	import {createEventDispatcher} from "svelte"
	
	let className = ""
	export {className as class}
	const dispatch = createEventDispatcher()
	
	const schema = z.object({
		name: z.string().min(1, {message: "you must provide a name"}),
		description: z.string().optional(),
		doer: z.coerce.number().optional(),
		estimate: z.coerce.number().positive(),
		actual: z.coerce.number().nonnegative().default(0),
	})
	
	const form = superForm(defaults(zod(schema)), {
		SPA: true,
		validators: zod(schema),
		async onUpdate({form}) { // handle submission
			if (!form.valid) return
			const task = {
				name: form.data.name,
				description: form.data.description == "" ? undefined : form.data.description,
				doer: form.data.doer,
				originalEstimate: form.data.estimate, // since this is a new task, the estimate is the original estimate
				estimate: form.data.estimate,
				actual: form.data.actual,
				dependsOn: [], // a new task starts with no dependencies, we add those with the graph view
			}
			await db.tasks.add(task)
			dispatch("created", task)
		},
	}), {form: data, enhance} = form
</script>

<form class={cn(className)} use:enhance>
	<Form.Field {form} name="name">
		<Form.Control let:attrs>
			<Form.Label>Name</Form.Label>
			<Input type="text" bind:value={$data.name} {...attrs} placeholder="Do thing" />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="description">
		<Form.Control let:attrs>
			<Form.Label>Description</Form.Label>
			<Textarea bind:value={$data.description} {...attrs} placeholder="this is what I mean..." />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="doer">
		<Form.Control let:attrs>
			<Form.Label>Doer</Form.Label>
			<SelectResource bind:value={$data.doer} {...attrs} class="w-full" />
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
	<Form.Field {form} name="actual">
		<Form.Control let:attrs>
			<Form.Label>Actual Time (Hours)</Form.Label>
			<Input type="number" bind:value={$data.actual} step="0.1" {...attrs} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<div class="flex w-full justify-center">
		<Button type="submit">Create</Button>
	</div>
</form>
