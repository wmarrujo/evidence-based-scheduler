<script lang="ts">
	import {cn} from "$lib/utils"
	import {z} from "zod"
	import {superForm, defaults} from "sveltekit-superforms"
	import {zod} from "sveltekit-superforms/adapters"
	import * as Form from "$lib/components/ui/form"
	import {Button} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import SelectResource from "$lib/components/select-resource.svelte"
	import {db, type Task} from "$lib/db"
	import {createEventDispatcher} from "svelte"
	import {Carta, MarkdownEditor} from "carta-md"
	import Toggle from "$lib/components/toggle.svelte"
	import {mode} from "mode-watcher"
	import "$lib/styles/carta.pcss"
	import {Check, Minus} from "lucide-svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let className = ""
	export {className as class}
	
	export let task: Task | undefined = undefined
	
	const dispatch = createEventDispatcher<{saved: Task}>()
	
	const schema = z.object({
		name: z.string().min(1, {message: "you must provide a name"}),
		description: z.string(),
		// @ts-expect-error the number default is 0, which is a valid task id that we don't want to select by default
		doer: z.number().default(undefined),
		estimate: z.number().positive().default(0),
		spent: z.number().nonnegative().default(0),
		done: z.boolean().default(false),
	})
	
	const initialData: z.infer<typeof schema> | undefined = task ? {
		name: task.name,
		description: task.description,
		doer: task.doer,
		estimate: task.estimate,
		spent: task.spent,
		done: task.done,
	} : undefined
	
	const form =
		superForm(initialData ? defaults(initialData, zod(schema)) : defaults(zod(schema)), {
			SPA: true,
			validators: zod(schema),
			async onUpdate({form}) { // handle submission
				if (!form.valid) return
				if (task) { // if we are editing an existing task
					const updates = {
						name: form.data.name,
						description: form.data.description ?? "",
						doer: form.data.doer,
						estimate: form.data.estimate,
						spent: form.data.spent,
						done: form.data.done,
					}
					await db.tasks.update(task!.id, updates) // update the task with the updates from the form
					dispatch("saved", {...task!, ...updates}) // send the message, and return the task it edited
				} else { // if we are making a new task
					const id = await db.tasks.add({...form.data, dependsOn: []})
					dispatch("saved", {id, ...form.data, dependsOn: []}) // send the message, and return the task it edited
				}
			},
		}), {form: data, enhance} = form
	
		const carta = new Carta({
			sanitizer: false,
			theme: $mode == "light" ? "github-light" : "github-dark",
		})
</script>

<form class={cn(className, "flex gap-4")} use:enhance>
	<div class="flex flex-col flex-1 gap-4 overflow-y-scroll">
		<Form.Field {form} name="name" class="flex flex-col">
			<Form.Control let:attrs>
				<Input type="text" bind:value={$data.name} {...attrs} placeholder="Name..." class="text-2xl" />
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<div class="flex gap-2">
			<Form.Field {form} name="doer" class="flex flex-col flex-1">
				<Form.Control let:attrs>
					<Form.Label>Doer</Form.Label>
					<SelectResource bind:value={$data.doer} placeholder="Select Doer..." {...attrs} class="grow" />
				</Form.Control>
			</Form.Field>
			<Form.Field {form} name="done" class="flex flex-col flex-1">
				<Form.Control let:attrs>
					<Form.Label class="mt-0">Done</Form.Label>
					<Toggle bind:value={$data.done} {...attrs}>
						<div slot="true" class={cn("w-full h-full rounded-md flex items-center justify-center", $data.done && "bg-green-500 text-white")}>
							<Check class="mr-2" /> Done
						</div>
						<div slot="false" class="w-full h-full rounded-md flex items-center justify-center">
							<Minus class="mr-2" /> Not Done
						</div>
					</Toggle>
				</Form.Control>
			</Form.Field>
		</div>
		<div class="flex gap-2">
			<Form.Field {form} name="estimate" class="flex flex-col flex-1">
				<Form.Control let:attrs>
					<Form.Label>Estimate</Form.Label>
					<Input type="number" bind:value={$data.estimate} min={0} step="any" {...attrs} class="w-full" />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="spent" class="flex flex-col flex-1" >
				<Form.Control let:attrs>
					<Form.Label>Spent</Form.Label>
					<Input type="number" bind:value={$data.spent} min={0} step="any" {...attrs} class="w-full" />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
		<div class="flex w-full justify-center">
			<Button type="submit">{task ? "Update" : "Create"}</Button>
		</div>
	</div>
	<div class="flex-1 [&_.carta-renderer]:prose [&_.carta-renderer]:dark:prose-invert [&_.carta-input]:h-[calc(90vh-140px)] [&_.carta-renderer]:h-[calc(90vh-140px)]">
		<MarkdownEditor {carta} bind:value={$data.description} mode="tabs" />
	</div>
</form>
