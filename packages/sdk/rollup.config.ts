import { RollupOptions } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

const config: RollupOptions = {
    input: ['./src/index.ts'],
    output: {
        dir: 'dist',
        format: 'esm',
        preserveModules: true,
        preserveModulesRoot: 'src',
        sourcemap: true,
    },
    plugins: [
        resolve(),
        commonjs(),
        typescript({
            tsconfig: './tsconfig.json',
            declaration: true,
            declarationDir: 'dist',
        }),
    ],
    external: ['react', 'react-dom'],
};

export default config;
