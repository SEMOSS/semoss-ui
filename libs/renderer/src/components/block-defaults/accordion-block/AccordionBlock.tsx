import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { Slot } from "../../blocks";

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
		<div
			{...attrs}
			style={{
				overflow: "hidden",
				borderRadius: "12px",
				...data.style,
			}}
		>
			<Accordion type="single" collapsible className="w-full border rounded-md">
				<AccordionItem value="content" className="border-0">
					<AccordionTrigger
						className="px-4 py-3 rounded-t-md hover:no-underline"
						style={{
							backgroundColor: data.triggerBgColor || "transparent",
						}}
					>
						<div className="w-full text-left">
							<Slot slot={slots.header} />
						</div>
					</AccordionTrigger>
					<AccordionContent
						style={{
							backgroundColor:
								data.contentBgColor || "transparent",
						}}
						className="px-4"
					>
						<Slot slot={slots.content} />
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
});
