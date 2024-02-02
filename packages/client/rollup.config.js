import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import typescript from '@rollup/plugin-typescript';
import image from 'rollup/plugin-image';

export default {
    input: './src/main.tsx',
    output: {
        file: 'dist/bundle.js',
        format: 'iife',
        sourcemap: true,
    },
    plugins: [
        nodeResolve({
            extensions: ['.js'],
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify('development'),
        }),
        babel({
            presets: ['@babel/preset-react'],
        }),
        commonjs(),
        serve({
            open: true,
            verbose: true,
            contentBase: ['', 'public'],
            host: 'localhost',
            port: 9090,
        }),
        livereload({ watch: 'dist' }),
        image(),
        postcss({
            preprocessor: (content, id) =>
                new Promise((res) => {
                    const result = sass.renderSync({ file: id });

                    res({ code: result.css.toString() });
                }),
            plugins: [autoprefixer],
            modules: {
                scopeBehaviour: 'global',
            },
            sourceMap: true,
            extract: true,
        }),
        typescript(),
    ],
};
