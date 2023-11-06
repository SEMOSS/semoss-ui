import { Command, Flags } from '@oclif/core';
import { Env, Insight } from '@semoss/sdk';
import AdmZip from 'adm-zip';
import { glob } from 'glob';
import { config } from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { File } from 'node:buffer';
import Listr from 'listr';

import { Config } from '../types.js';
import { DEFAULT_CONFIG } from '../constants.js';

export default class Deploy extends Command {
    static args = {};

    static description = 'Deploy an existing app';

    static examples = [
        `<%= config.bin %> <%= command.id %>
deploy (./src/commands/deploy.ts)
`,
    ];

    static flags = {
        // environment variables
        env: Flags.string({
            char: 'e',
            description: 'Path to the environment variables. Default is .env',
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

        // path to the config
        const configPath = flags.config ?? 'smss.json';

        let configOptions: Config;
        try {
            // load the env
            config({ path: envPath });

            // load it
            const loadedOptions = JSON.parse(
                fs.readFileSync(configPath, 'utf8'),
            ) as Partial<Config>;

            // updated the options if possible
            configOptions = {
                ...DEFAULT_CONFIG,
                ...loadedOptions,
            };

            // update the environment
            Env.update({
                APP: configOptions.app,
                ACCESS_KEY: process.env.ACCESS_KEY,
                MODULE: process.env.MODULE,
                SECRET_KEY: process.env.SECRET_KEY,
            });
        } catch (error) {
            this.error(error as Error);
        }

        if (!configOptions) {
            this.error(
                'Config is required. Define a configuration file (smss.json)',
            );
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

        if (!Env.APP) {
            this.error(
                'APP is required. Define one in your environment variables (.env)',
            );
        }

        // create a new insight
        const insight = new Insight();

        // get the tasks
        const tasks = new Listr<{
            package?: Buffer;
            url?: string;
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
                title: 'Packaging App',
                task: async (context) => {
                    // get the files
                    const paths = await glob('**/*', {
                        ignore: configOptions.deploy.ignore,
                    });

                    // create a new zip
                    const zip = new AdmZip();

                    // copy the contents
                    await Promise.all(
                        paths.map((p) => {
                            return new Promise((resolve) => {
                                fs.stat(p, (err, stats) => {
                                    // add the non director
                                    try {
                                        if (!stats.isDirectory()) {
                                            // get the directory name
                                            const dirname = path.dirname(p);

                                            // add it
                                            zip.addLocalFile(
                                                p,
                                                dirname === '.' ? '' : dirname,
                                            );
                                        }
                                    } catch (e) {
                                        this.warn(e as Error);
                                    } finally {
                                        resolve(null);
                                    }
                                });
                            });
                        }),
                    );

                    // convert to a buffer
                    context.package = await zip.toBufferPromise();

                    return true;
                },
            },
            {
                title: 'Uploading App',
                task: async (context) => {
                    if (!context.package) {
                        throw new Error('Package not found');
                    }

                    const path = 'version/assets/';
                    const name = 'package.zip';

                    // Construct a file
                    const file = new File([context.package], name);

                    // upload to the insight
                    const upload = await insight.actions.upload(
                        //@ts-expect-error Expect TS error since node != browser
                        file,
                        path,
                        'app',
                    );

                    // unzip the file in the new project
                    await insight.actions.run(
                        `UnzipFile(filePath=["${path}${upload[0].fileName}"], space=["${Env.APP}"])`,
                    );

                    // delete in the background
                    insight.actions.run(
                        `DeleteAsset(filePath=["${path}${upload[0].fileName}"], space=["${Env.APP}"])`,
                    );

                    return true;
                },
            },
            {
                title: 'Loading App Reactors',
                task: async () => {
                    // Load the insight classes
                    await insight.actions.run(
                        `ReloadInsightClasses('${Env.APP}');`,
                    );

                    return true;
                },
            },
            {
                title: 'Publishing App',
                task: async (context) => {
                    // Publish the app
                    const { pixelReturn } = await insight.actions.run<[string]>(
                        `PublishProject('${Env.APP}', release=true);`,
                    );

                    // save the url
                    context.url = pixelReturn[0].output;

                    return true;
                },
            },
        ]);

        tasks
            .run()
            .then((context) => {
                if (!context.url) {
                    throw new Error('Url Missing');
                }
                this.log('Success');
                this.log(`URL: ${context.url}`);
            })
            .catch((err) => {
                // log the error
                this.error(err);
            });
    }
}
