import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { Separator } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface DividerBlockDef extends BlockDef<"divider"> {
	widget: "divider";
	data: {
		style: CSSProperties;
		variant: "fullWidth" | "inset" | "middle";
		orientation: "horizontal" | "vertical";
		textAlign: "center" | "right" | "left";
		flexItem: boolean;
		light: boolean;
		text: string;
		showText: boolean;
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

export const DividerBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<DividerBlockDef>(id);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	try {
		const hasText = data.showText && data.text?.trim().length > 0;
		const isVertical = data.orientation === "vertical";

		return (
			<div
				{...attrs}
				style={data.style}
				className={`flex flex-col gap-2 p-1${isVertical ? "min-h-[50px]" : ""}`}
			>
				{hasText ? (
					<div className="flex items-center gap-2">
						<Separator
							orientation={data.orientation}
							className={isVertical ? "h-full" : ""}
						/>
						<span className="whitespace-nowrap text-muted-foreground text-sm">
							{data.text}
						</span>
						<Separator
							orientation={data.orientation}
							className={isVertical ? "h-full" : ""}
						/>
					</div>
				) : (
					<Separator orientation={data.orientation} />
				)}
			</div>
		);
	} catch (error) {
		console.error("Error in DividerBlock:", error);
		return <div>Error loading Divider component</div>;
	}
});
