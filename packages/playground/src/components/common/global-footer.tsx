import { observer } from "mobx-react-lite";
import type React from "react";
import { usePlaygroundTheme } from "@/hooks/use-playground-theme";

export const GlobalFooter: React.FC = observer(() => {
	const theme = usePlaygroundTheme();

	if (!theme.footer) {
		return null;
	}

	return (
		<footer
			className="flex min-h-10 w-full shrink-0 flex-wrap items-center border-t bg-background px-4 py-2 text-muted-foreground text-xs"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
			dangerouslySetInnerHTML={{
				__html: theme.footer,
			}}
		></footer>
	);
});
