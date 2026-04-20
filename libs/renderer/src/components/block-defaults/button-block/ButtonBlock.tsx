import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { Button, Spinner } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface ButtonBlockDef extends BlockDef<"button"> {
	widget: "button";
	data: {
		style: CSSProperties;
		label: string;
		loading?: boolean;
		disabled?: boolean;
		variant: "contained" | "outlined" | "text";
		color: "primary" | "secondary" | "success" | "warning" | "error";
		show: string;
		type: "button" | "submit" | "reset";
	};
	listeners: {
		onClick: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

const variantMap: Record<
	ButtonBlockDef["data"]["variant"],
	"default" | "outline" | "ghost"
> = {
	contained: "default",
	outlined: "outline",
	text: "ghost",
};

export const ButtonBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<ButtonBlockDef>(id);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	return (
		<div {...attrs} className="p-0.5">
			<Button
				variant={variantMap[data.variant] ?? "default"}
				disabled={data?.disabled || data?.loading}
				type={data?.type}
				style={data.style}
				onClick={() => {
					listeners.onClick();
				}}
			>
				{data?.loading && <Spinner className="mr-1 size-4" />}
				<span
					style={{ visibility: data?.loading ? "hidden" : "visible" }}
				>
					{data.label}
				</span>
			</Button>
		</div>
	);
});
