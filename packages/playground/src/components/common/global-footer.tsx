import { observer } from "mobx-react-lite";
import type React from "react";
import { useRoot } from "@/hooks";

export const GlobalFooter: React.FC = observer(() => {
	const { root } = useRoot();

	if (!root.theme.footer) {
		return null;
	}

	return (
		<footer
			className="flex min-h-10 w-full shrink-0 flex-wrap"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
			dangerouslySetInnerHTML={{
				__html: root.theme.footer,
			}}
		></footer>
	);
});
