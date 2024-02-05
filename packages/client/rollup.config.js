import terser from '@rollup/plugin-terser'; // Minify for production
import resolve from '@rollup/plugin-node-resolve'; // Resolve browser-specific modules
import commonjs from '@rollup/plugin-commonjs'; // Convert CommonJS modules to ES6
import typescript from '@rollup/plugin-typescript'; // Compile TypeScript
import serve from 'rollup-plugin-serve'; // Used to serve bundle in a developmet capacity, works with live-reload
import livereload from 'rollup-plugin-livereload'; // hot reload browser on changes
import image from '@rollup/plugin-image'; // Compile Images
import preserveDirectives from 'rollup-plugin-preserve-directives';

// import postcss from 'rollup-plugin-postcss';

const isProduction = process.env.NODE_ENV === 'production';
// Do we need babel, talks about it here? https://dev.to/proticm/how-to-setup-rollup-config-45mk

const config = {
    input: 'src/main.tsx',
    output: {
        dir: 'dist/bundle.js', // Output directory
        format: 'esm', // Use ES module format
        sourcemap: true,
        preserveModules: true,
    },
    // output: {
    //     dir: 'dist/index.js', // Output directory
    //     format: 'cjs', // Use ES module format
    //     sourcemap: true,
    // },
    // output: {
    //     file: 'dist/bundle.js', // Corrected to 'file' for single output
    //     format: 'iife', // Corrected format for web use
    //     sourcemap: true, // Enables source map generation
    //   },
    plugins: [
        resolve({
            browser: true,
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        }),
        commonjs(),
        typescript({ tsconfig: './tsconfig.json' }),
        image(),
        preserveDirectives(),
        serve({
            open: true,
            contentBase: ['dist'],
            port: 9090,
        }),
        livereload('dist'),
        // isProduction && terser(),
        // !isProduction &&
        //     serve({
        //         open: true,
        //         contentBase: ['dist'],
        //         port: 9090,
        //         contentBase: ['', 'public'],
        //     }),
        // !isProduction && livereload('dist'),
        // postcss(),
        // babel({
        //     extensions: ['.js', '.jsx', '.ts', '.tsx'],
        //     babelHelpers: 'bundled',
        //     exclude: 'node_modules/**',
        //     presets: ['@babel/preset-react'], // Preset for React
        // }),
    ],
};

export default config;
