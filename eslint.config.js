import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {ignores: ['dist', 'coverage', 'playwright-report', 'test-results']},
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {...globals.browser, ...globals.node},
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      ...reactRefresh.configs.vite.rules,
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'motion',
              message: 'Import only the declarative motion wrapper from motion/react.',
            },
            {
              name: 'motion/react',
              allowImportNames: ['motion'],
              message:
                'Only the motion wrapper is allowed; timeline.ts must calculate every rendered value.',
            },
            {
              name: 'framer-motion',
              message: 'The Motion ecosystem is default-deny; use only {motion} from motion/react.',
            },
            {
              name: 'motion-dom',
              message: 'The Motion ecosystem is default-deny; use only {motion} from motion/react.',
            },
            {
              name: 'motion-utils',
              message: 'The Motion ecosystem is default-deny; use only {motion} from motion/react.',
            },
          ],
          patterns: [
            {
              group: [
                'motion/*',
                '!motion/react',
                'framer-motion/*',
                'motion-dom/*',
                'motion-utils/*',
              ],
              message: 'The Motion ecosystem is default-deny; use only {motion} from motion/react.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'ImportDeclaration[source.value="motion/react"] ImportSpecifier[imported.name="motion"][local.name!="motion"]',
          message: 'Import the motion wrapper without a local alias.',
        },
      ],
    },
  },
);
