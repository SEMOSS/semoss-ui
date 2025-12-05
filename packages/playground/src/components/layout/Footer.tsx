import { observer } from "mobx-react-lite";
import type React from "react";
import { useRoot } from "@/hooks";

export const Footer: React.FC = observer(() => {
	const { root } = useRoot();
	if (!root.theme.playground.playgroundFooter) return null;

	return (
		<footer className="w-full border-gray-200 border-t bg-gray-50 px-6 py-2 text-gray-600 text-sm">
			<div className="mx-auto w-full flex-row items-center text-center align-middle">
				<div
					// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
					dangerouslySetInnerHTML={{
						__html: root.theme.playground.playgroundFooter,
					}}
				></div>{" "}
			</div>
		</footer>
	);
});
