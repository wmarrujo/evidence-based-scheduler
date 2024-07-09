import js from "@eslint/js"
import ts from "typescript-eslint"
import svelte from "eslint-plugin-svelte"
import globals from "globals"

/** @type { import("eslint").Linter.Config } */
export default [
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs["flat/recommended"],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},
	{
		files: ["**/*.svelte"],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
			},
		},
	},
	{
		ignores: [
			".DS_Store",
			"node_modules/",
			"build/",
			".svelte-kit/",
			"dist/",
			"package/",
			".env",
			".env.*",
			"!.env.example",
			"pnpm-lock.yaml",
			"package-lock.json",
			"yarn.lock",
		],
	},
	{
		rules: {
			"quotes": ["error", "double"],
			"comma-dangle": ["error", "always-multiline"],
			"indent": ["error", "tab", {"CallExpression": {"arguments": 1}}],
			"object-curly-spacing": ["error", "never"],
			"semi": ["error", "never"],
			"@typescript-eslint/no-unused-vars": [
				"warn", {"argsIgnorePattern": "^_", "varsIgnorePattern": "^\\$\\$(Props|Events|Slots|Generic)$"},
			],
			"svelte/require-each-key": "warn",
			"svelte/infinite-reactive-loop": "error",
			"svelte/block-lang": ["error", {"script": "ts", "style": "pcss"}],
			"svelte/require-stores-init": "error",
		},
	},
]
