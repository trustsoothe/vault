const { nodeExternalsPlugin } = require('esbuild-node-externals')
const getPackages = require('get-monorepo-packages')
const esbuild = require('esbuild')
const packages = getPackages('../../../')

const watch = process.argv[2]

const allowList = packages.map(function (source) {
  return source.package.name
})

const baseConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/index.js',
  sourcemap: 'inline',
  minify: process.env.NODE_ENV === 'production',
  logLevel: 'info',
  external: [],
  plugins: [
    nodeExternalsPlugin({
      allowList,
    }),
  ],
}

module.exports = {
  config: baseConfig,
  run: function (options) {
    if (options === undefined) {
      options = baseConfig
    }

    if (watch === '--watch') {
      esbuild.context(options).then(function (ctx) {
        process.on('SIGINT', () => {
          console.log('Build watcher canceled')
          ctx.dispose().then(function () {
            process.exit(0)
          })
        })
        ctx
          .watch()
          .then(function () {
            console.log('Watching...')
          })
          .catch(function (e) {
            console.error(e)
            process.exit(1)
          })
      })
    } else {
      esbuild
        .build(options)
        .then(() => {
          console.log('Build Finished')
          process.exit(0)
        })
        .catch((e) => {
          console.error(e)
          process.exit(1)
        })
    }
  },
}
