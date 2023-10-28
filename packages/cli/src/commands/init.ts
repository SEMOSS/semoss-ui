import { Command, Flags, Args } from '@oclif/core';
import { Env, Insight } from '@semoss/sdk';
import { config } from 'dotenv';
import * as fs from 'node:fs';
import * as os from 'node:os';
import Listr from 'listr';

export default class Deploy extends Command {
    static args = {
        name: Args.string(),
    };

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
    };

    public async run(): Promise<void> {
        const { flags, args } = await this.parse(Deploy);

        // get the name of the app
        const name = args.name;
        if (!name) {
            throw new Error('Name is required');
        }

        // path to the environment variables
        const envPath = flags.env ?? '.env';

        // load the environment variables if it exists
        try {
            // load the dont env config file
            config({ path: envPath });

            // update the environment
            Env.update({
                ACCESS_KEY: process.env.ACCESS_KEY,
                APP: process.env.APP,
                MODULE: process.env.MODULE,
                SECRET_KEY: process.env.SECRET_KEY,
            });
        } catch (error) {
            this.error(error as Error);
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
                    await insight.initialize();

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
                    const { errors, pixelReturn } = await insight.actions.run<
                        [{ project_id: string }]
                    >(`CreateProject("${name}")`);

                    if (errors.length > 0) {
                        throw new Error(errors.join(''));
                    }

                    // save the new app ID
                    context.APP = pixelReturn[0].output.project_id;

                    return true;
                },
            },
            {
                title: 'Saving App',
                task: async (context) => {
                    if (!context.APP) {
                        throw new Error();
                    }

                    const ENV_VARS = fs
                        .readFileSync(envPath, 'utf8')
                        .split(os.EOL);

                    const line = ENV_VARS.find((line) => {
                        return line.match('APP');
                    });

                    // find the env we want based on the key
                    const target = line ? ENV_VARS.indexOf(line) : -1;

                    // replace the key/value with the new value
                    if (target > -1) {
                        ENV_VARS.splice(target, 1, `APP=${context.APP}`);
                    } else {
                        ENV_VARS.push(`APP=${context.APP}`);
                    }

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

                this.log('Sucess');
                this.log(`ID: ${context.APP}`);
            })
            .catch((err) => {
                // log the error
                this.error(err);
            });
    }
}
