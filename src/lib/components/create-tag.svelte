<script lang="ts">
	import {cn} from "$lib/utils"
	import {z} from "zod"
	import {superForm, defaults} from "sveltekit-superforms"
	import {zod} from "sveltekit-superforms/adapters"
	import * as Form from "$lib/components/ui/form"
	import {Button} from "$lib/components/ui/button"
	import {Input} from "$lib/components/ui/input"
	import {Textarea} from "$lib/components/ui/textarea"
	import {db, type Tag} from "$lib/db"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let {
		class: className = "",
		oncreated = () => {},
	}: {
		class?: string
		oncreated?: (tag: Tag) => void
	} = $props()
	
	const schema = z.object({
		name: z.string().min(1, {message: "you must provide a name"}),
		description: z.string().default(""),
		tags: z.array(z.number()),
	})
	
	const form = superForm(defaults(zod(schema)), {
			SPA: true,
			validators: zod(schema),
			async onUpdate({form}) { // handle submission
				if (!form.valid) return
				const tag = {
					name: form.data.name,
					description: form.data.description,
					tags: form.data.tags,
				}
				const id = await db.tags.add(tag)
				oncreated({id, ...tag})
			},
		}), {form: data, enhance} = form
</script>

<form class={cn(className)} use:enhance>
	<Form.Field {form} name="name">
		<Form.Control>
			{#snippet children({props})}
				<Input type="text" bind:value={$data.name} placeholder="Tag Name" class="text-2xl h-14"  {...props} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="description">
		<Form.Control>
			{#snippet children({props})}
				<Textarea bind:value={$data.description} placeholder="Description" {...props} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<div class="flex w-full justify-center">
		<Button type="submit">Create</Button>
	</div>
</form>
