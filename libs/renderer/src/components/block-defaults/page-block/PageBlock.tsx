import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { Button, LoadingScreen } from "@semoss/ui";
import { Slot } from "../../../components/blocks";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface PageBlockDef extends BlockDef<"page"> {
	widget: "page";
	data: {
		style: CSSProperties;
		loading: boolean | string;
	};
	slots: {
		content: true;
	};
	listeners: {
		onPageLoad: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const PageBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, slots, listeners } = useBlock<PageBlockDef>(id);

	// when the page is mounted, trigger the onPageLoad event
	useEffect(() => {
		if (listeners.onPageLoad) {
			listeners.onPageLoad();
		}
	}, []);

	const isLoading =
		typeof data.loading === "string"
			? data.loading.toLowerCase() === "true"
			: data.loading;

	return (
		<div
			id={id}
			style={{
				// position Set to relative so we can have a modal to attach to page block
				// height: 'inherit',
				position: "relative",
				width: "100%",
				height: "100%",
				background: "#FFFFFF",
				overflow: "scroll",
				...data.style,
			}}
			{...attrs}
			data-page
		>
			{/* TODO: Make Loading Screen relative to the Page */}
			<LoadingScreen>
				{isLoading ? <LoadingScreen.Trigger /> : null}
				<Slot slot={slots.content}></Slot>
			</LoadingScreen>
		</div>
	);
});
