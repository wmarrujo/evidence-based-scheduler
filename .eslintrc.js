module.exports = {
	"root": true,
	"env": {
		"node": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/eslint-recommended"
	],
	// "parser": "babel-eslint",
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"ecmaVersion": 2020,
		"sourceType": "module"
	},
	"plugins": ["@typescript-eslint"],
	"rules": {
		"indent": ["error", "tab", {
			"MemberExpression": 1,
			"ArrayExpression": 1,
			"ObjectExpression": 1,
			"flatTernaryExpressions": true,
			"VariableDeclarator": "first"
		}],
		"quotes": ["error", "double"],
		"semi": ["error", "never"],
		"no-console": ["warn", {"allow": ["warn", "error"]}],
		"no-debugger": "warn",
		"no-unused-vars": "off",
		"@typescript-eslint/no-unused-vars": ["warn", {
			"vars": "all",
			"args": "after-used",
			"ignoreRestSiblings": false
		}],
		"space-before-function-paren": ["error", {
			"named": "never",
			"anonymous": "always",
			"asyncArrow": "always"
		}],
		"object-curly-spacing": ["error", "never"],
		"array-bracket-spacing": ["error", "never"],
		"computed-property-spacing": ["error", "never"],
		"no-trailing-spaces": ["error", {
			"skipBlankLines": true,
			"ignoreComments": true
		}],
		"no-unneeded-ternary": "error",
		"brace-style": ["error", "1tbs", {"allowSingleLine": true}],
		"block-spacing": "error",
		"camelcase": "error",
		"comma-dangle": ["error", "never"],
		"comma-spacing": ["error", {"before": false, "after": true}],
		"comma-style": ["error", "last"],
		"func-call-spacing": ["error", "never"],
		"implicit-arrow-linebreak": ["error", "beside"],
		"one-var": ["error", "never"],
		"arrow-spacing": "error",
		"no-var": "error"
	},
	"overrides": [
		{
			"files": [
				"**/tests/**/*.spec.{j,t}s"
			],
			"env": {
				"jest": true
			}
		}
	]
}
