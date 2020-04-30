const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    context: path.resolve(__dirname, 'src'),
    mode: 'development',
    entry: {
        main: './app.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'public')
    },
    resolve: {
        alias: {
            './@': path.resolve(__dirname, 'src'),
            '@': path.resolve(__dirname, 'src')
        }
    },
    optimization: {
        splitChunks:{
            chunks: 'all'
        }
    },
    plugins: [
        new HTMLWebpackPlugin({
            template: './assets/index.html'
        }),
        //new CleanWebpackPlugin(),
        new MiniCSSExtractPlugin({
            filename: '[name].css'
        })
    ],
    module:{
        rules: [
            {
                test: /\.css$/,
                use: [{
                    loader: MiniCSSExtractPlugin.loader,
                    options: {
                        hmr: true,
                        reloadAll: true
                    }
                }, 'css-loader']
            },
            {
                test: /\.html/,
                use: ['html-loader']
            },
            {
                test: /\.(png|jpg|gif|svg)/,
                use: ['file-loader']
            },
            {
                test: /\.(ttf|woff|woff2|eot)/,
                use: ['file-loader']
            }
        ]
    }
};