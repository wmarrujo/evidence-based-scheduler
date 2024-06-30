const eslintPluginSvelte = require("eslint-plugin-svelte") // eslint-disable-line

/** @type { import("eslint").Linter.Config } */
module.exports = {
	root: true,
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:svelte/recommended",
	],
	parser: "@typescript-eslint/parser",
	plugins: [
		"@typescript-eslint",
		"@stylistic/js",
	],
	parserOptions: {
		sourceType: "module",
		ecmaVersion: 2020,
		extraFileExtensions: [".svelte"],
	},
	env: {
		browser: true,
		es2017: true,
		node: true,
	},
	overrides: [
		{
			files: ["*.svelte"],
			parser: "svelte-eslint-parser",
			parserOptions: {
				parser: "@typescript-eslint/parser",
			},
		},
	],
	...eslintPluginSvelte.configs["flat/recommended"],
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
}
