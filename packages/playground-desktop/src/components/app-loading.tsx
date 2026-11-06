import { Spinner } from "@semoss/ui/next";
import { TITLE_BAR_ATTRIBUTE } from "../platform/window-chrome";

/**
 * The whole window while it waits on the server (the instance's config, the
 * session). The spinner fades in after a moment, so a quick answer goes
 * straight to the next screen without a flash. The window drags by its top,
 * as on every full-window screen.
 *
 * @component
 */
export const AppLoading = () => (
	<div
		{...{ [TITLE_BAR_ATTRIBUTE]: "" }}
		className="flex h-full w-full items-center justify-center"
	>
		<div className="fade-in-0 animate-in fill-mode-backwards delay-300 duration-300">
			<Spinner />
		</div>
	</div>
);
