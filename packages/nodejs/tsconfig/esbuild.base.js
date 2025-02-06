const { nodeExternalsPlugin } = require('esbuild-node-externals')
const getPackages = require('get-monorepo-packages')
const esbuild = require('esbuild')
const packages = getPackages('../../../')
const fs = require('fs')

const watch = process.argv[2]

const keyringPackages = packages.map(function (source) {
  return source.package.name
})

const allowList = [
    ...keyringPackages,
    '@noble/ed25519',
    'url-join',
]

const baseConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/index.js',
  sourcemap: 'inline',
  minify: process.env.NODE_ENV === 'production',
  logLevel: 'info',
  plugins: [
    nodeExternalsPlugin({
      allowList,
    }),
  ],
}

module.exports = {
  config: baseConfig,
  run: function (options) {
    const buildOptions = {
      ...baseConfig,
      ...(options || {}),
    }

    if (watch === '--watch') {
      esbuild.context(buildOptions).then(function (ctx) {
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
        .build(buildOptions)
        .then((result) => {
          if (result.metafile) {
            fs.writeFileSync('dist/meta.json', JSON.stringify(result.metafile, null, 2))
          }
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
