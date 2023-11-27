import { Command, Flags } from '@oclif/core';
import { Env, Insight } from '@semoss/sdk';
import { config } from 'dotenv';
import * as fs from 'node:fs';
import Listr from 'listr';

import { Config } from '../types.js';

export default class Deploy extends Command {
    static description = 'Initialize a new app';

    static examples = [
        `<%= config.bin %> <%= command.id %>
init (./src/commands/init.ts)
`,
    ];

    static flags = {
        // environment variables
        env: Flags.string({
            char: 'e',
            description: 'Path to the environment variables. Default is .env',
        }),
        // name
        name: Flags.string({
            char: 'n',
            description: 'Name of the project',
        }),
        // config
        config: Flags.string({
            char: 'c',
            description: 'Path to the configuration. Default is smss.json',
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parse(Deploy);

        // path to the environment variables
        const envPath = flags.env ?? '.env';

        // path to the config (optional)
        const configPath = flags.config ?? 'smss.json';

        // define the config
        let configOptions: Config | null = null;

        try {
            // load the env
            config({ path: envPath });

            // try to load the configOptions (optional)
            try {
                // load it
                configOptions = JSON.parse(
                    fs.readFileSync(configPath, 'utf8'),
                ) as Config;
            } catch (e) {
                // noop
            }

            // update the environment
            Env.update({
                ACCESS_KEY: process.env.ACCESS_KEY,
                MODULE: process.env.MODULE,
                SECRET_KEY: process.env.SECRET_KEY,
            });
        } catch (error) {
            this.error(error as Error);
        }

        // throw the error
        const name =
            configOptions && configOptions.name
                ? configOptions.name
                : flags.name;
        if (!name) {
            throw new Error('Name is required');
        }

        // check the environment
        if (!Env.MODULE) {
            this.error(
                'MODULE is required. Define one in your environment variables (.env)',
            );
        }

        if (!Env.ACCESS_KEY) {
            this.error(
                'ACCESS_KEY is required. Define one in your environment variables (.env)',
            );
        }

        if (!Env.SECRET_KEY) {
            this.error(
                'SECRET_KEY is required. Define one in your environment variables (.env)',
            );
        }

        if (Env.APP) {
            this.error(
                'APP is already defined. Delete from your environment variables (.env) to create a new app',
            );
        }

        // create a new insight
        const insight = new Insight();

        // get the tasks
        const tasks = new Listr<{
            APP?: string;
        }>([
            {
                title: 'Initializing',
                task: async () => {
                    // initialize the insight
                    await insight.initialize({
                        python: false,
                    });

                    if (insight.error) {
                        throw insight.error;
                    } else if (!insight.isAuthorized) {
                        throw new Error('User is not Authorized');
                    } else if (!insight.isReady) {
                        throw new Error('Error initializing model');
                    }
                    return true;
                },
            },
            {
                title: 'Configuring App',
                task: async (context) => {
                    // Load the insight classes
                    const { pixelReturn } = await insight.actions.run<
                        [{ project_id: string }]
                    >(`CreateProject("${name}")`);
                    // save the new app ID
                    context.APP = pixelReturn[0].output.project_id;
                    return true;
                },
            },
            {
                title: 'Saving App',
                task: async (context) => {
                    if (!context.APP) {
                        throw new Error('No App');
                    }

                    let content = {
                        app: '',
                        name: '',
                    };

                    if (configOptions) {
                        content = configOptions;
                    }

                    content.app = context.APP;
                    content.name = name;

                    // write it
                    fs.writeFileSync(
                        configPath,
                        JSON.stringify(content, null, 4),
                    );

                    return true;
                },
            },
        ]);

        tasks
            .run()
            .then((context) => {
                if (!context.APP) {
                    throw new Error('Id Missing');
                }

                this.log('Success');
                this.log(`ID: ${context.APP}`);
            })
            .catch((err) => {
                // log the error
                this.error(err);
            });
    }
}
