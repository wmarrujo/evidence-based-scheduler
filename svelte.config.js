import adapter from "@sveltejs/adapter-static"
import {vitePreprocess} from "@sveltejs/vite-plugin-svelte"
import path from "path"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess({})],
	kit: {
		adapter: adapter(),
		alias: {$routes: path.resolve("src/routes")},
		paths: {base: process.env.NODE_ENV == "development" ? "" : "/evidence-based-scheduler"}, // will be stored here in github pages
	},
}

export default config
