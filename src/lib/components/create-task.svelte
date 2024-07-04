<script lang="ts">
	import {cn} from "$lib/utils"
	import {z} from "zod"
	import {superForm, defaults} from "sveltekit-superforms"
	import {zod} from "sveltekit-superforms/adapters"
	import * as Form from "$lib/components/ui/form"
	import {Button} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import {Switch} from "$lib/components/ui/switch"
	import {Textarea} from "$lib/components/ui/textarea"
	import SelectResource from "$lib/components/select-resource.svelte"
	import {db, type Task} from "$lib/db"
	import {createEventDispatcher} from "svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let className = ""
	export {className as class}
	const dispatch = createEventDispatcher<{created: Task}>()
	
	const schema = z.object({
		name: z.string().min(1, {message: "you must provide a name"}),
		description: z.string().optional(),
		doer: z.coerce.number().optional(),
		estimate: z.coerce.number().positive(),
		spent: z.coerce.number().nonnegative().default(0),
		done: z.boolean().default(false),
		abandoned: z.boolean().default(false),
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
					original: form.data.estimate, // since this is a new task, the estimate is the original estimate
					estimate: form.data.estimate,
					spent: form.data.spent,
					done: form.data.done,
					abandoned: form.data.abandoned,
					dependsOn: [], // a new task starts with no dependencies, we add those with the graph view
				}
				const id = await db.tasks.add(task) // insert (and get the id it created)
				dispatch("created", {id, ...task}) // send the message, and return the task it created
			},
		}), {form: data, enhance} = form
</script>

<form class={cn(className, "grid grid-cols-2 gap-2")} use:enhance>
	<div class="grid grid-cols-2 gap-2 mt-2 content-start">
		<Form.Field {form} name="name" class="flex flex-col col-span-2">
			<Form.Control let:attrs>
				<Form.Label>Name</Form.Label>
				<Input type="text" bind:value={$data.name} {...attrs} placeholder="Do thing" />
			</Form.Control>
		</Form.Field>
		<Form.Field {form} name="doer" class="flex gap-2 col-span-2 space-y-0 items-center">
			<Form.Control let:attrs>
				<Form.Label>Doer</Form.Label>
				<SelectResource bind:value={$data.doer} {...attrs} class="grow" />
			</Form.Control>
		</Form.Field>
		<Form.Field {form} name="estimate" class="flex flex-col">
			<Form.Control let:attrs>
				<Form.Label>Estimate</Form.Label>
				<Input type="number" bind:value={$data.estimate} min="0" step="0.1" {...attrs} class="w-full" />
			</Form.Control>
		</Form.Field>
		<Form.Field {form} name="spent" class="flex flex-col" >
			<Form.Control let:attrs>
				<Form.Label>Spent</Form.Label>
				<Input type="number" bind:value={$data.spent} min="0" step="0.1" {...attrs} class="w-full" />
			</Form.Control>
		</Form.Field>
		<Form.Field {form} name="done" class="flex flex-col">
			<Form.Control let:attrs>
				<Form.Label class="mt-0">Done</Form.Label>
				<Switch bind:checked={$data.done} {...attrs} />
			</Form.Control>
		</Form.Field>
		<Form.Field {form} name="abandoned" class="flex flex-col">
			<Form.Control let:attrs>
				<Form.Label class="mt-0">Abandoned</Form.Label>
				<Switch bind:checked={$data.abandoned} {...attrs} />
			</Form.Control>
		</Form.Field>
	</div>
	<div class="h-full flex">
		<Form.Field {form} name="description" class="h-full w-full flex flex-col mt-2">
			<Form.Control let:attrs>
				<Form.Label>Description</Form.Label>
				<Textarea bind:value={$data.description} {...attrs} placeholder="this is what I mean..." class="grow" />
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>
	<div class="col-span-2 flex w-full justify-center mt-4">
		<Button type="submit">Create</Button>
	</div>
</form>
