import { readPlaygroundBuildTheme } from "@semoss/shared";

/**
 * The build's theme, read once from the playground's `.env` (`VITE_NAME`,
 * `VITE_THEME`): the base the server's theme is laid over.
 */
export const ENV_THEME = readPlaygroundBuildTheme(import.meta.env);
