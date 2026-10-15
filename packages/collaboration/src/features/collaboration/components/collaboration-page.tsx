import type { ReactNode } from "react";

/** The daily Brief's canvas, reading width, and responsive spacing for workspace pages. */
export function CollaborationPage({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-muted/15 px-4 py-6 sm:px-6 lg:p-8">
			<div className="mx-auto w-full max-w-screen-2xl">{children}</div>
		</div>
	);
}
