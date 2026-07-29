import { observer } from "mobx-react-lite";
import { type CSSProperties, useCallback, useEffect, useRef } from "react";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface IframeBlockDef extends BlockDef<"iframe"> {
	widget: "iframe";
	data: {
		style: CSSProperties;
		src: string;
		title: string;
		enableFrameInteractions: boolean;
		show: string;
	};
	slots: never;
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const IframeBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<IframeBlockDef>(id);
	const iframeRef = useRef<HTMLIFrameElement | null>(null);

	const syncFrameTheme = useCallback(() => {
		const iframe = iframeRef.current;
		if (!iframe) return;

		const theme =
			typeof document !== "undefined" &&
			document.documentElement.classList.contains("dark")
				? "dark"
				: "light";

		try {
			const root = iframe.contentDocument?.documentElement;
			if (root) {
				root.classList.remove("light", "dark");
				root.classList.add(theme);
				root.style.colorScheme = theme;
			}
		} catch {
			// Cross-origin iframes cannot be directly styled.
		}

		try {
			iframe.contentWindow?.postMessage(
				{ type: "smss-theme-sync", theme },
				"*",
			);
		} catch {
			// Ignore if frame window is unavailable.
		}
	}, []);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	useEffect(() => {
		const root =
			typeof document !== "undefined" ? document.documentElement : null;
		if (!root) return;

		syncFrameTheme();
		const observer = new MutationObserver(syncFrameTheme);
		observer.observe(root, {
			attributes: true,
			attributeFilter: ["class"],
		});

		return () => observer.disconnect();
	}, [syncFrameTheme]);

	return (
		<span
			style={{
				width: "100%",
				height: "400px",
				display: "block",
				...data.style,
			}}
			{...attrs}
		>
			<iframe
				ref={iframeRef}
				style={{
					width: "100%",
					height: "100%",
					pointerEvents: !data.enableFrameInteractions
						? "none"
						: "auto",
				}}
				src={data.src}
				title={data.title}
				data-block-frame={id}
				onLoad={syncFrameTheme}
			/>
		</span>
	);
});
