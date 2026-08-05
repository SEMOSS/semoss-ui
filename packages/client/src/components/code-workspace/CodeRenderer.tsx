import { useCallback, useEffect, useRef } from "react";
import { Env } from "@semoss/sdk/react";
import { useTheme } from "@semoss/ui/next";

interface CodeRendererProps {
	/** Id of the app to render */
	appId: string;
}

/**
 * Render an app based on an id
 */
export const CodeRenderer = (props: CodeRendererProps) => {
	const { appId } = props;
	const iframeRef = useRef<HTMLIFrameElement | null>(null);
	const { resolvedTheme } = useTheme();

	const syncEmbeddedTheme = useCallback(() => {
		const iframe = iframeRef.current;
		if (!iframe) return;

		try {
			const doc = iframe.contentDocument;
			const root = doc?.documentElement;
			if (root) {
				root.classList.remove("light", "dark");
				root.classList.add(resolvedTheme);
				root.style.colorScheme = resolvedTheme;
			}
		} catch {
			// Cross-origin embeds cannot be styled directly; use postMessage fallback.
		}

		try {
			iframe.contentWindow?.postMessage(
				{
					type: "smss-theme-sync",
					theme: resolvedTheme,
				},
				"*",
			);
		} catch {
			// Ignore if target window is unavailable.
		}
	}, [resolvedTheme]);

	useEffect(() => {
		syncEmbeddedTheme();
	}, [syncEmbeddedTheme]);

	// return the app
	return (
		<iframe
			ref={iframeRef}
			className="h-full w-full flex-1 border-none"
			src={`${Env.MODULE}/public_home/${appId}/portals/`}
			data-test={`iframe--${appId}`}
			title={`App ${appId}`}
			onLoad={syncEmbeddedTheme}
		/>
	);
};
