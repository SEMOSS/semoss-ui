import { observer } from "mobx-react-lite";
import React, { type CSSProperties, useEffect } from "react";
import { Skeleton } from "@semoss/ui/next";
import { useBlock, useBlocks, useTypeWriter } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { showBlock } from "../../blocks/RendererEngine";

export interface TextBlockDef extends BlockDef<"text"> {
	widget: "text";
	data: {
		showPlaceholder: boolean;
		style: CSSProperties;
		text: string;
		variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
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

export const TextBlock: BlockComponent = observer(({ id }) => {
	// const { attrs, data } = useBlock<TextBlockDef>(id);
	const block = useBlock<TextBlockDef>(id);
	const state = useBlocks();
	const { attrs, data, listeners } = block;

	const textContent =
		typeof data.text === "string" ? data.text : JSON.stringify(data.text);
	let displayTxt = useTypeWriter(data.isStreaming ? textContent : "");

	if (!data.isStreaming) displayTxt = textContent;

	// Show placeholder or empty string if no value
	const showPlaceholder = data.showPlaceholder;
	if (!displayTxt || displayTxt.trim() === "") {
		if (showPlaceholder) {
			displayTxt = "Waiting for value...";
		} else {
			displayTxt = "";
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
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
				<Skeleton className="h-full w-full" />
			</div>
		);
	}

	// TODO: Why?
	return showBlock(block, state)
		? React.createElement(
				data.variant ? data.variant : "p",
				{
					style: {
						...data.style,
						...(data.variant === "h1"
							? { lineHeight: "116.7%" }
							: {}),
						marginBlockStart: "0px",
						marginBlockEnd: "0px",
					},
					...attrs,
				},
				displayTxt,
			)
		: React.createElement("p", {
				style: {
					...data.style,
					marginBlockStart: "0px",
					marginBlockEnd: "0px",
				},
				"data-block": id,
			});
});
