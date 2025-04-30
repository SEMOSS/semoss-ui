import { config } from 'dotenv';
import { Env } from '@semoss/sdk';
export const setSemoss = (envFilePath: string) => {
    try {
        // load the env
        config({ path: envFilePath });
        // update the environment
        Env.update({
            ACCESS_KEY: process.env.ACCESS_KEY,
            MODULE: process.env.MODULE,
            SECRET_KEY: process.env.SECRET_KEY,
        });
    } catch (e) {
        throw e as Error;
    }

    // check the environment
    if (!Env.MODULE) {
        throw new Error(
            'MODULE is required. Define one in your environment variables (.env)',
        );
    }

    if (!Env.ACCESS_KEY) {
        throw new Error(
            'ACCESS_KEY is required. Define one in your environment variables (.env)',
        );
    }

    if (!Env.SECRET_KEY) {
        throw new Error(
            'SECRET_KEY is required. Define one in your environment variables (.env)',
        );
    }

    if (Env.APP) {
        throw new Error(
            'APP is already defined. Delete from your environment variables (.env) to create a new app',
        );
    }
};
