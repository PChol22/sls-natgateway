import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/lambda.ts'],
  silent: true,
  format: ['cjs', 'esm'],
  outDir: 'dist',
  external: ['@aws-sdk/client-s3'],
});
