import { Flags } from '@oclif/core';
 
// flag with no value (-f, --force)
export const FORCE = Flags.boolean({ char: 'f' });
 
// flag with a value (-n, --name=VALUE)
export const NAME = Flags.string({ char: 'n', description: 'name to print' });
 
 
export const ENV = Flags.string({
    char: 'e',
    description: 'Path to the environment variables. Default is .env',
});
