import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import { globalIgnores } from 'eslint/config';

export default tseslint.config(
  globalIgnores(['node_modules/', 'dist/', 'build/']),
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      prettier: prettierPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
			'@typescript-eslint/explicit-member-accessibility': 'warn',

			"@typescript-eslint/consistent-type-imports": [
				"warn",
				{ prefer: "type-imports", fixStyle: "inline-type-imports" },
			],

			"@typescript-eslint/no-import-type-side-effects": "warn",
			"import/no-duplicates": ["warn"],
			
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true, argsIgnorePattern: '^_' },
      ],
			'@typescript-eslint/no-misused-promises': "off",
			
			"@typescript-eslint/naming-convention": [
				"error",
				{ selector: "import", format: ["camelCase", "PascalCase"] },
				{ selector: "default", format: ["camelCase"] },
				{ selector: "typeLike", format: ["PascalCase"] },
				{ selector: "function", format: ["camelCase", "PascalCase"] },
				{ selector: "variable", format: ["camelCase", "PascalCase", "UPPER_CASE"] },
				{
					selector: "variable",
					modifiers: ["const", "global"],
					types: ["boolean", "string", "number"],
					format: ["UPPER_CASE"],
				},
				{ selector: ["objectLiteralProperty", "typeProperty"], format: null },
			],

			"no-restricted-syntax": [
				"error",
				{
					selector: "ClassDeclaration[superClass.name=/Error$/][id.name!=/Error$/]",
					message: "Error class names should end with 'Error'",
				},
			],

      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Hooks
      'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'off',

      // Import
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
        },
      ],

      // JS
      'no-var': 'off',

      // Prettier
      'prettier/prettier': 'error',
    },
  }
);
