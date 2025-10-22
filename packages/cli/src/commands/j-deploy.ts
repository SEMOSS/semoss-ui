import { Command, Flags } from "@oclif/core";
import { config } from "dotenv";
import Listr from "listr";
import { Env, Insight } from "@semoss/sdk";

export default class JDeploy extends Command {
    static description = "Run reactor 1+1";

    static examples = [
        `<%= config.bin %> <%= command.id %>
j-deploy (./src/commands/j-deploy.ts)
`,
    ];

    static flags = {
        // environment variables
        env: Flags.string({
            char: "e",
            description: "Path to the environment variables. Default is .env",
        }),
    };

    public async run(): Promise<void> {

        console.log("------------------------")
        console.log("JOHNS SCRIPT TO DEPLOY")
        console.log("------------------------")

        const { flags } = await this.parse(JDeploy);

        // path to the environment variables
        const envPath = flags.env ?? ".env";

        try {
            // load the env
            config({ path: envPath });

            // update the environment
            Env.update({
                APP: process.env.APP,
                ACCESS_KEY: process.env.ACCESS_KEY,
                MODULE: process.env.MODULE,
                SECRET_KEY: process.env.SECRET_KEY,
            });
        } catch (error) {
            this.error(error as Error);
        }

        // check the environment
        if (!Env.MODULE) {
            this.error(
                "MODULE is required. Define one in your environment variables (.env)",
            );
        }

        if (!Env.ACCESS_KEY) {
            this.error(
                "ACCESS_KEY is required. Define one in your environment variables (.env)",
            );
        }

        if (!Env.SECRET_KEY) {
            this.error(
                "SECRET_KEY is required. Define one in your environment variables (.env)",
            );
        }

        if (!Env.APP) {
            this.error(
                "APP is required. Define one in your environment variables (.env)",
            );
        }

        // create a new insight
        const insight = new Insight();

        // get the tasks
        const tasks = new Listr<{
            result?: number;
        }>([
            {
                title: "Initializing",
                task: async () => {
                    // initialize the insight
                    await insight.initialize({
                        python: false,
                    });

                    if (insight.error) {
                        throw insight.error;
                    } else if (!insight.isAuthorized) {
                        throw new Error("User is not Authorized");
                    } else if (!insight.isReady) {
                        throw new Error("Error initializing model");
                    }

                    return true;
                },
            },
            {
                title: "Running Reactor 1+1",
                task: async (context) => {
                    // Run the reactor 1+1
                    const { pixelReturn } = await insight.actions.run<[number]>(
                        `1+1`,
                    );

                    // save the result
                    // log the reactor output for visibility
                    // use this.log so it integrates with oclif output
                    // but fall back to console.log if this.log is not available in this scope
                    try {
                        // `this` inside Listr tasks may not be the command, so use console.log
                        console.log("Reactor output:", pixelReturn[0].output);
                    } catch {
                        // noop
                    }

                    context.result = pixelReturn[0].output;

                    return true;
                },
            },
        ]);

        tasks
            .run()
            .then((context) => {
                if (context.result === undefined) {
                    throw new Error("Result Missing");
                }
                this.log("Success");
                this.log(`Result: ${context.result}`);
            })
            .catch((err) => {
                // log the error
                this.error(err);
            });
    }
}
