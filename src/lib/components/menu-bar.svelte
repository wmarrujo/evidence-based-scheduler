<script lang="ts">
	import {Button} from "$lib/components/ui/button"
	import {Save, FileUp} from "lucide-svelte"
	import {db} from "$lib/db"
	import download from "downloadjs"
	import {onMount} from "svelte"
	import {Separator} from "$lib/components/ui/separator"
	
	////////////////////////////////////////////////////////////////////////////////
	
	async function load() {
		if (!window.confirm("Loading a database will remove any unsaved data")) return // confirm with the user that this will delete the existing database
		var input = document.createElement("input")
		input.type = "file"
		input.onchange = async (event: Event) => {
			if (!event.target) return
			let file = (event.target as EventTarget & {files: Array<Blob>}).files[0]
			await db.delete({disableAutoOpen: false}) // wipe the database, and allow it to be recreated
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

<div class="w-full p-2 shadow flex justify-between">
	<nav class="flex gap-2 items-center">
		<Button href="/#about">About</Button>
		<Button href="/graph">Graph</Button>
		<Button href="/tasks">Tasks</Button>
		<Button href="/resources">Resources</Button>
		<Button href="/prediction">Prediction</Button>
		<Separator vertical />
		<Button on:click={save}><Save />Save</Button>
		<Button on:click={load}><FileUp />Load</Button>
	</nav>
	<!-- TODO: current timer preview & controls -->
	<div class="flex gap-2">
		<slot />
	</div>
</div>
