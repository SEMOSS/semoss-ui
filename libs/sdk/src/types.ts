/**
 * Space where to run commands in
 */
export type Space = "insight" | "app" | "system";

/**
 * Script object
 */
export type Script = {
    /** Content of the script */
    script: string;

    /** Alias to load the script as */
    alias: string;
};
