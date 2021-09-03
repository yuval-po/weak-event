module.exports = {
	root: true,
	env: {
		"es6": true,
		node: true,
	},
	plugins: [
		'prettier',
	],
	extends: [
		'airbnb-typescript',
		"prettier",
		"plugin:vue/vue3-essential",
		"eslint:recommended",
		"@vue/typescript/recommended",
		"@vue/prettier",
		"@vue/prettier/@typescript-eslint",

	],
	parserOptions: {
		ecmaVersion: 2020,
		project: './tsconfig.json'
	},
	rules: {
		"prettier/prettier": "error",
		"import/prefer-default-export": "off",
		"arrow-body-style": "off",
		"class-methods-use-this": "off",
		"no-restricted-syntax": "off",
		"react/static-property-placement": "off",
		"no-continue": "off",
		"no-console": "off",
		"no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
		"vue/require-valid-default-prop": "off",
		"import/no-unresolved": "off",
	},
	overrides: [
		{
			// TypeScript
			files: ["**/*.ts"],
			parser: '@typescript-eslint/parser',
			plugins: [
				'prettier',
			],
			extends: [
				'airbnb-typescript',
				"prettier"
			],
			"env": {
				"es6": true,
				"node": true
			},
			parserOptions: {
				project: './tsconfig.json'
			},
			rules: {
				"prettier/prettier": "error",
				"import/prefer-default-export": "off",
				"arrow-body-style": "off",
				"class-methods-use-this": "off",
				"no-restricted-syntax": "off",
				"react/static-property-placement": "off",
				"no-continue": "off",
				"no-plusplus": "off",
				"no-console": "off",
				"no-underscore-dangle": ["error", { "allowAfterThis": true }],
				"no-trailing-spaces": "error",
				"spaced-comment": ["error", "always", { "exceptions": ["#region", "#endregion"] }]
			}
		},
		{
			files: [
				"**/__tests__/*.{j,t}s?(x)",
				"**/tests/unit/**/*.spec.{j,t}s?(x)",
			],
			env: {
				mocha: true,
			},
		},
		{
			files: ["scripts/**/*.js"],
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'script',
				project: "./tsconfig.eslint.json",
			},
			plugins: [
				'prettier',
			],
			extends: [
				"eslint:recommended",
				"prettier"
			],
			"env": {
				"es6": true,
				"node": true
			},
		},
	],
};
