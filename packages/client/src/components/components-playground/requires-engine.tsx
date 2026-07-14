import { PlugZap } from "lucide-react";
import type { ReactNode } from "react";
import { useEngineConnect } from "./engine-connect-context";

interface RequiresEngineProps {
	children: ReactNode;
}

/** Gates a backend-reaching demo behind a connected engine — shown instead
 * of letting the demo crash with an "engine required" pixel error. */
export const RequiresEngine = ({ children }: RequiresEngineProps) => {
	const { engine } = useEngineConnect();

	if (!engine) {
		return (
			<div className="flex flex-col items-center gap-2 rounded-lg border border-border border-dashed py-10 text-center text-muted-foreground text-sm">
				<PlugZap className="size-5" />
				Pick a live demo engine above to try this component against the
				real backend.
			</div>
		);
	}

	return <>{children}</>;
};
