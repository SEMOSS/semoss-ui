import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { Spinner } from "@semoss/ui/next";
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
			style={data.style}
			{...attrs}
			data-page
			className="relative w-full bg-background overflow-auto"
		>
			{isLoading && (
				<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
					<Spinner className="size-8" />
				</div>
			)}
			<Slot slot={slots.content}></Slot>
		</div>
	);
});
