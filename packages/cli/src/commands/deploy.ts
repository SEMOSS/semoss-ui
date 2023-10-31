import { Command, Flags } from '@oclif/core';
import { Env, Insight } from '@semoss/sdk';
import AdmZip from 'adm-zip';
import { config } from 'dotenv';
import { File } from 'node:buffer';

import Listr from 'listr';

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

        root: Flags.string({
            char: 'r',
            description: 'Path to the root folder. Default is ./',
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parse(Deploy);

        // path to the environment variables
        const envPath = flags.env ?? '.env';

        // path to the root of the app
        const rootPath = flags.root ?? './';

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
                    // create a new zip
                    const zip = new AdmZip();

                    // copy the contents (portals, java, r , py)
                    await Promise.all(
                        ['portals', 'java', 'r', 'python'].map((d) => {
                            return new Promise((resolve) => {
                                zip.addLocalFolderAsync(
                                    `${rootPath}${d}`,
                                    (success, err) => {
                                        if (err) {
                                            // warn the user
                                            console.warn(err);
                                        }

                                        resolve(null);
                                    },
                                    `./${d}`,
                                );
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

                    // reload the classes
                    await insight.actions.run(
                        `ReloadInsightClasses('${Env.APP}');`,
                    );

                    // publish the project
                    await insight.actions.run(
                        `PublishProject('${Env.APP}', release=true);`,
                    );

                    // cleanup
                    // await insight.actions.run(
                    //     `DeleteAsset(filePath=["${path}${upload[0].fileName}"], space=["${Env.APP}"]);`,
                    // );

                    return true;
                },
            },
            {
                title: 'Configuring App',
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
