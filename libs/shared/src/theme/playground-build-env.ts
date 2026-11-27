import { isRecord } from "@semoss/utility/object";
import {
	DEFAULT_PLAYGROUND_THEME,
	mergePlaygroundTheme,
	type PlaygroundTheme,
} from "./playground-theme";

/**
 * The build's env values a playground app reads (`import.meta.env`), from the
 * playground's `.env`. Every one is optional; an empty one counts as unset.
 */
export interface PlaygroundBuildEnv {
	/** The app's name, over the default theme's. */
	readonly VITE_NAME?: string;
	/** The build's theme as JSON, wrapped as `{ playground: {...} }` or flat. */
	readonly VITE_THEME?: string;
	/** The engine id of the model a new chat starts with. */
	readonly VITE_DEFAUlT_MODEL_ID?: string;
	/** That model's name, shown where the model cannot be picked. */
	readonly VITE_DEFAUlT_MODEL_NAME?: string;
	/** The mode a new chat starts in: `chat` or `agent`. */
	readonly VITE_DEFAULT_CHAT_MODE?: string;
	/** The agent a new chat starts with. */
	readonly VITE_DEFAULT_CHAT_AGENT_ID?: string;
}

/** What a new chat starts with, as the build's env names it. */
export interface PlaygroundBuildNewChat {
	/** The default model's engine id. */
	readonly modelId?: string;
	/** The default model's name. */
	readonly modelName?: string;
	/** The default mode. */
	readonly mode?: string;
	/** The default agent's id. */
	readonly agentId?: string;
}

/**
 * Read the build's theme: `VITE_NAME`, then `VITE_THEME` over the playground's
 * defaults. A malformed `VITE_THEME` keeps the defaults.
 *
 * @param env - The build's env.
 * @returns The build's theme, the base every server theme is laid over.
 */
export const readPlaygroundBuildTheme = (
	env: PlaygroundBuildEnv,
): PlaygroundTheme => {
	const base = env.VITE_NAME
		? { ...DEFAULT_PLAYGROUND_THEME, name: env.VITE_NAME }
		: DEFAULT_PLAYGROUND_THEME;
	try {
		const parsed: unknown = JSON.parse(env.VITE_THEME || "{}");
		// both wrapped and flat build themes are supported
		const theme =
			isRecord(parsed) && isRecord(parsed.playground)
				? parsed.playground
				: parsed;
		return isRecord(theme)
			? mergePlaygroundTheme(base, theme as Partial<PlaygroundTheme>)
			: base;
	} catch {
		return base;
	}
};

/**
 * Read what a new chat starts with from the build's env, beneath the
 * server theme's own defaults.
 *
 * @param env - The build's env.
 * @returns The build's new-chat defaults; unset values are left out.
 */
export const readPlaygroundBuildNewChat = (
	env: PlaygroundBuildEnv,
): PlaygroundBuildNewChat => ({
	modelId: env.VITE_DEFAUlT_MODEL_ID || undefined,
	modelName: env.VITE_DEFAUlT_MODEL_NAME || undefined,
	mode: env.VITE_DEFAULT_CHAT_MODE || undefined,
	agentId: env.VITE_DEFAULT_CHAT_AGENT_ID || undefined,
});
