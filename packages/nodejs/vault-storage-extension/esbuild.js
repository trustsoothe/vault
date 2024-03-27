const { nodeExternalsPlugin } = require('esbuild-node-externals')
const esbuildBase = require('@poktscan/tsconfig/esbuild.base')

const configOverrides = {
    plugins: [
        /*
         * Consider all imports external packages. So that this does not import the whole keyring because of single class.
         */
        nodeExternalsPlugin(),
    ],
}

esbuildBase.run(configOverrides)
