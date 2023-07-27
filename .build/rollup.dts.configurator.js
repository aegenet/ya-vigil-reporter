const dts = require('rollup-plugin-dts');
const path = require('node:path');

module.exports = async function(options) {
  const folder = options.folder ? options.folder + '/' : '';

  return {
    input: path.resolve(options.cwd, `src/${options.entryPoint || 'index.ts'}`),
    // make sure to externalize deps that shouldn't be bundled
    // into your library
    external: options.nodeExternal ? [/^node:/].concat(options.external || []) : options.external || [],
    output: [
      {
        format: 'es',
        file: `./dist/${folder}bundle.d.ts`,
        globals: options.globals || {},
      },
    ],
    plugins: [(dts.default || dts)()],
  };  
}
