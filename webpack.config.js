const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const LicenseWebpackPlugin = require('webpack-license-plugin');

module.exports = (env, argv) => {
    return ({
        stats: 'minimal', // Keep console output easy to read.
        entry: './src/index.ts', // Your program entry point

        // Your build destination
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'bundle.js'
        },

        // Config for your testing server
        devServer: {
            compress: true,
            static: false,
            client: {
                logging: "warn",
                overlay: {
                    errors: true,
                    warnings: false,
                },
                progress: true,
            },
            port: 1234, host: '0.0.0.0'
        },

        // Web games are bigger than pages, disable the warnings that our game is too big.
        performance: { hints: false },

        // Enable sourcemaps while debugging
        devtool: argv.mode === 'development' ? 'eval-source-map' : undefined,

        // Minify the code when making a final build
        optimization: {
            minimize: argv.mode === 'production',
            minimizer: [new TerserPlugin({
                terserOptions: {
                    ecma: 6,
                    compress: { drop_console: true },
                    output: { comments: false, beautify: false },
                },
            })],
        },


        // Explain webpack how to do Typescript
        module: {
            rules: [
                {
                    test: /\.ts(x)?$/,
                    loader: 'ts-loader',
                    exclude: /node_modules/
                }
            ]
        },
        resolve: {
            extensions: [
                '.tsx',
                '.ts',
                '.js'
            ]
        },

        plugins: [
            // Copy our static assets to the final build
            new CopyPlugin({
                patterns: [{ from: 'static/' }],
            }),
            // Make an index.html from the template
            new HtmlWebpackPlugin({
                template: 'src/index.ejs',
                hash: true,
                minify: false
            }),
            new LicenseWebpackPlugin({
                licenseOverrides: {
                    "noisejs@2.1.0": "CC0-1.0"
                },
                additionalFiles: {
                    '../licenses.txt': packages => {
                        var str = "Used libraries and resources: \n";
                        for (var i = 0; i < packages.length; i++) {
                            var package = packages[i];
                            str += (i + 1) + ".\t" + package.name + " (" + package.version + "), " + package.license + "\n";
                        }
                        str += "\n";

                        for (var i = 0; i < packages.length; i++) {
                            var package = packages[i];
                            str += "START NOTICE " + (i + 1) + ". " + package.name + " (" + package.version + "), " + package.repository + "\n" +
                                "===========================================\n" +
                                package.licenseText +
                                "===========================================\n" +
                                "END OF NOTICE " + package.repository + "\n\n";
                        }
                        return str;
                    }
                }
            })
        ]
    });
}