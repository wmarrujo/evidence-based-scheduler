<script lang="ts">
	import {cn} from "$lib/utils"
	import {z} from "zod"
	import {superForm, defaults} from "sveltekit-superforms"
	import {zod} from "sveltekit-superforms/adapters"
	import * as Form from "$lib/components/ui/form"
	import {Button} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import {db, type Project, type TaskId} from "$lib/db"
	import {createEventDispatcher} from "svelte"
	import {Carta, MarkdownEditor} from "carta-md"
	import {mode} from "mode-watcher"
	import "$lib/styles/carta.pcss"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let className = ""
	export {className as class}
	const dispatch = createEventDispatcher<{created: Project}>()
	
	export let tasks: Array<TaskId> = []
	
	const schema = z.object({
		name: z.string().min(1, {message: "you must provide a name"}),
		description: z.string(),
	})
	
	const form = superForm(defaults(zod(schema)), {
			SPA: true,
			validators: zod(schema),
			async onUpdate({form}) { // handle submission
				if (!form.valid) return
				const project = {
					name: form.data.name,
					description: form.data.description ?? "",
					tasks,
				}
				const id = await db.projects.add(project) // insert (and get the id it created)
				dispatch("created", {id, ...project}) // send the message, and return the project it created
			},
		}), {form: data, enhance} = form
	
	const carta = new Carta({
		sanitizer: false,
		theme: $mode == "light" ? "github-light" : "github-dark",
	})
</script>

<form class={cn(className, "flex flex-col gap-2")} use:enhance>
	<Form.Field {form} name="name" class="">
		<Form.Control let:attrs>
			<Input type="text" bind:value={$data.name} placeholder="Project Name..." class="text-xl" {...attrs} />
		</Form.Control>
	</Form.Field>
	<div class="grow [&_.carta-renderer]:prose [&_.carta-renderer]:dark:prose-invert [&_.carta-input]:h-[calc(90vh-235px)]">
		<MarkdownEditor {carta} bind:value={$data.description} mode="tabs" />
	</div>
	<div class="flex w-full justify-center">
		<Button type="submit">Create</Button>
	</div>
</form>
