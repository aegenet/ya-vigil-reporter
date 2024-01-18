import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './.build/vite.configurator.mjs';

export default config({
  cwd: dirname(fileURLToPath(import.meta.url)),
  libName: '@aegenet/ya-vigil-reporter',
  entryPoint: 'index',
  nodeExternal: true,
});
