import { Config } from './types.js';

export const DEFAULT_CONFIG: Config = {
    app: '',
    name: '',
    deploy: {
        ignore: ['**/node_modules/**', '*.local'],
    },
};
