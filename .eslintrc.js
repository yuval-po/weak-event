module.exports = {
	root: true,
	env: {
		"es6": true,
		node: true,
	},
	plugins: [
		/* 'prettier', */
	],
	extends: [
		'airbnb-base',
		'airbnb-typescript/base',
		/* "prettier", */
		"eslint:recommended",

	],
	parserOptions: {
		ecmaVersion: 2021,
		project: './tsconfig.json'
	},
	rules: {
		/* "prettier/prettier": "error", */
		"import/prefer-default-export": "off",
		"arrow-body-style": "off",
		"class-methods-use-this": "off",
		"no-restricted-syntax": "off",
		"no-continue": "off",
		"no-console": "off",
		"no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
		"import/no-unresolved": "off",
		"max-len": ["error", { "code": 135}],
		"no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 1}],
		"no-tabs": "off",
		  "@typescript-eslint/indent": "off",
		"@typescript-eslint/comma-dangle": "off",
		"comma-dangle": ["error", {
			"arrays": "never",
			"objects": "never",
			"imports": "never",
			"exports": "never",
			"functions": "never"
		}],
		"padded-blocks": "off"
	},
	overrides: [
		{
			// TypeScript
			files: ["**/*.ts"],
			parser: '@typescript-eslint/parser',
			plugins: [
				/* 'prettier', */
			],
			extends: [
				'airbnb-base',
				'airbnb-typescript/base',
				/* "prettier" */
			],
			"env": {
				"es6": true,
				"node": true
			},
			parserOptions: {
				project: './tsconfig.json'
			},
			rules: {
				/* "prettier/prettier": "error", */
				"import/prefer-default-export": "off",
				"arrow-body-style": "off",
				"class-methods-use-this": "off",
				"no-restricted-syntax": "off",
				"no-continue": "off",
				"no-plusplus": "off",
				"no-console": "off",
				"no-underscore-dangle": ["error", { "allowAfterThis": true }],
				"no-trailing-spaces": "error",
				"spaced-comment": ["error", "always", { "exceptions": ["#region", "#endregion"] }],
				"max-len": ["error", { "code": 135}],
				"no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 1}],
				"no-tabs": "off",
				"@typescript-eslint/indent": "off",
				"@typescript-eslint/comma-dangle": "off",
				"comma-dangle": ["error", {
					"arrays": "never",
					"objects": "never",
					"imports": "never",
					"exports": "never",
					"functions": "never"
				}],
				"padded-blocks": "off"
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
			files: ["**/*.js"],
			plugins: [
				/* 'prettier', */
			],
			extends: [
				"eslint:recommended",
				/* "prettier" */
			],
			"env": {
				"es6": true,
				"node": true
			},
		},
	],
};
