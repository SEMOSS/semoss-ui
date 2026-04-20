import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	return (
		<Accordion
			{...attrs}
			type="single"
			collapsible
			style={{ ...data.style, overflow: "hidden" }}
			className="m-0 rounded-xl p-0"
		>
			<AccordionItem value="item-1" className="border-0">
				<AccordionTrigger
					style={{ backgroundColor: data.triggerBgColor }}
					className={`m-0 min-h-fit rounded-[inherit] p-0 data-[state=open]:rounded-bl-none data-[state=open]:rounded-br-none${data.showExpandIcon ? "" : "[&>svg]:hidden"}`}
				>
					<div className="w-full">
						<Slot slot={slots.header} />
					</div>
				</AccordionTrigger>
				<AccordionContent
					style={{ backgroundColor: data.contentBgColor }}
					className="m-0 rounded-[inherit] rounded-tl-none rounded-tr-none p-0"
				>
					<Slot slot={slots.content} />
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
});
