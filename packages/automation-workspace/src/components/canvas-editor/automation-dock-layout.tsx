import type { ReactNode } from "react";

interface AutomationDockLayoutProps {
	canvas: ReactNode;
}

/** Renders the editor canvas; host workspace owns Inspector, Files, Chat, and Run details tabs. */
export function AutomationDockLayout({ canvas }: AutomationDockLayoutProps) {
	return (
		<div className="relative h-full w-full overflow-hidden">{canvas}</div>
	);
}
