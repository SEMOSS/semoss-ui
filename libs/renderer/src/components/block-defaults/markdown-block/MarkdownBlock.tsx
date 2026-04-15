import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { Markdown, Skeleton } from "@semoss/ui/next";
import { useBlock, useTypeWriter } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface MarkdownBlockDef extends BlockDef<"markdown"> {
	widget: "markdown";
	data: {
		style: CSSProperties;
		markdown: string;
		isStreaming: boolean;
		show: string;
		loading: boolean | string;
		loadType: string;
	};
	slots: never;
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const MarkdownBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<MarkdownBlockDef>(id);
	const markdownTxt =
		typeof data.markdown == "string"
			? data.markdown
			: JSON.stringify(data.markdown);
	let displayTxt = useTypeWriter(data.isStreaming ? markdownTxt : "");

	if (!data.isStreaming) displayTxt = markdownTxt;

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const isLoading =
		Object.hasOwn(data, "loading") &&
		data.loading?.toString().toLowerCase() === "true";

	if (isLoading && data.loadType === "None (show nothing)") {
		return <div {...attrs} />;
	}

	if (isLoading && data.loadType === "Skeleton") {
		return (
			<div
				style={{
					width: "auto",
					height: "auto",
				}}
				{...attrs}
			>
				<Skeleton className="w-full h-32 rounded-md" />
			</div>
		);
	}

	return (
		<div
			style={{
				...data.style,
			}}
			{...attrs}
		>
			<Markdown>{displayTxt}</Markdown>
		</div>
	);
});
