import { configure } from "mobx";
import {
	type PlaygroundTheme,
	withPlaygroundDefaults,
} from "./playground-theme";

// The playground's remaining MobX stores (chat, room, message, tool) mutate
// state only inside actions.
configure({
	enforceActions: "always",
});

/**
 * The playground's theme, for views that still read it from `useRoot()`.
 *
 * @deprecated Read the theme with `usePlaygroundTheme()` from
 * `@/hooks/use-playground-theme`, which follows the SDK's `Config`. This holds
 * no state of its own and goes away once the playground's stores move off MobX.
 */
export class RootStore {
	private readonly _theme: PlaygroundTheme;

	/**
	 * @param theme - The complete theme, as `usePlaygroundTheme()` returns it;
	 * the defaults and the build's theme when left out.
	 */
	constructor(theme: PlaygroundTheme = withPlaygroundDefaults(null)) {
		this._theme = theme;
	}

	/**
	 * The playground's theme.
	 *
	 * @deprecated Use `usePlaygroundTheme()`.
	 */
	get theme(): PlaygroundTheme {
		return this._theme;
	}
}
