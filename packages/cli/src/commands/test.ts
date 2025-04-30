import { FORCE, NAME } from '../flags.js';
import { Args, Command } from '@oclif/core';

/**
 * AUTO GENERATED CLASS with some generalization added, to be used as testing for a bit
 */
export default class Test extends Command {
    // TODO: figure out how to make args cool like flags
    static override args = {
        file: Args.string({ description: 'file to read' }),
    };
    static override description = 'test description here';

    // TODO: turn this into a function to generate examples
    static override examples = ['<%= config.bin %> <%= command.id %>'];
    static override flags = {
        FORCE,
        NAME,
    };

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(Test);

        const name = flags.name ?? 'world';
        const env = flags.env;
        this.log(`picking up flag: ${env}`);
        this.log(
            `hello ${name} from C:\\workspace\\apache-tomcat-9.0.93\\webapps\\SemossWeb\\packages\\cli\\src\\commands\\test.ts`,
        );
        if (args.file && flags.force) {
            this.log(`you input --force and --file: ${args.file}`);
        }
    }
}
