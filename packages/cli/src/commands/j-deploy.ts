import { Command, Flags } from "@oclif/core";
import { config } from "dotenv";
import Listr from "listr";
import { Env, Insight } from "@semoss/sdk";

export default class JDeploy extends Command {
    static description = "Run reactor 1+1 and DeleteAsset";

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
        // debug flag
        debug: Flags.boolean({
            char: "d",
            description: "Enable debug logging",
        }),
        // verbose flag
        verbose: Flags.boolean({
            char: "v",
            description: "Enable verbose output",
        }),
        // breakpoint flag
        breakpoint: Flags.boolean({
            char: "b",
            description: "Add debugger breakpoint for debugging",
        }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parse(JDeploy);

        // Enable debug logging if flag is set
        if (flags.debug) {
            process.env.DEBUG = "oclif*,@semoss/cli*";
        }

        // path to the environment variables
        const envPath = flags.env ?? ".env";

        if (flags.verbose) {
            this.log("🔍 Debug mode enabled");
            this.log(`📁 Environment file: ${envPath}`);
        }

        if (flags.breakpoint) {
            this.log("🛑 Debugger breakpoint enabled - attach your debugger now");
            debugger; // This will pause execution if debugger is attached
        }

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
            deleteResult?: any;
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
                    if (flags.verbose) {
                        this.log("🧮 Executing: 1+1");
                    }

                    // Run the reactor 1+1
                    const { pixelReturn } = await insight.actions.run<[number]>(
                        `1+1`,
                    );

                    if (flags.verbose) {
                        this.log(`📊 Raw pixelReturn: ${JSON.stringify(pixelReturn, null, 2)}`);
                    }

                    // save the result
                    context.result = pixelReturn[0].output;

                    if (flags.verbose) {
                        this.log(`✅ 1+1 Result: ${context.result}`);
                    }

                    return true;
                },
            },
            {
                title: "Running DeleteAsset Reactor",
                task: async (context) => {
                    const deleteCommand = `DeleteAsset(filePath="version/assets/", space=["${Env.APP}"])`;
                    
                    if (flags.verbose) {
                        this.log(`🗑️ Executing: ${deleteCommand}`);
                    }

                    // Run the DeleteAsset reactor
                    const { pixelReturn } = await insight.actions.run(
                        deleteCommand,
                    );

                    if (flags.verbose) {
                        this.log(`📊 Raw DeleteAsset pixelReturn: ${JSON.stringify(pixelReturn, null, 2)}`);
                    }

                    // save the delete result
                    context.deleteResult = pixelReturn[0].output;

                    if (flags.verbose) {
                        this.log(`✅ DeleteAsset Result: ${context.deleteResult}`);
                    }

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
                
                this.log("🎉 Success!");
                this.log(`🧮 1+1 Result: ${context.result}`);
                
                if (context.deleteResult !== undefined) {
                    this.log(`🗑️ DeleteAsset Result: ${context.deleteResult}`);
                }

                if (flags.verbose) {
                    this.log("\n📋 Summary:");
                    this.log(`   • 1+1 calculation: ${context.result}`);
                    this.log(`   • DeleteAsset operation: ${context.deleteResult !== undefined ? 'Completed' : 'Skipped'}`);
                    if (context.deleteResult !== undefined) {
                        this.log(`   • DeleteAsset result: ${context.deleteResult}`);
                    }
                }
            })
            .catch((err) => {
                // log the error
                this.error(err);
            });
    }
}