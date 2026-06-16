import jshowConfig from 'eslint-config-jshow';

const prettierConfigs = await jshowConfig.prettier(process.cwd());

export default [
  ...jshowConfig.node,
  ...prettierConfigs,
  {
    ignores: [
      '**/dist/*',
      '**/node_modules/*',
      '**/build/*',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml'
    ]
  },
  {
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      'no-void': 'off',
      // 'no-restricted-globals': 'off',
      'no-inline-comments': 'off',
      'jshow/sort-import': [
        'error',
        {
          groups: [
            ['^node:'],
            ['^@jshow/'],
            ['^@nestjs/'],
            ['^\\u0000', '^@?[a-zA-Z]'],
            ['^@/'],
            ['^\\.\\./'],
            ['^\\./']
          ]
        }
      ]
    }
  }
];
