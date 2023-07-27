// vite.config.js
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/**
 * Config
 */
export async function config({
  /** Working directory */
  cwd = process.cwd(),
  /**
   * lib name
   */
  libName = '',
  /**
   * entry point (with extension)
   */
  entryPoint = 'index.js',
  /**
   * output subfolder (in ./dist/)
   */
  folder = '',
  /**
   * output name (in ./dist/[folder]/[outputName].xxx)
   */
  outputName = 'index',
  /** 
   * node external? (boolean)
   */
  nodeExternal = false,
  /** 
   * rollup external (string[])
   */
  external = [],
  /**
   * rollup globals
   * @param Record<string, string>
   */
  globals = {},
  /**
   * Minify Keep Class Names
   */
  minifyKeepClassNames = false,
}) {
  folder = folder ? folder + '/' : '';
  return defineConfig({
    plugins: [],
    build: {
      outDir: `./dist/${folder}`,
      lib: {
        // Could also be a dictionary or array of multiple entry points
        entry: resolve(cwd, `build/${entryPoint || 'index.js'}`),
        name: libName,
        fileName: outputName || 'index',
      },
      minify: minifyKeepClassNames === true ? 'terser' : 'esbuild',
      terserOptions: minifyKeepClassNames === true ? {
        keep_classnames: true,
      } : undefined,
      rollupOptions: {
        // make sure to externalize deps that shouldn't be bundled
        // into your library
        external: nodeExternal ? [/^node:/].concat(external || []) : external || [],
        output: [
          {
            name: libName,
            // generatedCode: 'es2015',
            format: 'cjs',
            entryFileNames: `[name].cjs`,
            globals: globals || {},
          },
          {
            name: libName,
            // generatedCode: 'es2015',
            format: 'es',
            entryFileNames: `[name].mjs`,
            globals: globals || {},
          },
          {
            name: libName,
            // generatedCode: 'es2015',
            format: 'umd',
            entryFileNames: `[name].[format].js`,
            globals: globals || {},
          },
        ],
      },
    },
  });  
}
