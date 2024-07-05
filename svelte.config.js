import adapter from "@sveltejs/adapter-static"
import {vitePreprocess} from "@sveltejs/vite-plugin-svelte"
import path from "path"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess({})],
	kit: {
		adapter: adapter(),
		alias: {
			"$schema": path.resolve("dbschema/interfaces.ts"),
			"$database": path.resolve("dbschema/edgeql-js"),
			$routes: path.resolve("src/routes"),
		},
	},
}

export default config
