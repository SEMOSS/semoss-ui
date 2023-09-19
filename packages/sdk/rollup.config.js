import { exec } from 'child_process';
import del from 'rollup-plugin-delete';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';

const tscAlias = () => {
    return {
        name: 'tsAlias',
        writeBundle: () => {
            return new Promise((resolve, reject) => {
                exec('tsc-alias', function callback(error, stdout, stderr) {
                    if (stderr || error) {
                        reject(stderr || error);
                    } else {
                        resolve(stdout);
                    }
                });
            });
        },
    };
};

const config = [
    {
        input: ['./src/index.ts'],
        output: [
            {
                file: 'dist/index.js',
                format: 'esm',
                sourcemap: true,
            },
            {
                file: 'dist/index.umd.js',
                format: 'umd',
                name: 'semoss',
                sourcemap: true,
            },
        ],
        plugins: [
            del({ targets: 'dist' }),
            peerDepsExternal(),
            resolve({
                browser: true,
            }),
            commonjs(),
            typescript({
                tsconfig: './tsconfig.json',
            }),
            tscAlias(),
        ],
    },
    {
        input: './dist/dts/index.d.ts',
        output: [{ file: 'dist/index.d.ts', format: 'es' }],
        plugins: [
            dts(),
            del({
                targets: 'dist/dts',
                hook: 'buildEnd',
            }),
        ],
    },
];

export default config;
