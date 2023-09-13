import del from 'rollup-plugin-delete';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

const config = {
    input: ['./src/index.ts'],
    output: [
        {
            dir: 'dist',
            format: 'esm',
            preserveModules: true,
            preserveModulesRoot: 'src',
            sourcemap: true,
        },
    ],
    plugins: [
        del({ targets: 'dist' }),
        resolve(),
        commonjs(),
        typescript({
            tsconfig: './tsconfig.json',
        }),
    ],
    external: ['react', 'react-dom'],
};

export default config;
