import { PanelLeftIcon, Settings2Icon } from "lucide-react";
import type { CSSProperties } from "react";
import { APP_NAME } from "../../electron/app-info";

// -webkit-app-region isn't in React's CSSProperties typing, hence the casts.
// Height (40px/h-10) must match create-main-window.ts's mac
// trafficLightPosition.y and win/linux titleBarOverlay.height so native
// window controls line up with this strip instead of looking like two bars.
const dragRegion: CSSProperties = { WebkitAppRegion: "drag" } as CSSProperties;
const noDragRegion: CSSProperties = {
	WebkitAppRegion: "no-drag",
} as CSSProperties;

export interface TitleBarProps {
	/** The saved alias of the connection currently in use, if any. */
	currentConnectionAlias?: string;
	onOpenSettings: () => void;
	sidebarOpen: boolean;
	onToggleSidebar: () => void;
}

/**
 * A custom, seamless title-bar strip — see
 * https://www.electronjs.org/docs/latest/tutorial/custom-title-bar.
 * The window itself is created with titleBarStyle: "hidden" (mac) /
 * titleBarOverlay (win/linux), so this is the *only* title bar; without
 * app-region: drag here the window couldn't be dragged at all.
 */
export const TitleBar = ({
	currentConnectionAlias,
	onOpenSettings,
	sidebarOpen,
	onToggleSidebar,
}: TitleBarProps) => (
	<div
		className="relative flex h-10 shrink-0 select-none items-center border-border border-b bg-background px-3 text-muted-foreground text-xs"
		style={dragRegion}
	>
		{/* left-20 clears macOS's traffic lights (reserved ~90px); on
		Windows/Linux this just leaves a little breathing room next to the
		edge — simpler than threading platform info into the renderer just
		for this. */}
		<button
			type="button"
			onClick={onToggleSidebar}
			style={noDragRegion}
			aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
			aria-pressed={sidebarOpen}
			className="absolute left-20 flex items-center rounded-md p-1.5 hover:bg-accent"
		>
			<PanelLeftIcon className="size-3.5" />
		</button>
		<span className="flex-1 text-center">{APP_NAME}</span>
		<button
			type="button"
			onClick={onOpenSettings}
			style={noDragRegion}
			className="-mr-1 absolute right-3 flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-accent"
		>
			<Settings2Icon className="size-3.5" />
			{currentConnectionAlias ?? "Not connected"}
		</button>
	</div>
);
