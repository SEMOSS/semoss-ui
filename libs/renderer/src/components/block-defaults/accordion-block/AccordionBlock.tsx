import { ArrowDropDown } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { Accordion, Stack, styled } from "@semoss/ui";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { Slot } from "../../blocks";

const StyledAccordion = styled(Accordion)({
	padding: 0,
	margin: 0,
	borderRadius: "12px",
	"&.MuiAccordion-root:before": {
		backgroundColor: "white",
	},
});

const AccordionTrigger = styled(Accordion.Trigger)({
	"& .MuiAccordionSummary-content": {
		margin: 0,
	},
	minHeight: "fit-content",
	margin: 0,
	padding: 0,
	borderRadius: "inherit",
	//if accordion is expanded, then remove the border radius from bottom left and right side of the trigger element
	"&.MuiButtonBase-root.Mui-expanded": {
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
	},
});

const AccordionContent = styled(Accordion.Content)({
	margin: 0,
	padding: 0,
	borderRadius: "inherit",
	borderTopLeftRadius: 0,
	borderTopRightRadius: 0,
});

export interface AccordionBlockDef extends BlockDef<"accordion"> {
	widget: "accordion";
	data: {
		style: CSSProperties;
		triggerBgColor: string;
		contentBgColor: string;
		showExpandIcon: boolean;
		show: string;
	};
	slots: {
		header: true;
		content: true;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const AccordionBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, slots, listeners } = useBlock<AccordionBlockDef>(id);

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	return (
		<StyledAccordion
			{...attrs}
			sx={{ ...data.style, overflow: "hidden" }}
			square={true}
			disableGutters={true}
		>
			<AccordionTrigger
				sx={{
					backgroundColor: data.triggerBgColor,
				}}
				expandIcon={data.showExpandIcon ? <ArrowDropDown /> : null}
			>
				<Stack sx={{ width: "100%" }}>
					<Slot slot={slots.header} />
				</Stack>
			</AccordionTrigger>
			<AccordionContent sx={{ backgroundColor: data.contentBgColor }}>
				<Slot slot={slots.content} />
			</AccordionContent>
		</StyledAccordion>
	);
});
