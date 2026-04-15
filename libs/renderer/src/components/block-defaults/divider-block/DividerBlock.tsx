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
	try {
		const { attrs, data, listeners } = useBlock<DividerBlockDef>(id);

		useEffect(() => {
			if (listeners.preProcess) {
				listeners.preProcess();
			}
		}, []);

		// Determine if we should show text
		const hasText = data.showText && data.text?.trim().length > 0;

		// Calculate margin for inset/middle variants
		const insetClass =
			data.variant === "inset"
				? "ml-16"
				: data.variant === "middle"
					? "mx-16"
					: "";

		const opacity = data.light ? "opacity-50" : "";
		const minHeight =
			data.orientation === "vertical" ? { minHeight: "50px" } : {};

		return (
			<div
				{...attrs}
				style={{
					padding: "4px",
					display: "flex",
					flexDirection: "column",
					gap: "8px",
					...minHeight,
					...data.style,
				}}
			>
				{hasText ? (
					<div
						className={`flex items-center gap-2 ${data.orientation === "vertical" ? "flex-col" : ""}`}
					>
						{data.textAlign !== "left" && (
							<Separator
								orientation={data.orientation}
								className={`flex-1 ${opacity}`}
							/>
						)}
						<span
							className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0"
							style={{
								textAlign: data.textAlign as React.CSSProperties["textAlign"],
							}}
						>
							{data.text}
						</span>
						{data.textAlign !== "right" && (
							<Separator
								orientation={data.orientation}
								className={`flex-1 ${opacity}`}
							/>
						)}
					</div>
				) : (
					<Separator
						orientation={data.orientation}
						className={`${insetClass} ${opacity}`}
					/>
				)}
			</div>
		);
	} catch (error) {
		console.error("Error in DividerBlock:", error);
		return <div>Error loading Divider component</div>;
	}
});
