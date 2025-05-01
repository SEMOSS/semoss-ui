import { Args, Command, Flags } from '@oclif/core';
import { Env, Insight } from '@semoss/sdk';
import Listr from 'listr';
import AdmZip from 'adm-zip';
import { glob } from 'glob';
import { config } from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { File } from 'node:buffer';
 
import { Config } from '../types.js';
import { DEFAULT_CONFIG } from '../constants.js';
import { setSemoss } from '../Utility/SetSemoss.js';
import { ENV } from '../flags.js';
 
 
 
 
 
interface AppMetadata {
    project_id: string;
    project_name: string;
    project_type: 'BLOCKS' | 'CODE' | 'INSIGHT' | '';
    project_cost: string;
    project_global: string;
    project_catalog_name: string;
    project_created_by: string;
    project_created_by_type: string;
    project_date_created: string;
    project_has_portal?: boolean;
    project_portal_name?: string;
    project_portal_published_date?: string;
    project_published_user?: string;
    project_published_user_type?: string;
    project_reactors_compiled_date?: string;
    project_reactors_compiled_user?: string;
    project_reactors_compiled_user_type?: string;
    project_favorite?: string;
    user_permission?: number;
    group_permission?: string;
    tag?: string | string[];
    description?: string;
}
 
// import {useRootStore} from '../../../client/src/hooks/index.js'
 
 
/**
 * AUTO GENERATED CLASS with some generalization added, to be used as testing for a bit
 */
export default class RunPixel extends Command {
    // Define the arguments
 
    static flags = {
        // environment variables
        ENV: ENV
    };
    static override args = {
        appName: Args.string({ description: 'Name of app' }),
    };
 
    static override description = 'test description here';
 
    // Define examples
    static override examples = ['<%= config.bin %> <%= command.id %>'];
 
    public async run(): Promise<void> {
        const { args, flags } = await this.parse(RunPixel);
        // this.log(`${args.appName}`);
        const insight = new Insight();
 
        // path to the environment variables
        const envPath = flags.ENV ?? '.env';
 
        this.log(`${flags.ENV}`)
 
        setSemoss(envPath);
 
 
 
        const tasks = new Listr<{
            package?: Buffer;
            url?: string;
        }>([
 
 
            {
                title: 'Publishing App',
                task: async (context) => {
                    const { pixelReturn } = await insight.actions.run(`GetUserInfo();`);
                    this.log(`${pixelReturn}`);
                },
            },
 
        ]);
 
        tasks
            .run()
            .then((context) => {
                this.log(`${context}`)
            })
            .catch((err) => {
                // log the error
                this.error(err);
            });
 
    }
}