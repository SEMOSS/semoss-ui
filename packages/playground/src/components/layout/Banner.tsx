import { observer } from "mobx-react-lite";
import type React from "react";
import { useRoot } from "@/hooks";

export const Banner: React.FC = observer(() => {
	const { root } = useRoot();

	if (!root.theme.playground.playgroundBanner) return null;

	return (
		<div className="w-full bg-primary-foreground px-4 py-2 text-center text-muted-foreground">
			<span className="text-sm">
				{root.theme.playground.playgroundBanner}
			</span>
		</div>
	);
});
