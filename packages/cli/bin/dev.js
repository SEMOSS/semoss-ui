#!/usr/bin/env -S node --loader ts-node/esm --no-warnings=ExperimentalWarning

// eslint-disable-next-line
async function main() {
    const { execute } = await import('@oclif/core');
    await execute({ development: true, dir: import.meta.url });
}

await main();
