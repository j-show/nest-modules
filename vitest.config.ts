import path from 'node:path';

import { defineConfig } from 'vitest/config';

const resolvePkg = (name: string) =>
  path.resolve(__dirname, `packages/${name}/src/index.ts`);

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/test/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@jshow/nest-common': resolvePkg('nest-common'),
      '@jshow/nest-console': resolvePkg('nest-console'),
      '@jshow/nest-logger': resolvePkg('nest-logger')
    }
  }
});
