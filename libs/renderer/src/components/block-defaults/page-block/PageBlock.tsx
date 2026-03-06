import { styled } from "@mui/material";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { LoadingScreen } from "@semoss/ui";
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
const StyledPageContainer = styled("div")(({ theme }) => ({
	// position Set to relative so we can have a modal to attach to page block
	position: "relative",
	width: "100%",
	background: theme.palette.background.paper,
	overflow: "scroll",
}));

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
		<StyledPageContainer id={id} sx={data.style} {...attrs} data-page>
			{/* TODO: Make Loading Screen relative to the Page */}
			<LoadingScreen>
				{isLoading ? <LoadingScreen.Trigger /> : null}
				<Slot slot={slots.content}></Slot>
			</LoadingScreen>
		</StyledPageContainer>
	);
});
