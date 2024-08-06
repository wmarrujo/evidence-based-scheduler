<script lang="ts">
	import {cn} from "$lib/utils"
	import {base} from "$app/paths"
	import {Button} from "$lib/components/ui/button"
	import {Save, FileUp} from "lucide-svelte"
	import {db} from "$lib/db"
	import download from "downloadjs"
	import {onMount} from "svelte"
	import {Separator} from "$lib/components/ui/separator"
	import {page} from "$app/stores"
	import Stopwatch from "$lib/components/stopwatch.svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	async function load() {
		if (!window.confirm("Loading a database will remove any unsaved data")) return // confirm with the user that this will delete the existing database
		var input = document.createElement("input")
		input.type = "file"
		input.onchange = async (event: Event) => {
			if (!event.target) return
			let file = (event.target as EventTarget & {files: Array<Blob>}).files[0]
			await db.delete({disableAutoOpen: false}) // wipe the database, and allow it to be recreated
			localStorage.setItem("selected-goals", "[]") // remove local storage
			db.import(file)
			location.reload() // refresh the page so you get all the new data
		}
		input.click()
	}
	
	async function save() {
		const blob = await db.export({prettyJson: true})
		download(blob, "plan.json", "application/json")
	}
	
	onMount(async () => {
		await import("dexie-export-import")
	})
</script>

<div class="w-full p-2 shadow flex justify-start gap-2">
	<nav class="flex gap-2 items-center">
		<Button href="{base}/#about" variant="link" class="px-2">About</Button>
		<Separator vertical />
		<Button href="{base}/resources" variant="link" class={cn("px-2", $page.route.id?.startsWith("/resources") && "underline")}>Resources</Button>
		<Button href="{base}/tasks" variant="link" class={cn("px-2", $page.route.id?.startsWith("/tasks") && "underline")}>Tasks</Button>
		<Button href="{base}/graph" variant="link" class={cn("px-2", $page.route.id?.startsWith("/graph") && "underline")}>Graph</Button>
		<Button href="{base}/prediction" variant="link" class={cn("px-2", $page.route.id?.startsWith("/prediction") && "underline")}>Prediction</Button>
		<Separator vertical />
		<Button on:click={save} variant="outline"><Save class="mr-2" />Save</Button>
		<Button on:click={load} variant="outline"><FileUp class="mr-2" />Load</Button>
	</nav>
	<Separator vertical />
	<Stopwatch />
	<!-- TODO: current timer preview & controls -->
	<div class="flex gap-2 grow justify-end">
		<slot />
	</div>
</div>
